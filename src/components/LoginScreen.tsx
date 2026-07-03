import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Sparkles, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmail } from '../lib/auth';

interface Props {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials'
        ? 'بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة السر.'
        : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl space-y-6 text-right relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-teal-300 font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام سحاب المتكامل</span>
          </div>
          <h1 className="text-2xl font-black text-white">بوابة الدخول الآمنة</h1>
          <p className="text-slate-400 text-xs">
            أدخل بريدك الإلكتروني وكلمة السر للدخول إلى لوحة التحكم.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              required
              className="w-full bg-slate-950/60 text-white border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">كلمة السر</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-slate-950/60 text-white border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition-colors pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{loading ? 'جاري الدخول...' : 'دخول'}</span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600">
          نظام سحاب ممتثل لضوابط الفوترة الإلكترونية • v2.1.0
        </p>
      </motion.div>
    </div>
  );
}
