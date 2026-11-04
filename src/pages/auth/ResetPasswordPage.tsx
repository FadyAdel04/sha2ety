import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('يجب ألا تقل كلمة المرور عن 8 خانات.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(password);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col justify-between">
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--dp-color-accent)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center text-white shadow-hard-sm">
            <span className="font-display font-black text-2xl">ش</span>
          </div>
          <span className="font-display font-black text-2xl text-[var(--dp-color-ink)]">
            شقتي
          </span>
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-8">
        <div className="relative">
          <div
            className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+6px)] translate-x-2.5 translate-y-2.5 border-[3px] border-[var(--dp-color-outline)]"
            aria-hidden="true"
          />

          <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-7 sm:p-9 shadow-hard text-right">
            <div className="mb-6 border-b-2 border-[#ece9db] pb-4">
              <Badge variant="primary" className="mb-2">
                كلمة مرور جديدة
              </Badge>
              <h1 className="text-2xl font-black text-[var(--dp-color-ink)]">
                تعيين كلمة المرور الجديدة
              </h1>
              <p className="text-xs text-[#626d84] mt-1">
                اختر كلمة مرور قوية تتكون من 8 خانات على الأقل
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-400 rounded-xl text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            {success ? (
              <div className="p-5 bg-[var(--dp-color-field-soft)] border-[2px] border-[var(--dp-color-outline)] rounded-xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-black text-[var(--dp-color-ink)]">
                  تم تحديث كلمة المرور بنجاح!
                </h3>
                <p className="text-xs text-[#4b5563]">
                  يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
                </p>
                <div className="pt-2">
                  <Button variant="primary" size="md" onClick={() => navigate('/login')}>
                    الانتقال لتسجيل الدخول
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-[var(--dp-color-ink)]">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 pl-11 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 p-1 text-[var(--dp-color-ink)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-bold text-[var(--dp-color-ink)]">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 text-sm font-medium"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-hard"
                    isLoading={isSubmitting}
                  >
                    حفظ كلمة المرور والدخول
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs font-bold text-[#8b95aa]">
        © {new Date().getFullYear()} منصة شقتي (Sha2ety)
      </footer>
    </div>
  );
};

