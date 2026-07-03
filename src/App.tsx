import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Boxes, Receipt, Truck,
  Download, Smartphone, X, Users, LogOut,
  Loader2, AlertTriangle, UserCog, ShieldOff,
} from 'lucide-react';

import { ActiveTab } from './types';
import { supabaseConfigured } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { signOut } from './lib/auth';

import LoginScreen from './components/LoginScreen';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import SalesInvoicesView from './components/SalesInvoicesView';
import SuppliersView from './components/SuppliersView';
import SupplierPortalView from './components/SupplierPortalView';
import DistributorPortalView from './components/DistributorPortalView';
import DistributorsReportView from './components/DistributorsReportView';
import UserManagementView from './components/UserManagementView';

const NAV_ITEMS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'dashboard',    icon: <LayoutDashboard className="w-5 h-5" />, label: 'لوحة القيادة' },
  { tab: 'inventory',   icon: <Boxes className="w-5 h-5" />,          label: 'المخزون' },
  { tab: 'sales',       icon: <Receipt className="w-5 h-5" />,         label: 'الفواتير' },
  { tab: 'suppliers',   icon: <Truck className="w-5 h-5" />,           label: 'الموردين' },
  { tab: 'distributors',icon: <Users className="w-5 h-5" />,           label: 'الموزعين' },
  { tab: 'users',       icon: <UserCog className="w-5 h-5" />,         label: 'المستخدمين' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone)
      setIsAlreadyInstalled(true);
    const fn = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', fn);
    return () => window.removeEventListener('beforeinstallprompt', fn);
  }, []);

  const triggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else setIsInstallModalOpen(true);
  };

  // ── 0. Supabase not configured ──────────────────────────────────
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6" dir="rtl">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <h1 className="text-white font-bold">إعداد Supabase مفقود</h1>
        <p className="text-slate-400 text-sm text-center max-w-sm">أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في Vercel ثم أعد النشر.</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold">إعادة التحميل</button>
      </div>
    );
  }

  // ── Auth & Data ─────────────────────────────────────────────────
  const { session, role, partnerId, loading: authLoading } = useAuth();
  const { products, invoices, suppliers, dataLoading, dataError,
    handleAddProduct, handleDeleteProduct, handleUpdateProductStock,
    handleAddInvoice, handleAddSupplier, handleAddSupplierInvoice } = useData();

  const handleLogout = async () => { await signOut(); };
  const currentEntity = suppliers.find((s) => s.id === partnerId);

  // ── 1. Auth loading ─────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
    </div>
  );

  // ── 2. Not logged in ────────────────────────────────────────────
  if (!session || role === 'guest') return <LoginScreen onLoginSuccess={() => {}} />;

  // ── 3. Supplier portal (STRICT: role must be exactly 'supplier') ─
  if (role === 'supplier') {
    if (!currentEntity) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
        <ShieldOff className="w-10 h-10 text-amber-400" />
        <h2 className="text-white font-bold text-lg">الحساب غير مرتبط بمورّد</h2>
        <p className="text-slate-400 text-sm max-w-sm">تواصل مع المدير لربط حسابك بملف المورد الصحيح في النظام.</p>
        <button onClick={handleLogout} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
          <LogOut className="w-4 h-4" /><span>خروج</span>
        </button>
      </div>
    );
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans" dir="rtl">
        <SupplierPortalView supplier={currentEntity} products={products} onAddSupplierInvoice={handleAddSupplierInvoice} onUpdateProductStock={handleUpdateProductStock} onLogout={handleLogout} />
      </div>
    );
  }

  // ── 4. Distributor portal (STRICT: role must be exactly 'distributor') ─
  if (role === 'distributor') {
    if (!currentEntity) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
        <ShieldOff className="w-10 h-10 text-amber-400" />
        <h2 className="text-white font-bold text-lg">الحساب غير مرتبط بموزّع</h2>
        <p className="text-slate-400 text-sm max-w-sm">تواصل مع المدير لربط حسابك بملف الموزع الصحيح في النظام.</p>
        <button onClick={handleLogout} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
          <LogOut className="w-4 h-4" /><span>خروج</span>
        </button>
      </div>
    );
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans" dir="rtl">
        <DistributorPortalView distributor={currentEntity} products={products} invoices={invoices} onAddInvoice={handleAddInvoice} onUpdateProductStock={handleUpdateProductStock} onLogout={handleLogout} />
      </div>
    );
  }

  // ── 5. STRICT Admin-only guard ──────────────────────────────────
  // Only role === 'admin' reaches here. Any unknown/unassigned role is BLOCKED.
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
        <ShieldOff className="w-12 h-12 text-rose-400" />
        <h2 className="text-white font-bold text-xl">غير مصرح بالدخول</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          حسابك (<span className="text-slate-300 font-mono">{session.user.email}</span>) لا يملك صلاحية الوصول لهذه اللوحة.
          <br />تواصل مع مدير النظام لتعيين الدور الصحيح.
        </p>
        <button onClick={handleLogout} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
          <LogOut className="w-4 h-4" /><span>خروج</span>
        </button>
      </div>
    );
  }

  // ── 6. Data loading (admin only reaches here) ───────────────────
  if (dataLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3" dir="rtl">
      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      <p className="text-slate-400 text-sm">جاري تحميل البيانات...</p>
    </div>
  );

  // ── 7. Data error ───────────────────────────────────────────────
  if (dataError) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 p-6" dir="rtl">
      <AlertTriangle className="w-8 h-8 text-rose-400" />
      <p className="text-rose-400 text-sm text-center">{dataError}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold">إعادة المحاولة</button>
    </div>
  );

  // ── 8. Admin dashboard ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row font-sans" dir="rtl">

      {/* Mobile AppBar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-outline-variant flex justify-between items-center px-4 h-16 md:hidden shadow-sm print:hidden">
        <span className="font-bold text-base text-primary">سحاب ERP</span>
        <div className="flex items-center gap-3">
          {!isAlreadyInstalled && (
            <button onClick={triggerPWAInstall} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white rounded-full text-xs font-bold">
              <Download className="w-3 h-3" /><span>تثبيت</span>
            </button>
          )}
          <button onClick={handleLogout} className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100/50">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-[240px] hidden md:flex flex-col bg-primary border-l border-outline-variant z-40 text-white shadow-xl print:hidden">
        <div className="px-6 py-6 border-b border-white/10 text-right">
          <span className="font-bold text-lg text-white block">نظام السحاب المتكامل</span>
          <span className="text-[10px] text-primary-fixed-dim block mt-0.5 uppercase tracking-wider">لوحة إدارة الأعمال</span>
        </div>
        <div className="flex-1 py-6 flex flex-col justify-between">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map(({ tab, icon, label }) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab ? 'bg-secondary text-white border-r-4 border-white shadow-md' : 'text-primary-fixed-dim hover:bg-white/5 hover:text-white'
                }`}>
                {icon}<span>{label}</span>
              </button>
            ))}
            {!isAlreadyInstalled && (
              <div className="mt-4 mx-1 p-3.5 rounded-xl bg-white/5 border border-white/10 text-right space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <Smartphone className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold">تطبيق الجوال</span>
                </div>
                <button onClick={triggerPWAInstall} className="w-full py-2 bg-secondary text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /><span>تثبيت التطبيق</span>
                </button>
              </div>
            )}
          </nav>
          <div className="px-4 py-4 border-t border-white/10 space-y-2">
            <div className="text-right">
              <span className="text-xs font-bold text-white block">صاحب الشركة</span>
              <span className="text-[10px] text-primary-fixed-dim block">{session.user.email}</span>
            </div>
            <button onClick={handleLogout} className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-white/10">
              <LogOut className="w-3.5 h-3.5 text-rose-400" /><span>خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mt-16 md:mt-0 md:mr-[240px] p-4 md:p-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto print:mr-0 print:mt-0 print:p-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
            {activeTab === 'dashboard'    && <DashboardView products={products} invoices={invoices} onNavigate={setActiveTab} />}
            {activeTab === 'inventory'   && <InventoryView products={products} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />}
            {activeTab === 'sales'       && <SalesInvoicesView invoices={invoices} onAddInvoice={handleAddInvoice} />}
            {activeTab === 'suppliers'   && <SuppliersView suppliers={suppliers} onAddSupplierInvoice={handleAddSupplierInvoice} onAddSupplier={handleAddSupplier} />}
            {activeTab === 'distributors'&& <DistributorsReportView distributors={suppliers.filter(s => s.type === 'موزع')} products={products} invoices={invoices} onAddInvoice={handleAddInvoice} onUpdateProductStock={handleUpdateProductStock} onAddSupplier={handleAddSupplier} />}
            {activeTab === 'users'       && <UserManagementView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-outline-variant md:hidden z-50 shadow-lg flex justify-around items-center h-20 px-1 print:hidden">
        {NAV_ITEMS.map(({ tab, icon, label }) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center justify-center p-1.5 w-14 h-full transition-all ${
              activeTab === tab ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}>
            {icon}<span className="text-[9px] mt-0.5">{label}</span>
          </button>
        ))}
      </nav>

      {/* PWA Modal */}
      <AnimatePresence>
        {isInstallModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInstallModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10 text-right space-y-4">
              <button onClick={() => setIsInstallModalOpen(false)} className="absolute left-4 top-4 p-1.5 rounded-full hover:bg-slate-100"><X className="w-4 h-4" /></button>
              <h3 className="font-bold text-slate-900">تثبيت تطبيق السحاب</h3>
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800"><strong>أندرويد:</strong> اضغط (⋮) ثم تثبيت التطبيق</div>
              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800"><strong>آيفون:</strong> اضغط المشاركة 📤 ثم إضافة إلى الشاشة الرئيسية</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
