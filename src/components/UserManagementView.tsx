import { useState, useEffect } from 'react';
import {
  UserPlus, Trash2, RefreshCw, Eye, EyeOff,
  ShieldCheck, Truck, Users, Copy, CheckCheck,
  Loader2, AlertCircle, Mail, Lock, User, Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'supplier' | 'distributor' | 'guest';
  name?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
}

const ROLE_LABELS = {
  admin: { label: 'مدير', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  supplier: { label: 'مورّد', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Truck className="w-3.5 h-3.5" /> },
  distributor: { label: 'موزّع', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', icon: <Users className="w-3.5 h-3.5" /> },
  guest: { label: 'ضيف', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <User className="w-3.5 h-3.5" /> },
};

export default function UserManagementView() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'supplier' | 'distributor'>('supplier');
  const [showPass, setShowPass] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load from user_profiles table (created by trigger on auth.users)
      const { data, error: err } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setUsers((data || []) as AppUser[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      // 1. Create user via Supabase Admin API (Edge Function)
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('create-user', {
        body: {
          email: formEmail,
          password: formPassword,
          role: formRole,
          name: formName,
          phone: formPhone,
        },
      });
      if (fnErr) throw fnErr;
      if (fnData?.error) throw new Error(fnData.error);

      setCreatedInfo({ email: formEmail, password: formPassword });
      setFormEmail(''); setFormPassword(''); setFormName(''); setFormPhone('');
      setShowForm(false);
      await loadUsers();
    } catch (e: any) {
      setFormError(e.message || 'حدث خطأ غير متوقع');
    } finally {
      setFormLoading(false);
    }
  };

  const copyCredentials = (email: string, password: string) => {
    navigator.clipboard.writeText(
      `بيانات الدخول لنظام سحاب\nالبريد الإلكتروني: ${email}\nكلمة السر: ${password}\nالرابط: https://nidamtawji-3.vercel.app`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-on-surface">إدارة المستخدمين</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">أنشئ حسابات للموردين والموزعين وأرسل لهم بيانات الدخول</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadUsers} className="p-2 rounded-xl bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors">
            <RefreshCw className="w-4 h-4 text-on-surface-variant" />
          </button>
          <button
            onClick={() => { setShowForm(true); setFormPassword(generatePassword()); setCreatedInfo(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم</span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {createdInfo && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCheck className="w-4 h-4" />
            <span>تم إنشاء الحساب بنجاح! أرسل هذه البيانات للمستخدم:</span>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 font-mono text-xs text-slate-300 space-y-1">
            <div>📧 <span className="text-white">{createdInfo.email}</span></div>
            <div>🔒 <span className="text-white">{createdInfo.password}</span></div>
            <div>🔗 <span className="text-teal-400">https://nidamtawji-3.vercel.app</span></div>
          </div>
          <button
            onClick={() => copyCredentials(createdInfo.email, createdInfo.password)}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ بيانات الدخول'}</span>
          </button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-on-surface text-sm">إنشاء حساب جديد</h3>
          <form onSubmit={handleCreateUser} className="space-y-3">
            {/* Role */}
            <div className="grid grid-cols-2 gap-2">
              {(['supplier', 'distributor'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setFormRole(r)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    formRole === r ? 'bg-primary text-white border-primary' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container'
                  }`}>
                  {r === 'supplier' ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  <span>{r === 'supplier' ? 'مورّد' : 'موزّع'}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1"><User className="w-3 h-3" />الاسم</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="اسم المورد أو الموزع"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors" />
              </div>
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1"><Phone className="w-3 h-3" />الهاتف</label>
                <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="0600000000" dir="ltr"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors" />
              </div>
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1"><Mail className="w-3 h-3" />البريد الإلكتروني</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required placeholder="user@example.com" dir="ltr"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors" />
              </div>
              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1"><Lock className="w-3 h-3" />كلمة السر</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} required minLength={8} dir="ltr"
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors pl-8" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => setFormPassword(generatePassword())} className="text-[10px] text-primary hover:underline">توليد كلمة سر تلقائية</button>
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{formError}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">إلغاء</button>
              <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-all">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{formLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-rose-400 text-sm">{error}</p>
          <p className="text-on-surface-variant text-xs max-w-sm">تأكد من تشغيل SQL Schema في Supabase وإنشاء جدول user_profiles</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center">
            <Users className="w-6 h-6 text-on-surface-variant" />
          </div>
          <p className="text-on-surface font-bold">لا يوجد مستخدمون بعد</p>
          <p className="text-on-surface-variant text-sm">اضغط على "إضافة مستخدم" لإنشاء أول حساب</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.guest;
            return (
              <div key={u.id} className="flex items-center justify-between p-4 bg-surface-container border border-outline-variant rounded-2xl hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-on-surface">{u.name || '—'}</p>
                    <p className="text-xs text-on-surface-variant" dir="ltr">{u.email}</p>
                    {u.phone && <p className="text-xs text-on-surface-variant" dir="ltr">{u.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${roleInfo.color}`}>
                    {roleInfo.icon}<span>{roleInfo.label}</span>
                  </span>
                  <span className="text-[10px] text-on-surface-variant hidden md:block">
                    {new Date(u.created_at).toLocaleDateString('ar-MA')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
