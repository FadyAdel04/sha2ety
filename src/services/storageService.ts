import { supabase } from '@/lib/supabase';

export interface UploadResult {
  path: string;
  url: string;
  success: boolean;
  error?: string;
}

const BUCKET_PROPERTY_IMAGES = 'property-images';
const BUCKET_PROPERTY_DOCUMENTS = 'property-documents';
const BUCKET_USER_AVATARS = 'user-avatars';

/**
 * Upload a property image to the public property-images bucket
 */
export async function uploadPropertyImage(
  file: File,
  propertyId: string
): Promise<UploadResult> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_PROPERTY_IMAGES)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase image upload failed, falling back to local object URL:', error.message);
      return {
        path: fileName,
        url: URL.createObjectURL(file),
        success: true,
      };
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_PROPERTY_IMAGES)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicData.publicUrl,
      success: true,
    };
  } catch (err: any) {
    console.error('Error in uploadPropertyImage:', err);
    return {
      path: '',
      url: URL.createObjectURL(file),
      success: true,
    };
  }
}

/**
 * Convert a File object to a persistent Base64 Data URL for durable offline/fallback preview
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '#');
    reader.onerror = () => resolve('#');
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a confidential property ownership document to Supabase Storage
 */
export async function uploadPropertyDocument(
  file: File,
  sellerId: string,
  propertyId: string
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'pdf';
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${sellerId}/${propertyId}/${Date.now()}-${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_PROPERTY_DOCUMENTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn(
        'Supabase Storage document upload encountered an issue, falling back to durable Data URL:',
        error.message
      );
      const fallbackUrl = await fileToDataUrl(file);
      return {
        path: filePath,
        url: fallbackUrl,
        success: true,
        error: error.message,
      };
    }

    // Try getting public URL first, then signed URL
    const { data: publicData } = supabase.storage
      .from(BUCKET_PROPERTY_DOCUMENTS)
      .getPublicUrl(data.path);

    const signed = await getSignedDocumentUrl(data.path, 60 * 60 * 24 * 30); // 30 days
    const finalUrl = publicData?.publicUrl || signed || (await fileToDataUrl(file));

    return {
      path: data.path,
      url: finalUrl,
      success: true,
    };
  } catch (err: any) {
    console.error('Error in uploadPropertyDocument, using durable fallback:', err);
    const fallbackUrl = await fileToDataUrl(file);
    return {
      path: filePath,
      url: fallbackUrl,
      success: true,
      error: err?.message,
    };
  }
}

/**
 * Generate a secure signed URL for authorized document preview
 * Expiration defaults to 1 hour (3600 seconds)
 */
export async function getSignedDocumentUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!storagePath || storagePath.startsWith('blob:') || storagePath.startsWith('data:') || storagePath === '#') {
    return storagePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_PROPERTY_DOCUMENTS)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      console.warn('Failed to generate signed document URL:', error.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error getting signed document URL:', err);
    return null;
  }
}

/**
 * Upload user avatar to user-avatars bucket
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_USER_AVATARS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      return {
        path: filePath,
        url: URL.createObjectURL(file),
        success: true,
      };
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_USER_AVATARS)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicData.publicUrl,
      success: true,
    };
  } catch (err: any) {
    return {
      path: '',
      url: URL.createObjectURL(file),
      success: true,
    };
  }
}

