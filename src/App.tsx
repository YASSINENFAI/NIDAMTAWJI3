import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Boxes, 
  Receipt, 
  Truck, 
  Search, 
  User, 
  Menu,
  Download,
  Smartphone,
  X,
  Info,
  Check,
  ShieldAlert,
  LogIn,
  Store,
  Users,
  ExternalLink,
  ChevronRight,
  Sparkles,
  LogOut
} from 'lucide-react';

import { ActiveTab, Product, Invoice, Supplier, SupplierInvoice } from './types';
import { INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_SUPPLIERS } from './data';

import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import SalesInvoicesView from './components/SalesInvoicesView';
import SuppliersView from './components/SuppliersView';
import SupplierPortalView from './components/SupplierPortalView';
import DistributorPortalView from './components/DistributorPortalView';
import DistributorsReportView from './components/DistributorsReportView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // PWA & Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAlreadyInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Prompt not available (iOS, or already installed, or unsupported browser)
      // We open our custom beautiful help modal
      setIsInstallModalOpen(true);
    }
  };
  
  // App-level Shared React State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);

  // User Authentication / Portal Role States
  const [userRole, setUserRole] = useState<'admin' | 'supplier' | 'distributor' | 'guest'>('guest');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [tempSubRole, setTempSubRole] = useState<'supplier' | 'distributor' | null>(null);

  // Callbacks
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const freshId = (products.length + 1).toString();
    setProducts(prev => [
      { id: freshId, ...newProd },
      ...prev
    ]);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateProductStock = (productId: string, quantityChange: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stock: Math.max(0, p.stock + quantityChange)
        };
      }
      return p;
    }));
  };

  const handleAddInvoice = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const handleAddSupplierInvoice = (supplierId: string, newBill: SupplierInvoice) => {
    setSuppliers(prev => prev.map(sup => {
      if (sup.id === supplierId) {
        return {
          ...sup,
          totalEarned: sup.totalEarned + newBill.amount,
          invoices: [newBill, ...sup.invoices]
        };
      }
      return sup;
    }));
  };

  const handleAddSupplier = (newSup: { name: string; type: 'مورد' | 'موزع'; phone?: string }) => {
    const freshId = 's' + (suppliers.length + 1).toString();
    const initialLetter = newSup.name.trim().charAt(0) || 'م';
    const supplierWithId: Supplier = {
      id: freshId,
      name: newSup.name,
      type: newSup.type,
      phone: newSup.phone,
      totalEarned: 0,
      monthlyGrowth: 0,
      initialLetter: initialLetter,
      invoices: []
    };
    setSuppliers(prev => [...prev, supplierWithId]);
  };

  // Find current logged in entity if we are in supplier or distributor portals
  const currentEntity = suppliers.find(s => s.id === selectedSupplierId);

  // 1. Guest View / Login Screen
  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans" dir="rtl">
        {/* Decorative ambient background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-[2rem] shadow-2xl space-y-6 text-right relative z-10">
          
          {/* Header Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-teal-300 font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>منصة سحاب المشتركة لقطاع التوزيع والإمداد</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">بوابة الدخول الموحدة</h1>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
              اختر هويتك ونظام صلاحياتك للدخول إلى البوابة المشتركة مع المدير العام.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!tempSubRole ? (
              /* MAIN ROLE SELECTOR SCREEN */
              <motion.div
                key="main-portal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {/* 1. GM Admin Card */}
                <button 
                  onClick={() => {
                    setUserRole('admin');
                    setSelectedSupplierId(null);
                  }}
                  className="flex flex-col text-right p-5 bg-slate-900/90 border border-white/5 hover:border-primary/50 hover:bg-slate-900 rounded-2xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-4">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm">المدير العام</h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed flex-1">
                    لوحة الإدارة الكاملة لـ ERP، تتبع الإيرادات، الإشراف الفني والضريبي.
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                    <span>دخول الإدارة</span>
                    <ChevronRight className="w-3 h-3 transform rotate-180" />
                  </div>
                </button>

                {/* 2. Suppliers Gate Card */}
                <button 
                  onClick={() => {
                    setTempSubRole('supplier');
                    const firstSup = suppliers.find(s => s.type === 'مورد');
                    setSelectedSupplierId(firstSup ? firstSup.id : null);
                  }}
                  className="flex flex-col text-right p-5 bg-slate-900/90 border border-white/5 hover:border-teal-500/50 hover:bg-slate-900 rounded-2xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform mb-4">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm">بوابة الموردين</h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed flex-1">
                    تسجيل شحنات التوريد الجديدة لزيادة المخزون المركزي ومتابعة الأرصدة.
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-teal-400">
                    <span>دخول الموردين</span>
                    <ChevronRight className="w-3 h-3 transform rotate-180" />
                  </div>
                </button>

                {/* 3. Distributors Gate Card */}
                <button 
                  onClick={() => {
                    setTempSubRole('distributor');
                    const firstDist = suppliers.find(s => s.type === 'موزع');
                    setSelectedSupplierId(firstDist ? firstDist.id : null);
                  }}
                  className="flex flex-col text-right p-5 bg-slate-900/90 border border-white/5 hover:border-amber-500/50 hover:bg-slate-900 rounded-2xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-4">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm">بوابة الموزعين</h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed flex-1">
                    طلب سحب وحجز المنتجات، توزيعها بالأسواق ومراجعة الفواتير الآجلة.
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-amber-400">
                    <span>بوابة الموزعين</span>
                    <ChevronRight className="w-3 h-3 transform rotate-180" />
                  </div>
                </button>
              </motion.div>
            ) : (
              /* DETAILED ENTITY DROPDOWN SELECTOR */
              <motion.div
                key="subrole-portal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-slate-400 block">
                    {tempSubRole === 'supplier' ? 'حدد جهة التوريد الخاصة بك:' : 'حدد جهة التوزيع الخاصة بك:'}
                  </span>
                  
                  <select
                    value={selectedSupplierId || ''}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-primary"
                  >
                    {suppliers
                      .filter(s => s.type === tempSubRole)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} (رقم الحساب: {s.id})
                        </option>
                      ))}
                    {suppliers.filter(s => s.type === tempSubRole).length === 0 && (
                      <option value="">لا توجد منشآت مسجلة حالياً</option>
                    )}
                  </select>

                  <p className="text-[10px] text-slate-500 leading-normal text-right">
                    * يتم جلب هذه الحسابات من السجلات المعرّفة لدى المدير العام. في حال عدم وجود حسابك، يرجى التواصل مع الإدارة.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setTempSubRole(null);
                      setSelectedSupplierId(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    رجوع للرئيسية
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSupplierId}
                    onClick={() => {
                      if (selectedSupplierId) {
                        setUserRole(tempSubRole);
                      }
                    }}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                      tempSubRole === 'supplier'
                        ? 'bg-teal-500 hover:bg-teal-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>دخول البوابة الآمنة</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ZATCA compliance footer info */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10 text-xs text-slate-500">
            <span>نظام سحاب المتكامل ممتثل لضوابط الفوترة الإلكترونية والهيئة العامة للزكاة</span>
            <span className="font-mono text-[9px] text-slate-600">v2.1.0-secure</span>
          </div>

        </div>
      </div>
    );
  }

  // 2. Active Supplier Portal View
  if (userRole === 'supplier' && currentEntity) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans" dir="rtl">
        <SupplierPortalView
          supplier={currentEntity}
          products={products}
          onAddSupplierInvoice={handleAddSupplierInvoice}
          onUpdateProductStock={handleUpdateProductStock}
          onLogout={() => {
            setUserRole('guest');
            setTempSubRole(null);
            setSelectedSupplierId(null);
          }}
        />
      </div>
    );
  }

  // 3. Active Distributor Portal View
  if (userRole === 'distributor' && currentEntity) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans" dir="rtl">
        <DistributorPortalView
          distributor={currentEntity}
          products={products}
          invoices={invoices}
          onAddInvoice={handleAddInvoice}
          onUpdateProductStock={handleUpdateProductStock}
          onLogout={() => {
            setUserRole('guest');
            setTempSubRole(null);
            setSelectedSupplierId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row font-sans" dir="rtl">
      
      {/* 1. Mobile Top AppBar Header */}
      <header className="fixed top-0 inset-x-0 w-full z-50 bg-white border-b border-outline-variant flex flex-row justify-between items-center px-4 h-16 md:hidden shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-primary">سحاب ERP</span>
        </div>
        <div className="flex items-center gap-3">
          {!isAlreadyInstalled && (
            <button 
              onClick={triggerPWAInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/95 text-white rounded-full text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-3 h-3 " />
              <span>تثبيت</span>
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-primary-fixed overflow-hidden flex items-center justify-center border border-outline-variant">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuASwUNKzTFIZZncLVPeITmCPV77X-50VwMRLfDdnw0boZLre6MTc8-hd28zRIucnZlHNyauqj-ThzRJeZY_EutVKWLSoSdRBm4HK6x810ntiTuKUSDAnQBGbx4CjLYRlHzI40K8Y1NZ1vvdYtftRtKFV3Fl9MeZ2X9dgfKstfDU3e7JiAD0RNp2LyN-A4B07vKVeHDf5tGOC5KY2PMU2jvD39Dl0QCfliXGAMGhyhcvhAdq5ZU8gK4EDE-H-zMsa_mfdrD3mkI8Snkr" 
              alt="Manager Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button 
            onClick={() => {
              setUserRole('guest');
              setTempSubRole(null);
              setSelectedSupplierId(null);
            }}
            title="الخروج للبوابة الموحدة"
            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 border border-rose-100/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Desktop Persistent RTL Sidebar (Docked to the Right) */}
      <aside className="fixed right-0 top-0 h-full w-[240px] hidden md:flex flex-col bg-primary border-l border-outline-variant z-40 text-white shadow-xl print:hidden">
        
        {/* Branding header */}
        <div className="px-6 py-6 border-b border-white/10 text-right">
          <span className="font-bold text-lg tracking-wide text-white block">نظام السحاب المتكامل</span>
          <span className="text-[10px] text-primary-fixed-dim block mt-0.5 uppercase tracking-wider">لوحة إدارة الأعمال</span>
        </div>

        {/* Navigation group */}
        <div className="flex-1 py-6 flex flex-col justify-between">
          <nav className="space-y-1.5 px-3">
            
            {/* Dashboard tab */}
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center justify-start gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                activeTab === 'dashboard' 
                  ? 'bg-secondary text-white border-r-4 border-white shadow-md' 
                  : 'text-primary-fixed-dim hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>لوحة القيادة</span>
            </button>

            {/* Inventory tab */}
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center justify-start gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                activeTab === 'inventory' 
                  ? 'bg-secondary text-white border-r-4 border-white shadow-md' 
                  : 'text-primary-fixed-dim hover:bg-white/5 hover:text-white'
              }`}
            >
              <Boxes className="w-5 h-5" />
              <span>إدارة المخزون</span>
            </button>

            {/* Invoices tab */}
            <button 
              onClick={() => setActiveTab('sales')}
              className={`flex items-center justify-start gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                activeTab === 'sales' 
                  ? 'bg-secondary text-white border-r-4 border-white shadow-md' 
                  : 'text-primary-fixed-dim hover:bg-white/5 hover:text-white'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span>سجل الفواتير</span>
            </button>

            {/* Suppliers tab */}
            <button 
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center justify-start gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                activeTab === 'suppliers' 
                  ? 'bg-secondary text-white border-r-4 border-white shadow-md' 
                  : 'text-primary-fixed-dim hover:bg-white/5 hover:text-white'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span>الموردين والمشتريات</span>
            </button>

            {/* Distributors Report tab */}
            <button 
              onClick={() => setActiveTab('distributors')}
              className={`flex items-center justify-start gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                activeTab === 'distributors' 
                  ? 'bg-secondary text-white border-r-4 border-white shadow-md' 
                  : 'text-primary-fixed-dim hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>تقارير الموزعين (المناديب)</span>
            </button>

            {/* PWA Install Promo Widget */}
            {!isAlreadyInstalled && (
              <div className="mt-6 mx-1 p-3.5 rounded-xl bg-white/5 border border-white/10 text-right space-y-2.5">
                <div className="flex items-center gap-2 text-white">
                  <Smartphone className="w-4 h-4 text-teal-400" />
                  <span className="text-[12px] font-bold">تطبيق الجوال المباشر</span>
                </div>
                <p className="text-[10.5px] text-white/75 leading-relaxed">
                  ثبّت نظام السحاب كـتطبيق جوال حقيقي لتتبع الفواتير والعمل دون إنترنت.
                </p>
                <button 
                  onClick={triggerPWAInstall}
                  className="w-full py-2.5 bg-secondary hover:bg-secondary/90 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تثبيت التطبيق</span>
                </button>
              </div>
            )}

          </nav>

          {/* User profile section */}
          <div className="px-4 py-4 border-t border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuASwUNKzTFIZZncLVPeITmCPV77X-50VwMRLfDdnw0boZLre6MTc8-hd28zRIucnZlHNyauqj-ThzRJeZY_EutVKWLSoSdRBm4HK6x810ntiTuKUSDAnQBGbx4CjLYRlHzI40K8Y1NZ1vvdYtftRtKFV3Fl9MeZ2X9dgfKstfDU3e7JiAD0RNp2LyN-A4B07vKVeHDf5tGOC5KY2PMU2jvD39Dl0QCfliXGAMGhyhcvhAdq5ZU8gK4EDE-H-zMsa_mfdrD3mkI8Snkr" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-right flex-1">
                <span className="text-xs font-bold block text-white">المدير العام</span>
                <span className="text-[10px] text-primary-fixed-dim block">azffhk@gmail.com</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setUserRole('guest');
                setTempSubRole(null);
                setSelectedSupplierId(null);
              }}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/95 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>تبديل البوابة / خروج</span>
            </button>
          </div>

        </div>
      </aside>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 mt-16 md:mt-0 md:mr-[240px] p-4 md:p-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto print:mr-0 print:mt-0 print:p-0 print:max-w-none">
        
        {/* Animated dynamic tab router with smooth entrances */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView 
                products={products}
                invoices={invoices}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView 
                products={products}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'sales' && (
              <SalesInvoicesView 
                invoices={invoices}
                onAddInvoice={handleAddInvoice}
              />
            )}

            {activeTab === 'suppliers' && (
              <SuppliersView 
                suppliers={suppliers}
                onAddSupplierInvoice={handleAddSupplierInvoice}
                onAddSupplier={handleAddSupplier}
              />
            )}

            {activeTab === 'distributors' && (
              <DistributorsReportView 
                distributors={suppliers.filter(s => s.type === 'موزع')}
                products={products}
                invoices={invoices}
                onAddInvoice={handleAddInvoice}
                onUpdateProductStock={handleUpdateProductStock}
                onAddSupplier={handleAddSupplier}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* 4. Mobile Sticky Bottom Navigation Bar (Docked to bottom) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-outline-variant md:hidden z-50 shadow-lg flex flex-row justify-around items-center h-20 pb-safe px-2 print:hidden">
        
        {/* Home/Dashboard */}
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center transition-all p-2 w-16 h-full ${
            activeTab === 'dashboard' 
              ? 'text-primary font-bold' 
              : 'text-on-surface-variant'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px]">الرئيسية</span>
        </button>

        {/* Inventory */}
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center transition-all p-2 w-16 h-full ${
            activeTab === 'inventory' 
              ? 'text-primary font-bold' 
              : 'text-on-surface-variant'
          }`}
        >
          <Boxes className="w-5 h-5 mb-1" />
          <span className="text-[10px]">المخزن</span>
        </button>

        {/* Sales */}
        <button 
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center justify-center transition-all p-2 w-16 h-full ${
            activeTab === 'sales' 
              ? 'text-primary font-bold' 
              : 'text-on-surface-variant'
          }`}
        >
          <Receipt className="w-5 h-5 mb-1" />
          <span className="text-[10px]">المبيعات</span>
        </button>

        {/* Suppliers */}
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`flex flex-col items-center justify-center transition-all p-2 w-16 h-full ${
            activeTab === 'suppliers' 
              ? 'text-primary font-bold' 
              : 'text-on-surface-variant'
          }`}
        >
          <Truck className="w-5 h-5 mb-1" />
          <span className="text-[10px]">الموردين</span>
        </button>

        {/* Distributors */}
        <button 
          onClick={() => setActiveTab('distributors')}
          className={`flex flex-col items-center justify-center transition-all p-2 w-16 h-full ${
            activeTab === 'distributors' 
              ? 'text-primary font-bold' 
              : 'text-on-surface-variant'
          }`}
        >
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px]">المناديب</span>
        </button>

      </nav>

      {/* 5. PWA Installation Instructions Modal */}
      <AnimatePresence>
        {isInstallModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-outline-variant z-10 text-right"
            >
              {/* Header */}
              <div className="bg-primary text-white p-6 relative">
                <button 
                  onClick={() => setIsInstallModalOpen(false)}
                  className="absolute left-4 top-5 p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">تثبيت تطبيق السحاب المباشر</h3>
                    <p className="text-[11px] text-white/80 mt-0.5">احصل على تجربة سريعة وخفيفة من شاشتك الرئيسية مباشرة</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                
                {/* Benefits */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-primary/60 uppercase tracking-wider block">مميزات التطبيق المثبت</span>
                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">بدون شريط عنوان</span>
                        <span className="text-[10px] text-slate-500">مساحة عمل كاملة مريحة للعين</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">مزامنة فورية</span>
                        <span className="text-[10px] text-slate-500">تحديث فوري لكل الفواتير والأرصدة</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">طباعة بلمسة واحدة</span>
                        <span className="text-[10px] text-slate-500">تكامل سريع مع الطابعات الحرارية</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">تصفح بدون إنترنت</span>
                        <span className="text-[10px] text-slate-500">مراجعة المنتجات والفواتير السابقة</span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Instructions by Platform */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-primary/60 uppercase tracking-wider block">طريقة التثبيت حسب نوع جهازك</span>
                  
                  {/* Android & Chrome */}
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/60 space-y-2">
                    <span className="text-xs font-bold text-blue-900 block">📱 أجهزة الأندرويد ومتصفح كروم للكمبيوتر</span>
                    <p className="text-[11.5px] text-blue-800 leading-relaxed">
                      انقر على زر <strong>"تثبيت التطبيق"</strong> المتواجد في أعلى الشاشة الرئيسية للتطبيق، أو انقر على القائمة الجانبية للمتصفح (ثلاث نقاط) ثم اختر <strong>"تثبيت التطبيق" (Install App)</strong> للتحميل الفوري.
                    </p>
                  </div>

                  {/* iOS Safari */}
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/60 space-y-2">
                    <span className="text-xs font-bold text-amber-900 block">🍎 هواتف آيفون وأجهزة الآيباد (Safari iOS)</span>
                    <p className="text-[11.5px] text-amber-800 leading-relaxed">
                      Safari لا يدعم التثبيت المباشر بضغطة زر. لتثبيته:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-amber-900/90 space-y-1 pr-1 leading-relaxed">
                      <li>اضغط على زر <strong>المشاركة (Share 📤)</strong> في شريط سفاري السفلي.</li>
                      <li>قم بالتمرير لأسفل واضغط على <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen ➕)</strong>.</li>
                      <li>انقر على <strong>إضافة (Add)</strong> في الزاوية العلوية لتثبيت الأيقونة فوراً.</li>
                    </ol>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setIsInstallModalOpen(false)}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md"
                >
                  حسناً، فهمت
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
