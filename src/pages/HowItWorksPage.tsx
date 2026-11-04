import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileSearch,
  CalendarCheck,
  Handshake,
  CheckCircle,
  HelpCircle,
  Scale,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full text-right">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="warm" className="mb-3">
            دليل شقتي
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--dp-color-ink)] leading-tight">
            كيف تعمل منصة شقتي في مصر؟
          </h1>
          <p className="text-base text-[#626d84] mt-3">
            منظومة رقمية متكاملة تضمن تجربة بيع وشراء عقارية خالية من المخاطر أو العمولات الخفية.
          </p>
        </div>

        {/* Process Steps */}
        <div className="space-y-8 mb-16">
          {[
            {
              step: '1',
              title: 'للبائعين: عرض العقار والتحقق من المستندات',
              desc: 'يقوم صاحب العقار بتسجيل بيانات شقته أو فيلته ورفع صور واضحة ونسخة من أوراق الملكية الرسمية. يقوم فريقنا القانوني بمراجعة تسلسل الملكية وتراخيص البناء وتأكيد أن العقار خالي من النزاعات.',
              icon: <FileSearch className="w-8 h-8 text-[var(--dp-color-accent)] stroke-[2.2]" />,
              badge: 'خطوة التوثيق',
            },
            {
              step: '2',
              title: 'للمشترين: استكشاف واختيار العقار الموثق',
              desc: 'يتصفح المشترون مئات العقارات المفحوصة، مع الاطلاع على الأسعار الحقيقية بالجنيه المصري والمساحات الدقيقة ومواصفات التشطيب دون أي مبالغة أو معلومات مضللة.',
              icon: <ShieldCheck className="w-8 h-8 text-emerald-600 stroke-[2.2]" />,
              badge: 'حماية المشتري',
            },
            {
              step: '3',
              title: 'جدولة موعد المعاينة الميدانية',
              desc: 'بضغطة زر واحدة، يختار المشتري اليوم والوقت المناسب لزيارة العقار. يتلقى البائع والمشتري إشعاراً بتأكيد الموعد مع كافة بيانات التواصل الرسمية.',
              icon: <CalendarCheck className="w-8 h-8 text-amber-600 stroke-[2.2]" />,
              badge: 'معاينة آمنة',
            },
            {
              step: '4',
              title: 'التفاوض المباشر وإتمام التعاقد',
              desc: 'يلتقي الطرفان لمعاينة العقار على الطبيعة والاتفاق على شروط الدفع والتعاقد مباشرة، مع إمكانية طلب مساعدة قانونية من خبراء شقتي لصياغة العقود النهائية.',
              icon: <Handshake className="w-8 h-8 text-pink-600 stroke-[2.2]" />,
              badge: 'التعاقد المباشر',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard flex flex-col sm:flex-row items-start gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-[var(--dp-color-field-soft)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center shrink-0 shadow-hard-sm">
                {item.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" size="sm">
                    {item.badge}
                  </Badge>
                  <span className="text-xs font-black text-[#8b95aa]">المرحلة {item.step}</span>
                </div>
                <h3 className="text-xl font-black text-[var(--dp-color-ink)] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#4b5563] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Legal FAQ Section */}
        <div className="bg-[var(--dp-color-selection)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-8 shadow-hard mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-[var(--dp-color-accent)] stroke-[2.5]" />
            <h2 className="text-2xl font-black text-[var(--dp-color-ink)]">
              الضمانات القانونية في شقتي
            </h2>
          </div>
          <div className="space-y-4 text-sm text-[#374151] leading-relaxed">
            <p>
              نحن في شقتي نؤمن بأن المعاملات العقارية يجب أن تبنى على الثقة والشفافية التامة. لذلك نعتمد معايير فحص صارمة لجميع المستندات قبل منح أي عقار شارة "موثق".
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>مراجعة تسلسل الملكية والعقود المسجلة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>التحقق من تراخيص البناء والمصالحة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>التأكد من خلو العقار من أي حظر أو نزاع قضائي</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>حماية هوية وخصوصية أصحاب العقارات</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/properties">
            <Button variant="primary" size="lg">
              ابدأ الآن واستكشف العقارات
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

