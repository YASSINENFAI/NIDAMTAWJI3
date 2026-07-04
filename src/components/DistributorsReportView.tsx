import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Calendar, TrendingUp, FileText, PlusCircle,
  ChevronLeft, Smartphone, CreditCard
} from 'lucide-react';
import { Product, Supplier, Invoice } from '../types';
import { fmtMAD } from '../lib/currency';
import { generateUniqueId } from '../lib/id';

interface DistributorsReportViewProps {
  distributors: Supplier[];
  products: Product[];
  invoices: Invoice[];
  onAddInvoice: (newInvoice: Invoice) => void;
  onUpdateProductStock: (productId: string, quantityChange: number) => void;
}

export default function DistributorsReportView({
  distributors, products, invoices, onAddInvoice, onUpdateProductStock
}: DistributorsReportViewProps) {
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>(distributors[0]?.id || '');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [showSaisieModal, setShowSaisieModal] = useState(false);
  const [saisieProductId, setSaisieProductId] = useState('');
  const [saisieQty, setSaisieQty] = useState<number>(0);
  const [saisieSuccess, setSaisieSuccess] = useState('');
  const [saisieError, setSaisieError] = useState('');

  const selectedDistributor = useMemo(
    () => distributors.find(d => d.id === selectedDistributorId) || distributors[0],
    [distributors, selectedDistributorId]
  );

  const selectedDistributorInvoices = useMemo(
    () => !selectedDistributor ? [] : invoices.filter(inv => inv.customerName === selectedDistributor.name),
    [invoices, selectedDistributor]
  );

  const isWithinPeriod = (dateStr: string, period: 'today' | 'week' | 'month') => {
    const invoiceDate = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'today') return invoiceDate >= today;
    if (period === 'week')  return invoiceDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return invoiceDate >= new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  };

  const filteredPeriodInvoices = useMemo(
    () => selectedDistributorInvoices.filter(inv => isWithinPeriod(inv.date, filterPeriod)),
    [selectedDistributorInvoices, filterPeriod]
  );

  const distributorPerformance = useMemo(() =>
    distributors.map(dist => {
      const distInvs = invoices.filter(inv => inv.customerName === dist.name);
      return {
        id: dist.id,
        name: dist.name,
        salesToday:  distInvs.filter(inv => isWithinPeriod(inv.date, 'today')).reduce((s, i) => s + i.total, 0),
        salesWeek:   distInvs.filter(inv => isWithinPeriod(inv.date, 'week')).reduce((s, i) => s + i.total, 0),
        salesMonth:  distInvs.filter(inv => isWithinPeriod(inv.date, 'month')).reduce((s, i) => s + i.total, 0),
        totalSales:  distInvs.reduce((s, i) => s + i.total, 0),
        outstanding: distInvs.filter(inv => inv.status === 'مستحقة').reduce((s, i) => s + i.balance, 0),
        invoicesCount: distInvs.length,
      };
    }),
    [distributors, invoices]
  );

  const totalStats = useMemo(() =>
    distributorPerformance.reduce((acc, p) => ({
      todayAll:           acc.todayAll + p.salesToday,
      weekAll:            acc.weekAll  + p.salesWeek,
      monthAll:           acc.monthAll + p.salesMonth,
      totalOutstandingAll: acc.totalOutstandingAll + p.outstanding,
    }), { todayAll: 0, weekAll: 0, monthAll: 0, totalOutstandingAll: 0 }),
    [distributorPerformance]
  );

  const selectedPeriodStats = useMemo(() => {
    if (!selectedDistributor) return { sales: 0, count: 0, outstanding: 0 };
    return {
      sales:       filteredPeriodInvoices.reduce((s, i) => s + i.total, 0),
      count:       filteredPeriodInvoices.length,
      outstanding: selectedDistributorInvoices.filter(inv => inv.status === 'مستحقة').reduce((s, i) => s + i.balance, 0),
    };
  }, [selectedDistributor, filteredPeriodInvoices, selectedDistributorInvoices]);

  const handleSaisieSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaisieError(''); setSaisieSuccess('');
    if (!selectedDistributor)    { setSaisieError('يرجى تحديد موزع أولاً.'); return; }
    if (!saisieProductId)        { setSaisieError('يرجى اختيار المنتج المباع.'); return; }
    if (saisieQty <= 0)          { setSaisieError('يرجى تحديد كمية صحيحة أكبر من صفر.'); return; }
    const product = products.find(p => p.id === saisieProductId);
    if (!product)                { setSaisieError('المنتج غير متوفر.'); return; }
    if (saisieQty > product.stock) { setSaisieError(`الكمية (${saisieQty}) تفوق المتوفر (${product.stock}).`); return; }

    const taxRate   = 0.20;
    const itemTotal = saisieQty * product.sellPrice * (1 + taxRate);
    const invoiceId = generateUniqueId('SAISIE');

    onAddInvoice({
      id: invoiceId,
      customerName: selectedDistributor.name,
      customerVat:  undefined,
      date:         new Date().toISOString().split('T')[0],
      dueDate:      new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      total:        itemTotal,
      balance:      itemTotal,
      status:       'مستحقة',
      items: [{
        description: `${product.name} (تفريغ مبيعات مناديب)`,
        quantity:    saisieQty,
        price:       product.sellPrice,
        tax:         20,
        total:       itemTotal,
      }],
    });

    onUpdateProductStock(product.id, -saisieQty);
    setSaisieSuccess(`تم تسجيل الفاتورة ${invoiceId} بنجاح!`);
    setSaisieProductId(''); setSaisieQty(0);
    setTimeout(() => { setShowSaisieModal(false); setSaisieSuccess(''); }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">تقارير الموزعين وتفريغ الفواتير 🚚</h1>
          <p className="text-slate-500 text-sm mt-1">تتبع تقارير مبيعات المناديب وتفريغ فواتير المبيعات اليومية (Saisie).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (selectedDistributorId) setShowSaisieModal(true); else alert('الرجاء اختيار موزع أولاً'); }}
            className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تفريغ فواتير المبيعات (Saisie)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[{
          label: 'مبيعات المناديب (اليوم)',       val: totalStats.todayAll,           color: 'emerald', icon: <TrendingUp className="w-5 h-5" />
        }, {
          label: 'مبيعات المناديب (هذا الأسبوع)', val: totalStats.weekAll,            color: 'blue',    icon: <Calendar  className="w-5 h-5" />
        }, {
          label: 'مبيعات المناديب (هذا الشهر)',   val: totalStats.monthAll,           color: 'indigo',  icon: <FileText  className="w-5 h-5" />
        }, {
          label: 'إجمالي الذمم المستحقة (الآجل)', val: totalStats.totalOutstandingAll, color: 'rose',    icon: <CreditCard className="w-5 h-5" />
        }].map(({ label, val, color, icon }) => (
          <div key={label} className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between ambient-shadow">
            <div className="space-y-1 text-right">
              <span className="text-slate-400 text-xs font-bold block">{label}</span>
              <span className={`text-xl font-black text-${color}-600 block`}>{fmtMAD(val)}</span>
            </div>
            <div className={`w-11 h-11 rounded-xl bg-${color}-50 border border-${color}-100 flex items-center justify-center text-${color}-600`}>{icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Distributor list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-outline-variant rounded-2xl p-4 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-xs">قائمة المناديب النشطين</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold">إجمالي: {distributors.length}</span>
            </div>
            <div className="space-y-2">
              {distributors.map(dist => {
                const isSelected = dist.id === selectedDistributorId;
                const perf = distributorPerformance.find(p => p.id === dist.id) || { salesMonth: 0, invoicesCount: 0 };
                return (
                  <div
                    key={dist.id}
                    onClick={() => setSelectedDistributorId(dist.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
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
                          {perf.invoicesCount} فواتير • {dist.phone || 'غير مسجل'}
                        </span>
                      </div>
                    </div>
                    <div className="text-left space-y-0.5">
                      <span className={`text-[10px] block ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>مبيعات الشهر</span>
                      <span className="text-xs font-black block">{fmtMAD(perf.salesMonth)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center italic">لتسجيل موزع جديد، انتقل إلى صفحة «المستخدمين»</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-3.5 text-right">
            <h4 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>مزامنة تطبيق الهاتف المحمول (APK)</span>
            </h4>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">يقوم الموزعون بتحميل نظام السحاب في هواتفهم لإصدار فواتير المبيعات من الشارع فور تسليم البضاعة.</p>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>بروتوكول الربط:</span>
                <span className="font-mono text-emerald-400 font-bold">JSON API Over Secure HTTPS</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>تفريغ الفواتير اليوم:</span>
                <span className="font-bold text-white">
                  {invoices.filter(i => i.id.startsWith('SAISIE-') || i.id.startsWith('INV-DIST-')).length} فواتير
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-7 space-y-6">
          {selectedDistributor ? (
            <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-bold">رقم الموزع: {selectedDistributor.id}</span>
                    {selectedDistributor.phone && <span className="text-[10px] text-slate-400 font-mono">{selectedDistributor.phone}</span>}
                  </div>
                  <h2 className="text-lg font-bold text-slate-950 mt-1">{selectedDistributor.name}</h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {(['today', 'week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setFilterPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        filterPeriod === p ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p === 'today' ? 'اليوم' : p === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">مبيعات الفترة المحددة</span>
                  <span className="text-lg font-black text-slate-900 block">{fmtMAD(selectedPeriodStats.sales)}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">الفواتير المفرغة بالفترة</span>
                  <span className="text-lg font-black text-slate-900 block">{selectedPeriodStats.count} فواتير</span>
                </div>
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1 text-right">
                  <span className="text-[10px] text-amber-600 font-bold block">إجمالي الذمم (مستحق)</span>
                  <span className="text-lg font-black text-amber-700 block">{fmtMAD(selectedPeriodStats.outstanding)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>سجل العمليات المفرغة (Saisie)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest">
                        <th className="pb-3 pr-2">رقم العملية</th>
                        <th className="pb-3">التاريخ</th>
                        <th className="pb-3">البيان</th>
                        <th className="pb-3 text-left">المبلغ</th>
                        <th className="pb-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredPeriodInvoices.map(inv => (
                        <tr key={inv.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pr-2 font-mono font-bold text-slate-900">{inv.id}</td>
                          <td className="py-3.5 text-slate-500">{inv.date}</td>
                          <td className="py-3.5 text-slate-600 font-medium">{inv.items[0]?.description || 'تفريغ مبيعات'}</td>
                          <td className="py-3.5 text-left font-black text-slate-900">{fmtMAD(inv.total)}</td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              inv.status === 'مدفوعة' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredPeriodInvoices.length === 0 && (
                        <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-[10px] font-bold italic">لا توجد عمليات مفرغة في هذه الفترة</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-white border border-outline-variant rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 shadow-sm">
              <Users className="w-10 h-10 opacity-20" />
              <span className="text-xs font-bold">يرجى اختيار موزع لعرض تقاريره</span>
            </div>
          )}
        </div>
      </div>

      {/* Saisie Modal */}
      <AnimatePresence>
        {showSaisieModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-6 text-white text-right relative">
                <button onClick={() => setShowSaisieModal(false)} className="absolute left-6 top-6 text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft className="w-6 h-6 rotate-180" />
                </button>
                <h3 className="text-xl font-black">تفريغ فواتير المبيعات 📝</h3>
                <p className="text-slate-400 text-xs mt-1">تسجيل المبيعات التي تمت بواسطة الموزع {selectedDistributor?.name}</p>
              </div>
              <form onSubmit={handleSaisieSubmit} className="p-6 space-y-4 text-right">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المنتج المباع</label>
                  <select
                    value={saisieProductId}
                    onChange={e => setSaisieProductId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="">اختر المنتج...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (متوفر: {p.stock})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الكمية المباعة</label>
                  <input
                    type="number" value={saisieQty} onChange={e => setSaisieQty(Number(e.target.value))} required min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                {saisieError   && <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl border border-rose-100">{saisieError}</div>}
                {saisieSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-xl border border-emerald-100">{saisieSuccess}</div>}
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all">
                  تأكيد وتسجيل العملية
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
