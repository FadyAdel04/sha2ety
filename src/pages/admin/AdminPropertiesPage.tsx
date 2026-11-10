import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  getAdminProperties,
  AdminProperty,
  getSampleDocUrl,
} from '@/services/adminService';
import {
  sbFetchAllProperties,
  SupabaseProperty,
} from '@/services/supabaseService';
import { PropertyReviewModal } from '@/components/admin/PropertyReviewModal';
import { formatEGP } from '@/lib/utils';
import {
  Building2,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Calendar,
  X,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LayoutGrid,
  List,
} from 'lucide-react';

export const AdminPropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<AdminProperty[]>(() => getAdminProperties());
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      const sbProps = await sbFetchAllProperties().catch(() => null);
      if (sbProps && sbProps.length > 0) {
        const mapped: AdminProperty[] = sbProps.map((p: SupabaseProperty) => {
          const cover = p.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
          const imgs = (p.images && p.images.length > 0) ? p.images : [cover];
          return {
            id: p.id,
            title: p.title,
            price: p.price,
            area: p.area,
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            city: p.city || '',
            location: p.neighborhood || p.city || '',
            type: p.property_type || 'شقة',
            imageUrl: cover,
            images: imgs,
            imagesList: imgs.map((url, i) => ({
              id: `img-${p.id}-${i}`,
              url,
              quality: 'high' as const,
            })),
            isVerified: p.is_verified || false,
            status: p.status as any,
            reviewStatus: (p.status === 'pending_review' ? 'pending_review' : p.status === 'requires_changes' ? 'requires_changes' : p.status === 'rejected' ? 'rejected' : 'published') as any,
            submissionDate: p.created_at?.slice(0, 10) || '',
            seller: {
              id: p.seller_id,
              name: (p as any).profiles?.full_name || 'بائع',
              phone: (p as any).profiles?.phone || '',
              email: (p as any).profiles?.email || '',
              registrationDate: p.created_at?.slice(0, 10) || '',
              isIdentityVerified: true,
              rating: 5,
              totalSubmitted: 1,
              approvedCount: 0,
              rejectedCount: 0,
            },
            documents: [
              {
                id: `doc-${p.id}-1`,
                name: 'عقد الملكية الموثق أو سند الملكية.pdf',
                type: 'deed',
                url: getSampleDocUrl('deed'),
                size: '2.5 MB',
                uploadDate: (p.created_at || '').slice(0, 10) || '2026-11-04',
                status: 'pending',
              },
            ],
            description: p.description || '',
            createdAt: p.created_at,
          };
        });
        setProperties(mapped);
      } else {
        setProperties(getAdminProperties());
      }
    } catch {
      setProperties(getAdminProperties());
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Status filter
      if (statusFilter !== 'all' && prop.reviewStatus !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && prop.type !== typeFilter) {
        return false;
      }

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = (prop.title || '').toLowerCase().includes(q);
        const matchSeller = (prop.seller?.name || '').toLowerCase().includes(q);
        const matchCity = (prop.city || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSeller && !matchCity) return false;
      }

      return true;
    });
  }, [properties, statusFilter, typeFilter, searchTerm]);

  const refreshList = () => {
    loadProperties();
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="fresh" size="sm">منشور وموثق</Badge>;
      case 'pending_review':
        return <Badge variant="warm" size="sm">قيد المراجعة</Badge>;
      case 'requires_changes':
        return <Badge variant="secondary" size="sm">مطلوب تعديلات</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">مرفوض</Badge>;
      default:
        return <Badge variant="muted" size="sm">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="إدارة جميع العقارات في المنصة"
      subtitle="سجل شامل بكافة العقارات المعروضة، المنشورة، المعلقة والمرفوضة في السوق."
    >
      <div className="space-y-6 text-right">
        {/* Controls Bar */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <Input
                placeholder="ابحث بالعنوان، المالك، أو المدينة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                rightIcon={<Search className="w-4 h-4 text-[#8b95aa]" />}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'جميع الحالات' },
                  { value: 'published', label: 'منشور وموثق' },
                  { value: 'pending_review', label: 'قيد المراجعة القانونية' },
                  { value: 'requires_changes', label: 'مطلوب تعديلات' },
                  { value: 'rejected', label: 'مرفوض' },
                ]}
              />
            </div>

            {/* Type Filter */}
            <div className="md:col-span-2">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'جميع الأنواع' },
                  { value: 'شقة', label: 'شقة' },
                  { value: 'فيلا', label: 'فيلا' },
                  { value: 'شاليه', label: 'شاليه' },
                  { value: 'دوبلكس', label: 'دوبلكس' },
                  { value: 'تجاري', label: 'تجاري' },
                ]}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="md:col-span-2 flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg border-[2px] border-[var(--dp-color-outline)] transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[var(--dp-color-accent)] text-white shadow-hard-sm' : 'bg-white hover:bg-gray-100'
                }`}
                title="عرض الجدول"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg border-[2px] border-[var(--dp-color-outline)] transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-[var(--dp-color-accent)] text-white shadow-hard-sm' : 'bg-white hover:bg-gray-100'
                }`}
                title="عرض البطاقات"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-[#626d84] font-bold px-1">
          <span>إجمالي العقارات المعروضة: {filteredProperties.length} عقار</span>
        </div>

        {/* View Mode: Table */}
        {viewMode === 'table' ? (
          <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard text-right">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[var(--dp-color-ground)] border-b-[2px] border-[var(--dp-color-outline)] text-xs font-black text-[#526078]">
                    <th className="p-4">العقار</th>
                    <th className="p-4">المالك</th>
                    <th className="p-4">المدينة</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">حالة المراجعة</th>
                    <th className="p-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece9db] text-xs sm:text-sm font-bold text-[var(--dp-color-ink)]">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm text-[#626d84]">
                        لا توجد عقارات مطابقة لمعايير البحث
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={prop.imageUrl}
                            alt={prop.title}
                            className="w-12 h-12 rounded-lg border border-[var(--dp-color-outline)] object-cover shrink-0"
                          />
                          <div>
                            <span className="font-black text-sm block line-clamp-1">{prop.title}</span>
                            <span className="text-xs text-[#626d84]">{prop.type} • {prop.area} م²</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-[#4b5563]">
                          <span className="block font-black text-[var(--dp-color-ink)]">{prop.seller?.name || 'بائع'}</span>
                          <span className="text-[11px] text-[#8b95aa]">{prop.seller?.phone || '-'}</span>
                        </td>
                        <td className="p-4 text-xs font-bold text-[#4b5563]">{prop.city}</td>
                        <td className="p-4 text-xs font-black text-[var(--dp-color-accent)]">
                          {formatEGP(prop.price)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            {renderStatusBadge(prop.reviewStatus)}
                            {prop.isVerified && (
                              <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                شارة التوثيق
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProperty(prop)}
                              className="text-xs"
                            >
                              فحص وتعديل
                            </Button>
                            <Link to={`/properties/${prop.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs" title="معاينة في الموقع">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* View Mode: Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
                    <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">{renderStatusBadge(prop.reviewStatus)}</div>
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-[var(--dp-color-outline)] px-2 py-0.5 rounded text-xs font-black">
                      {formatEGP(prop.price)}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-black text-sm text-[var(--dp-color-ink)] line-clamp-1">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-[#626d84]">
                      المالك: {prop.seller?.name || 'بائع'} • الموقع: {prop.city}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-[#ece9db] flex items-center justify-between gap-2 mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedProperty(prop)}
                    className="w-full text-xs"
                  >
                    مراجعة وتعديل الحالة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Review Modal */}
      <PropertyReviewModal
        isOpen={Boolean(selectedProperty)}
        onClose={() => setSelectedProperty(null)}
        property={selectedProperty}
        onActionComplete={(updated) => {
          setSelectedProperty(null);
          refreshList();
        }}
      />
    </DashboardLayout>
  );
};
