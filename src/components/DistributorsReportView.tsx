import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronLeft,
  Smartphone,
  Check,
  X,
  PlusCircle,
  ShoppingBag,
  CreditCard,
  UserPlus,
  TrendingDown
} from 'lucide-react';
import { Product, Supplier, Invoice } from '../types';

interface DistributorsReportViewProps {
  distributors: Supplier[];
  products: Product[];
  invoices: Invoice[];
  onAddInvoice: (newInvoice: Invoice) => void;
  onUpdateProductStock: (productId: string, quantityChange: number) => void;
  onAddSupplier: (newSup: { name: string; type: 'مورد' | 'موزع'; phone?: string }) => void;
}

export default function DistributorsReportView({
  distributors,
  products,
  invoices,
  onAddInvoice,
  onUpdateProductStock,
  onAddSupplier
}: DistributorsReportViewProps) {
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>(distributors[0]?.id || '');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('month');
  
  // Saisie / Form States
  const [showSaisieModal, setShowSaisieModal] = useState(false);
  const [saisieProductId, setSaisieProductId] = useState('');
  const [saisieQty, setSaisieQty] = useState<number>(0);
  const [saisieSuccess, setSaisieSuccess] = useState('');
  const [saisieError, setSaisieError] = useState('');

  // Add Distributor Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDistName, setNewDistName] = useState('');
  const [newDistPhone, setNewDistPhone] = useState('');
  const [addDistError, setAddDistError] = useState('');
  const [addDistSuccess, setAddDistSuccess] = useState('');

  // Find currently selected distributor
  const selectedDistributor = useMemo(() => {
    return distributors.find(d => d.id === selectedDistributorId) || distributors[0];
  }, [distributors, selectedDistributorId]);

  // Filter invoices for the selected distributor
  const selectedDistributorInvoices = useMemo(() => {
    if (!selectedDistributor) return [];
    return invoices.filter(inv => inv.customerName === selectedDistributor.name);
  }, [invoices, selectedDistributor]);

  // Date comparison helper
  const isWithinPeriod = (dateStr: string, period: 'today' | 'week' | 'month') => {
    const invoiceDate = new Date(dateStr);
    const now = new Date();
    
    // Reset times to compare dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (period === 'today') {
      return invoiceDate >= today;
    } else if (period === 'week') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return invoiceDate >= oneWeekAgo;
    } else if (period === 'month') {
      const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return invoiceDate >= oneMonthAgo;
    }
    return true;
  };

  // Filter distributor invoices based on the selected period
  const filteredPeriodInvoices = useMemo(() => {
    return selectedDistributorInvoices.filter(inv => isWithinPeriod(inv.date, filterPeriod));
  }, [selectedDistributorInvoices, filterPeriod]);

  // Overall distributor performance calculations
  const distributorPerformance = useMemo(() => {
    const perfList = distributors.map(dist => {
      const distInvs = invoices.filter(inv => inv.customerName === dist.name);
      
      const salesToday = distInvs
        .filter(inv => isWithinPeriod(inv.date, 'today'))
        .reduce((sum, inv) => sum + inv.total, 0);

      const salesWeek = distInvs
        .filter(inv => isWithinPeriod(inv.date, 'week'))
        .reduce((sum, inv) => sum + inv.total, 0);

      const salesMonth = distInvs
        .filter(inv => isWithinPeriod(inv.date, 'month'))
        .reduce((sum, inv) => sum + inv.total, 0);

      const totalSales = distInvs.reduce((sum, inv) => sum + inv.total, 0);
      const outstanding = distInvs
        .filter(inv => inv.status === 'مستحقة')
        .reduce((sum, inv) => sum + inv.balance, 0);

      return {
        id: dist.id,
        name: dist.name,
        salesToday,
        salesWeek,
        salesMonth,
        totalSales,
        outstanding,
        invoicesCount: distInvs.length
      };
    });

    return perfList;
  }, [distributors, invoices]);

  // Totals for the overall header
  const totalStats = useMemo(() => {
    let todayAll = 0;
    let weekAll = 0;
    let monthAll = 0;
    let totalOutstandingAll = 0;

    distributorPerformance.forEach(p => {
      todayAll += p.salesToday;
      weekAll += p.salesWeek;
      monthAll += p.salesMonth;
      totalOutstandingAll += p.outstanding;
    });

    return {
      todayAll,
      weekAll,
      monthAll,
      totalOutstandingAll
    };
  }, [distributorPerformance]);

  // Selected distributor calculated stats for current active period
  const selectedPeriodStats = useMemo(() => {
    if (!selectedDistributor) return { sales: 0, count: 0, outstanding: 0 };
    
    const sales = filteredPeriodInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const count = filteredPeriodInvoices.length;
    
    const outstanding = selectedDistributorInvoices
      .filter(inv => inv.status === 'مستحقة')
      .reduce((sum, inv) => sum + inv.balance, 0);

    return {
      sales,
      count,
      outstanding
    };
  }, [selectedDistributor, filteredPeriodInvoices, selectedDistributorInvoices]);

  // Saisie handler
  const handleSaisieSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaisieError('');
    setSaisieSuccess('');

    if (!selectedDistributor) {
      setSaisieError('يرجى تحديد موزع أولاً.');
      return;
    }
    if (!saisieProductId) {
      setSaisieError('يرجى اختيار المنتج المباع.');
      return;
    }
    if (saisieQty <= 0) {
      setSaisieError('يرجى تحديد كمية بيع صحيحة أكبر من صفر.');
      return;
    }

    const product = products.find(p => p.id === saisieProductId);
    if (!product) {
      setSaisieError('المنتج المختار غير متوفر.');
      return;
    }

    if (saisieQty > product.stock) {
      setSaisieError(`الكمية المطلوبة (${saisieQty}) تفوق الكمية المتوفرة بالمخزن (${product.stock}).`);
      return;
    }

    // Build Sales Invoice
    const invoiceId = 'SAISIE-' + Math.floor(100000 + Math.random() * 900000);
    const subtotal = saisieQty * product.sellPrice;
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const newInvoice: Invoice = {
      id: invoiceId,
      customerName: selectedDistributor.name,
      customerVat: '300123456700003',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days due
      total: total,
      balance: total,
      status: 'مستحقة',
      items: [
        {
          description: `${product.name} (تفريغ مبيعات مناديب)`,
          quantity: saisieQty,
          price: product.sellPrice,
          tax: 15,
          total: total
        }
      ]
    };

    // Add Invoice
    onAddInvoice(newInvoice);

    // Decrement stock (distributors drew products to sell)
    onUpdateProductStock(product.id, -saisieQty);

    setSaisieSuccess(`تم تفريغ وتسجيل الفاتورة ${invoiceId} بنجاح، وتحديث رصيد الموزع ومستوى المخزون!`);
    setSaisieProductId('');
    setSaisieQty(0);

    setTimeout(() => {
      setShowSaisieModal(false);
      setSaisieSuccess('');
    }, 2500);
  };

  const handleCreateDistributor = (e: React.FormEvent) => {
    e.preventDefault();
    setAddDistError('');
    setAddDistSuccess('');

    if (!newDistName.trim()) {
      setAddDistError('يرجى كتابة اسم الموزع / المندوب.');
      return;
    }

    onAddSupplier({
      name: newDistName,
      type: 'موزع',
      phone: newDistPhone || undefined
    });

    setAddDistSuccess('تم تسجيل الموزع المندوب بنجاح في النظام!');
    setNewDistName('');
    setNewDistPhone('');

    setTimeout(() => {
      setShowAddModal(false);
      setAddDistSuccess('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">تقارير الموزعين وتفريغ الفواتير 🚚</h1>
          <p className="text-slate-500 text-sm mt-1">تتبع تقارير مبيعات المناديب والموزعين، وسحب البضائع وتفريغ فواتير المبيعات اليومية (Saisie) للهاتف.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل موزع جديد</span>
          </button>
          
          <button
            onClick={() => {
              if (selectedDistributorId) {
                setShowSaisieModal(true);
              } else {
                alert('الرجاء اختيار موزع أولاً لتفريغ فواتيره');
              }
            }}
            className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تفريغ فواتير المبيعات (Saisie)</span>
          </button>
        </div>
      </div>

      {/* Corporate Distributor Dashboard Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">مبيعات المناديب (اليوم)</span>
            <span className="text-xl font-black text-emerald-600 block">{totalStats.todayAll.toLocaleString()} ر.س</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">مبيعات المناديب (هذا الأسبوع)</span>
            <span className="text-xl font-black text-blue-600 block">{totalStats.weekAll.toLocaleString()} ر.س</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">مبيعات المناديب (هذا الشهر)</span>
            <span className="text-xl font-black text-slate-900 block">{totalStats.monthAll.toLocaleString()} ر.س</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">إجمالي الذمم المستحقة (الآجل)</span>
            <span className="text-xl font-black text-rose-600 block">{totalStats.totalOutstandingAll.toLocaleString()} ر.س</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <CreditCard className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* Main Grid: Left side Distributors ledger list, Right side details for selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Distributors list & performance index (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-outline-variant rounded-2xl p-4 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-xs">قائمة المناديب النشطين</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold">إجمالي: {distributors.length}</span>
            </div>

            <div className="space-y-2">
              {distributors.map(dist => {
                const isSelected = dist.id === selectedDistributorId;
                const perf = distributorPerformance.find(p => p.id === dist.id) || {
                  salesToday: 0,
                  salesWeek: 0,
                  salesMonth: 0,
                  outstanding: 0,
                  invoicesCount: 0
                };

                return (
                  <div 
                    key={dist.id}
                    onClick={() => setSelectedDistributorId(dist.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs ${
                        isSelected ? 'bg-teal-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {dist.initialLetter || 'م'}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black block leading-tight">{dist.name}</span>
                        <span className={`text-[9px] font-bold mt-1 block ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {perf.invoicesCount} فواتير مفرغة • الجوال {dist.phone || 'غير مسجل'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left space-y-0.5">
                      <span className={`text-[10px] block ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        مبيعات الشهر
                      </span>
                      <span className="text-xs font-black block">
                        {perf.salesMonth.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick instructions widget simulating Mobile APK integration */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-3.5 text-right">
            <h4 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>مزامنة تطبيق الهاتف المحمول (APK)</span>
            </h4>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              يقوم الموزعون بتحميل نظام السحاب في هواتفهم الذكية لإصدار فواتير المبيعات من الشارع فور تسليم البضاعة.
            </p>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>بروتوكول الربط:</span>
                <span className="font-mono text-emerald-400 font-bold">JSON API Over Secure HTTPS</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>تفريغ الفواتير المتزامنة اليوم:</span>
                <span className="font-bold text-white">
                  {invoices.filter(i => i.id.startsWith('SAISIE-') || i.id.startsWith('INV-DIST-')).length} فواتير
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed metrics for selected distributor + Saisie details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {selectedDistributor ? (
            <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Distributor mini header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-bold">
                      رقم الموزع: {selectedDistributor.id}
                    </span>
                    {selectedDistributor.phone && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedDistributor.phone}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-950 mt-1">{selectedDistributor.name}</h2>
                </div>

                {/* Tab selector for periods */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {(['today', 'week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setFilterPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        filterPeriod === p 
                          ? 'bg-primary text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p === 'today' ? 'اليوم' : p === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats dashboard for selected distributor in this period */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">مبيعات الفترة المحددة</span>
                  <span className="text-lg font-black text-slate-900 block">
                    {selectedPeriodStats.sales.toLocaleString()} ر.س
                  </span>
                </div>
                
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">الفواتير المفرغة بالفترة</span>
                  <span className="text-lg font-black text-slate-900 block">
                    {selectedPeriodStats.count} فواتير
                  </span>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1 text-right">
                  <span className="text-[10px] text-amber-600 font-bold block">المستحق الحالي بذمته</span>
                  <span className="text-lg font-black text-rose-600 block">
                    {selectedPeriodStats.outstanding.toLocaleString()} ر.س
                  </span>
                </div>
              </div>

              {/* Transactions lists for this period */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-xs">كشف فواتير الفترة المحددة ({filterPeriod === 'today' ? 'اليوم' : filterPeriod === 'week' ? 'الأسبوع' : 'الشهر'})</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">تحديث مستمر</span>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  {filteredPeriodInvoices.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      لا توجد فواتير مفرغة لهذا الموزع في هذه الفترة الزمنية.
                    </div>
                  ) : (
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                          <th className="py-2.5 px-4">رقم الفاتورة</th>
                          <th className="py-2.5 px-4">التاريخ</th>
                          <th className="py-2.5 px-4">البيان</th>
                          <th className="py-2.5 px-4">القيمة الضريبية</th>
                          <th className="py-2.5 px-4 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPeriodInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.id}</td>
                            <td className="py-2.5 px-4 text-slate-500 font-mono">{inv.date}</td>
                            <td className="py-2.5 px-4 text-slate-700 max-w-[150px] truncate" title={inv.items[0]?.description}>
                              {inv.items[0]?.description || 'مبيعات مناديب التوزيع'}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">{inv.total.toLocaleString()} ر.س</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                inv.status === 'مدفوعة' 
                                  ? 'bg-green-50 text-green-700 border border-green-100' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl text-slate-400 text-xs font-bold">
              الرجاء تحديد موزع لعرض تقاريره المفصلة وتفريغ فواتيره.
            </div>
          )}

        </div>

      </div>

      {/* Saisie (Invoice Keying) Modal */}
      <AnimatePresence>
        {showSaisieModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaisieModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant z-10 text-right font-sans"
            >
              <div className="bg-primary text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">تفريغ فواتير المبيعات (Saisie) 📝</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">تسجيل مبيعات الموزع: {selectedDistributor?.name}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowSaisieModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaisieSubmit} className="p-6 space-y-4">
                
                {saisieError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{saisieError}</span>
                  </div>
                )}
                {saisieSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{saisieSuccess}</span>
                  </div>
                )}

                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">اختر صنف المبيعات المراد تفريغه *</label>
                  <select
                    value={saisieProductId}
                    onChange={(e) => setSaisieProductId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-outline-variant rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">-- اختر المنتج من المخزن المركزي --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock === 0}>
                        {p.name} (المتاح بالمستودع: {p.stock}) - سعر الحبة: {p.sellPrice} ر.س
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">الكمية المباعة (المسحوبة للتوزيع) *</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="مثال: 12"
                    value={saisieQty || ''}
                    onChange={(e) => setSaisieQty(parseInt(e.target.value) || 0)}
                    className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Live Unit Breakdown Card */}
                {saisieProductId && (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>سعر البيع المعتمد:</span>
                      <span className="font-bold text-slate-800">
                        {products.find(p => p.id === saisieProductId)?.sellPrice || 0} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span className="font-bold text-slate-800">
                        {(((products.find(p => p.id === saisieProductId)?.sellPrice || 0) * saisieQty) * 0.15).toLocaleString()} ر.س
                      </span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between font-bold text-primary text-sm">
                      <span>إجمالي القيمة الضريبية:</span>
                      <span className="font-black font-mono">
                        {(((products.find(p => p.id === saisieProductId)?.sellPrice || 0) * saisieQty) * 1.15).toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowSaisieModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تسجيل ومزامنة الفاتورة</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Distributor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant z-10 text-right font-sans"
            >
              <div className="bg-primary text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">تسجيل موزع / مندوب جديد</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">تسجيل بيانات موزع لإصدار فواتير بيع من الجوال</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDistributor} className="p-6 space-y-4">
                
                {addDistError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">
                    {addDistError}
                  </div>
                )}
                {addDistSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100">
                    {addDistSuccess}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">اسم المندوب / الموزع بالكامل *</label>
                  <input 
                    type="text"
                    required
                    placeholder="مثال: عادل المطيري"
                    value={newDistName}
                    onChange={(e) => setNewDistName(e.target.value)}
                    className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-medium focus:outline-none focus:border-primary bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم الجوال للربط بالتطبيق *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="مثال: +966 50 111 2222"
                    value={newDistPhone}
                    onChange={(e) => setNewDistPhone(e.target.value)}
                    className="w-full text-left px-3 py-2 border border-outline-variant rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-primary bg-slate-50"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold shadow-md"
                  >
                    حفظ وتسجيل الموزع
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
