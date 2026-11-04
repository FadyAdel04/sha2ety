import { PropertyItem } from '@/components/ui/PropertyCard';
import { getStoredPropertiesMaster } from '@/services/propertyService';

// Dynamic properties provider replacing static hardcoded mock data
export const getDynamicProperties = (): PropertyItem[] => {
  return getStoredPropertiesMaster();
};

// Proxy array that transparently reads from dynamic master storage
export const mockProperties: PropertyItem[] = new Proxy([] as PropertyItem[], {
  get(target, prop, receiver) {
    const list = getStoredPropertiesMaster();
    if (prop === 'length') return list.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return list[Number(prop)];
    }
    const val = (list as any)[prop];
    if (typeof val === 'function') {
      return val.bind(list);
    }
    return Reflect.get(target, prop, receiver);
  },
});
