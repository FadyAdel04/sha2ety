import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  PhoneCall,
  Mail,
  MapPin,
  ArrowLeft,
  Shield,
  FileCheck2,
  Share2,
} from 'lucide-react';

export interface FooterProps {
  hideSellerCta?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ hideSellerCta = false }) => {
  return (
    <footer className="w-full mt-16 overflow-hidden">
      {/* ----------------------------------------------------
          8. Seller CTA: Pale mint closing section with geometric confetti
         ---------------------------------------------------- */}
      {!hideSellerCta && (
        <section className="relative bg-[var(--dp-color-field-soft)] border-t-[3px] border-[var(--dp-color-outline)] pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden text-right">
          {/* Geometric Confetti Elements (static outlined shapes) */}
          <div className="absolute top-6 right-10 w-8 h-8 rounded-lg bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] rotate-12 pointer-events-none hidden sm:block shadow-hard-sm" />
          <div className="absolute top-12 left-16 w-6 h-6 rounded-full bg-[var(--dp-color-accent-secondary)] border-[2px] border-[var(--dp-color-outline)] pointer-events-none hidden sm:block shadow-hard-sm" />
          <div className="absolute bottom-10 right-1/4 w-7 h-7 bg-[var(--dp-color-accent)] border-[2px] border-[var(--dp-color-outline)] -rotate-12 pointer-events-none hidden md:block" />
          <div className="absolute top-1/2 left-8 w-5 h-5 rounded-md bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] rotate-45 pointer-events-none hidden lg:block" />
          <div className="absolute bottom-12 left-1/3 w-8 h-4 rounded-full bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] rotate-6 pointer-events-none hidden md:block" />

          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-[2px] border-[var(--dp-color-outline)] rounded-full text-xs font-black text-[var(--dp-color-ink)] mb-3 shadow-hard-sm">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                خطوة بيع سهلة ومباشرة
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[var(--dp-color-ink)] leading-tight mb-3">
                عندك عقار؟ خليه يوصل للي بيدور عليه.
              </h2>
              <p className="text-base sm:text-lg text-[#3e4c59] font-medium leading-relaxed">
                سجل بيانات شقتك أو فيلتك في دقائق، وارفع صورك ومستنداتك لتصل إلى آلاف المشترين الجادين يومياً في مصر.
              </p>
            </div>

            <div className="shrink-0">
              <Link to="/seller/properties/new">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<ArrowLeft className="w-5 h-5 stroke-[2.5]" />}
                  className="shadow-hard-lg text-base px-8 py-4"
                >
                  ابدأ عرض عقارك
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------
          9. Footer: Dark slate footer inset into mint area with a broad curved top
         ---------------------------------------------------- */}
      <div className="relative bg-[var(--dp-color-ink)] text-[#e2e8f0] rounded-t-[36px] sm:rounded-t-[48px] border-t-[3px] border-[var(--dp-color-outline)] pt-14 pb-10 px-4 sm:px-6 lg:px-8 -mt-6 z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-right">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--dp-color-accent-warm)] border-[2.5px] border-white flex items-center justify-center text-[var(--dp-color-ink)] shadow-hard-sm">
                <span className="font-display font-black text-2xl">ش</span>
              </div>
              <div>
                <span className="font-display font-black text-2xl text-white block leading-none">
                  شقتي
                </span>
                <span className="text-xs font-bold text-[#9bf1cd] block mt-1">
                  عقارك.. خطوتك الجاية
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#cbd5e1] leading-relaxed max-w-md">
              منصة عقارية مصرية تجمع بين أصحاب العقارات والباحثين عن الشراء، مع توفير بيئة تفاعلية واضحة، سهلة، وموثوقة لاستكشاف العقارات وحجز المعاينات.
            </p>

            {/* Contact Placeholders */}
            <div className="pt-2 text-xs text-[#94a3b8] flex flex-col gap-2 font-medium">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--dp-color-accent-warm)] shrink-0" />
                القاهرة، جمهورية مصر العربية
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--dp-color-accent-secondary)] shrink-0" />
                contact@sha2ety.eg
              </span>
              <span className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[var(--dp-color-accent-fresh)] shrink-0" />
                19xxx (الدعم الفني)
              </span>
            </div>
          </div>

          {/* Public Arabic Navigation */}
          <div>
            <h4 className="text-base font-black text-white mb-4 pb-2 border-b border-[#334155]">
              روابط الموقع
            </h4>
            <ul className="space-y-2.5 text-sm text-[#cbd5e1] font-medium">
              <li>
                <Link to="/" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  استكشف العقارات
                </Link>
              </li>
              <li>
                <Link to="/seller/properties/new" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  اعرض عقارك للبيع
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  كيف تعمل المنصة؟
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards */}
          <div>
            <h4 className="text-base font-black text-white mb-4 pb-2 border-b border-[#334155]">
              الحسابات ولوحات التحكم
            </h4>
            <ul className="space-y-2.5 text-sm text-[#cbd5e1] font-medium">
              <li>
                <Link to="/seller/dashboard" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  لوحة تحكم البائع
                </Link>
              </li>
              <li>
                <Link to="/buyer/dashboard" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  لوحة تحكم المشتري
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[var(--dp-color-accent-warm)] transition-colors">
                  إنشاء حساب جديد
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy, Terms, and Social Links */}
          <div>
            <h4 className="text-base font-black text-white mb-4 pb-2 border-b border-[#334155]">
              الشروط والتواصل
            </h4>
            <ul className="space-y-2.5 text-sm text-[#cbd5e1] font-medium">
              <li>
                <span className="text-[#94a3b8] hover:text-white transition-colors cursor-pointer">
                  سياسة الخصوصية
                </span>
              </li>
              <li>
                <span className="text-[#94a3b8] hover:text-white transition-colors cursor-pointer">
                  الشروط والأحكام
                </span>
              </li>
              <li>
                <span className="text-[#94a3b8] hover:text-white transition-colors cursor-pointer">
                  إرشادات فحص المستندات
                </span>
              </li>
            </ul>

            <div className="pt-5">
              <span className="text-xs font-black text-white block mb-2">تابعنا على:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {['فيسبوك', 'إنستغرام', 'لينكد إن', 'إكس'].map((net, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#334155] text-white border border-[#475569] hover:bg-[var(--dp-color-accent)] cursor-pointer transition-colors"
                  >
                    {net}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-6 pb-20 lg:pb-0 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94a3b8]">
          <p>© {new Date().getFullYear()} منصة شقتي (Sha2ety). جميع الحقوق محفوظة لجمهورية مصر العربية.</p>
          <div className="flex items-center gap-3">
            <span>العملة: الجنيه المصري (ج.م)</span>
            <span>•</span>
            <span>المساحة: المتر المربع (م²)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
