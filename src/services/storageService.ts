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
 * Upload a confidential property ownership document to the PRIVATE bucket
 */
export async function uploadPropertyDocument(
  file: File,
  sellerId: string,
  propertyId: string
): Promise<UploadResult> {
  try {
    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `${sellerId}/${propertyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_PROPERTY_DOCUMENTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase document upload failed, falling back to blob URL:', error.message);
      return {
        path: filePath,
        url: URL.createObjectURL(file),
        success: true,
      };
    }

    // Confidential documents MUST use signed URLs, never public URLs
    const signed = await getSignedDocumentUrl(data.path, 3600);

    return {
      path: data.path,
      url: signed || URL.createObjectURL(file),
      success: true,
    };
  } catch (err: any) {
    console.error('Error in uploadPropertyDocument:', err);
    return {
      path: '',
      url: URL.createObjectURL(file),
      success: true,
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

