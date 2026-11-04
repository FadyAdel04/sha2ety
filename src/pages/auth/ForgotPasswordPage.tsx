import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { KeyRound, ArrowRight, MailCheck, Home } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني المسجل.');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword(email);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col justify-between">
      {/* Top Bar with Brand Link */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-[var(--dp-color-accent)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center text-white shadow-hard-sm group-hover:-translate-y-0.5 transition-all">
            <span className="font-display font-black text-2xl">ش</span>
          </div>
          <div className="text-right">
            <span className="font-display font-black text-2xl text-[var(--dp-color-ink)] block leading-none">
              شقتي
            </span>
            <span className="text-[11px] font-bold text-[#626d84] block mt-1">
              عقارك.. خطوتك الجاية
            </span>
          </div>
        </Link>

        <Link to="/login">
          <Button variant="outline" size="sm">
            العودة لتسجيل الدخول
          </Button>
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-8">
        <div className="relative">
          {/* Violet/Secondary Backing */}
          <div
            className="absolute inset-0 bg-[var(--dp-color-accent-secondary)] rounded-[calc(var(--dp-radius-corner)+6px)] translate-x-2.5 translate-y-2.5 border-[3px] border-[var(--dp-color-outline)]"
            aria-hidden="true"
          />

          <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-7 sm:p-9 shadow-hard text-right">
            <div className="mb-6 border-b-2 border-[#ece9db] pb-4">
              <Badge variant="secondary" className="mb-2">
                استعادة الحساب
              </Badge>
              <h1 className="text-2xl font-black text-[var(--dp-color-ink)]">
                نسيت كلمة المرور؟
              </h1>
              <p className="text-xs sm:text-sm text-[#626d84] mt-1 font-medium">
                أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border-[2px] border-rose-500 rounded-xl text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {submitted ? (
              <div className="p-5 bg-[var(--dp-color-field-soft)] border-[2px] border-[var(--dp-color-outline)] rounded-xl text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-center text-emerald-700 mx-auto shadow-hard-sm">
                  <MailCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--dp-color-ink)]">
                    تم إرسال رابط إعادة التعيين!
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-1 leading-relaxed">
                    تحقق من صندوق الوارد في بريدك الإلكتروني <span className="font-bold text-[var(--dp-color-ink)]">{email}</span> واتبع التعليمات لتعيين كلمة مرور جديدة.
                  </p>
                </div>
                <Link to="/login" className="block pt-2">
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    العودة لصفحة تسجيل الدخول
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="البريد الإلكتروني المسجل"
                  type="email"
                  placeholder="example@mail.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-hard text-base"
                    isLoading={isSubmitting}
                    rightIcon={<KeyRound className="w-4 h-4 stroke-[2.5]" />}
                  >
                    إرسال رابط الاستعادة
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-5 border-t-2 border-[#ece9db] text-center text-xs font-bold text-[#626d84]">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[var(--dp-color-accent)] hover:underline"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                العودة لصفحة تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs font-bold text-[#8b95aa]">
        © {new Date().getFullYear()} منصة شقتي (Sha2ety)
      </footer>
    </div>
  );
};
