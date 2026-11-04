import { PropertyItem } from '@/components/ui/PropertyCard';

const STORAGE_KEY = 'sha2ety_comparison_list';
const MAX_COMPARISON_ITEMS = 3;

// Event for cross-component reactive updates
export const COMPARISON_CHANGE_EVENT = 'sha2ety_comparison_changed';

export function getComparisonList(): PropertyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function isInComparison(propertyId: string): boolean {
  const list = getComparisonList();
  return list.some((p) => p.id === propertyId);
}

export function addToComparison(property: PropertyItem): { success: boolean; message: string } {
  const list = getComparisonList();
  if (list.some((p) => p.id === property.id)) {
    return { success: false, message: 'العقار موجود بالفعل في قائمة المقارنة.' };
  }

  if (list.length >= MAX_COMPARISON_ITEMS) {
    return {
      success: false,
      message: `الحد الأقصى للمقارنة هو ${MAX_COMPARISON_ITEMS} عقارات في المرة الواحدة.`,
    };
  }

  const updated = [...list, property];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(COMPARISON_CHANGE_EVENT));
  } catch {
    // Ignore
  }

  return { success: true, message: 'تمت إضافة العقار للمقارنة بنجاح.' };
}

export function removeFromComparison(propertyId: string): void {
  const list = getComparisonList();
  const updated = list.filter((p) => p.id !== propertyId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(COMPARISON_CHANGE_EVENT));
  } catch {
    // Ignore
  }
}

export function clearComparison(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(COMPARISON_CHANGE_EVENT));
  } catch {
    // Ignore
  }
}

