import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Building, Home, Building2, Store, Trees, ArrowLeft } from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  typeParam: string;
  count: string;
  image: string;
  accentBg: string;
  icon: React.ReactNode;
}

export const CategoryGrid: React.FC = () => {
  const categories: CategoryItem[] = [
    {
      id: 'apartments',
      name: 'شقق',
      typeParam: 'شقة',
      count: '+740 عقار',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      accentBg: 'bg-[var(--dp-color-accent)]',
      icon: <Building className="w-5 h-5 text-white stroke-[2.5]" />,
    },
    {
      id: 'villas',
      name: 'فيلات',
      typeParam: 'فيلا',
      count: '+290 عقار',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
      accentBg: 'bg-[var(--dp-color-accent-warm)]',
      icon: <Home className="w-5 h-5 text-[var(--dp-color-ink)] stroke-[2.5]" />,
    },
    {
      id: 'houses',
      name: 'منازل',
      typeParam: 'منزل',
      count: '+150 عقار',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
      accentBg: 'bg-[var(--dp-color-accent-fresh)]',
      icon: <Building2 className="w-5 h-5 text-[var(--dp-color-ink)] stroke-[2.5]" />,
    },
    {
      id: 'commercial',
      name: 'عقارات تجارية',
      typeParam: 'تجاري',
      count: '+180 عقار',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
      accentBg: 'bg-[var(--dp-color-accent-secondary)]',
      icon: <Store className="w-5 h-5 text-white stroke-[2.5]" />,
    },
    {
      id: 'lands',
      name: 'أراضٍ',
      typeParam: 'أرض',
      count: '+95 قطعة',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
      accentBg: 'bg-[var(--dp-color-selection)]',
      icon: <Trees className="w-5 h-5 text-[var(--dp-color-accent)] stroke-[2.5]" />,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <Badge variant="warm" className="mb-2">
            استكشاف بحسب النوع
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--dp-color-ink)]">
            دور على اللي يناسبك
          </h2>
          <p className="text-sm text-[#626d84] mt-1 font-medium">
            تصفح مختلف فئات العقارات المتاحة للبيع في كافة المحافظات
          </p>
        </div>

        <Link
          to="/properties"
          className="text-sm font-black text-[var(--dp-color-accent)] hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>تصفح كل الفئات</span>
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/properties?type=${encodeURIComponent(cat.typeParam)}`}
            className="group relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all duration-[180ms] flex flex-col"
          >
            {/* Image Aspect Box */}
            <div className="relative aspect-4/3 w-full overflow-hidden border-b-[2.5px] border-[var(--dp-color-outline)] bg-[#f3f1e8]">
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-xl border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center shadow-hard-sm ${cat.accentBg}`}
              >
                {cat.icon}
              </div>
            </div>

            {/* Content text */}
            <div className="p-3.5 text-right flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-accent)] transition-colors">
                  {cat.name}
                </h3>
                <span className="text-xs font-bold text-[#626d84] mt-0.5 block">
                  {cat.count}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

