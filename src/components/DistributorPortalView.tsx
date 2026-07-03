import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes, ShoppingBag, CheckCircle, LogOut, History, Plus, Truck, X,
  CreditCard, DollarSign, Search, AlertCircle, Smartphone, Check,
  PlusCircle, FileText, User, ListPlus, Send, Trash2
} from 'lucide-react';
import { Product, Supplier, Invoice, InvoiceItem } from '../types';
import { fmtMAD, fmtMADFull } from '../lib/currency';
import { exportToExcel } from '../lib/export';

interface DistributorPortalViewProps {
  distributor: Supplier;
  products: Product[];
  invoices: Invoice[];
  onAddInvoice: (newInvoice: Invoice) => void;
  onUpdateProductStock: (productId: string, quantityChange: number) => void;
  onLogout: () => void;
}

export default function DistributorPortalView({
  distributor, products, invoices, onAddInvoice, onUpdateProductStock, onLogout
}: DistributorPortalViewProps) {
  const [isMobileEmulator, setIsMobileEmulator] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'sales_saisie' | 'history' | 'inventory'>('sales_saisie');
  const [saisieCustomerName, setSaisieCustomerName] = useState('');
  const [saisieProductId, setSaisieProductId] = useState('');
  const [saisieQty, setSaisieQty] = useState<number>(0);
  const [dailyBatchInvoices, setDailyBatchInvoices] = useState<Omit<Invoice, 'id' | 'balance'>[]>([]);
  const [saisieError, setSaisieError] = useState('');
  const [saisieSuccess, setSaisieSuccess] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const distributorInvoices = useMemo(() => invoices.filter(inv => inv.customerName === distributor.name), [invoices, distributor.name]);
  const totalPurchased = useMemo(() => distributorInvoices.reduce((acc, curr) => acc + curr.total, 0), [distributorInvoices]);
  const totalOutstanding = useMemo(() => distributorInvoices.reduce((acc, curr) => acc + (curr.status === 'مستحقة' ? curr.balance : 0), 0), [distributorInvoices]);
  const filteredProducts = useMemo(() => products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);

  const handleAddToBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setSaisieError(''); setSaisieSuccess('');
    if (!saisieCustomerName.trim()) { setSaisieError('يرجى تحديد اسم العميل.'); return; }
    if (!saisieProductId) { setSaisieError('يرجى اختيار المنتج.'); return; }
    if (saisieQty <= 0) { setSaisieError('يرجى إدخال كمية صحيحة.'); return; }
    const product = products.find(p => p.id === saisieProductId);
    if (!product) { setSaisieError('المنتج غير متوفر.'); return; }
    if (saisieQty > product.stock) { setSaisieError(`الكمية (${saisieQty}) تتجاوز المخزون (${product.stock}).`); return; }
    const total = saisieQty * product.sellPrice * 1.20;
    setDailyBatchInvoices(prev => [...prev, { customerName: distributor.name, customerVat: '300998877100003', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], total, status: 'مستحقة', items: [{ description: `${product.name} (مبيعات التجزئة للعميل: ${saisieCustomerName})`, quantity: saisieQty, price: product.sellPrice, tax: 20, total }] }]);
    setSaisieProductId(''); setSaisieQty(0); setSaisieCustomerName('');
    setSaisieSuccess('تمت إضافة الفاتورة للدفعة بنجاح!');
    setTimeout(() => setSaisieSuccess(''), 3000);
  };

  const handleRemoveFromBatch = (index: number) => setDailyBatchInvoices(prev => prev.filter((_, i) => i !== index));

  const handleSyncBatchToCentral = () => {
    if (dailyBatchInvoices.length === 0) { setSaisieError('سجل الدفعة فارغ.'); return; }
    dailyBatchInvoices.forEach(inv => {
      const id = 'INV-DIST-' + Math.floor(100000 + Math.random() * 900000);
      const productItem = products.find(p => inv.items[0].description.includes(p.name));
      if (productItem) onUpdateProductStock(productItem.id, -inv.items[0].quantity);
      onAddInvoice({ ...inv, id, balance: inv.total });
    });
    const count = dailyBatchInvoices.length;
    setDailyBatchInvoices([]);
    setSaisieSuccess(`تمت المزامنة بنجاح! تم رفع ${count} فواتير.`);
    setTimeout(() => { setActiveSubTab('history'); setSaisieSuccess(''); }, 2000);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    if (!selectedProductId) { setErrorMsg('الرجاء اختيار المنتج.'); return; }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) { setErrorMsg('المنتج غير موجود.'); return; }
    if (orderQty <= 0) { setErrorMsg('الرجاء إدخال كمية صحيحة.'); return; }
    if (orderQty > product.stock) { setErrorMsg(`الكمية (${orderQty}) تتجاوز المخزون (${product.stock}).`); return; }
    const total = orderQty * product.sellPrice * 1.20;
    const invoiceId = 'INV-DIST-' + Math.floor(100000 + Math.random() * 900000);
    onAddInvoice({ id: invoiceId, customerName: distributor.name, customerVat: '300998877100003', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], total, balance: total, status: 'مستحقة', items: [{ description: `${product.name} (سحب بضائع)`, quantity: orderQty, price: product.sellPrice, tax: 20, total }] });
    onUpdateProductStock(product.id, -orderQty);
    setSuccessMsg('تم تسجيل الفاتورة بنجاح!');
    setSelectedProductId(''); setOrderQty(0);
    setTimeout(() => { setShowOrderModal(false); setSuccessMsg(''); }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-bold">بوابة الهواتف والـ APK للمناديب 📱</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMobileEmulator(!isMobileEmulator)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${isMobileEmulator ? 'bg-teal-500 border-teal-500 text-slate-950 shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
            {isMobileEmulator ? 'إخفاء محاكي الهاتف' : 'تفعيل محاكي الهاتف الذكي 📱'}
          </button>
          <button onClick={onLogout} className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/30">خروج</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {isMobileEmulator && (
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-[375px] h-[780px] bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-[6px] border-slate-800 ring-4 ring-slate-900 flex flex-col overflow-hidden text-right font-sans">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center gap-2">
                <div className="w-12 h-1 bg-slate-800 rounded-full" /><div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-800" />
              </div>
              <div className="flex justify-between items-center text-[10px] text-white/80 font-mono px-5 pt-3 pb-2 z-40 bg-slate-900 border-b border-white/5">
                <span className="font-bold">100% 🔋</span><span className="font-bold">09:41 AM ⏰</span><span className="font-bold">5G 📧</span>
              </div>
              <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden rounded-[2.5rem] relative">
                <div className="bg-slate-900 p-4 border-b border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-teal-400/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-full font-bold">تطبيق مندوب v1.4</span>
                    <span className="text-[9px] text-slate-400 font-mono">ID: {distributor.id}</span>
                  </div>
                  <h3 className="text-sm font-black text-white">{distributor.name} 🚚</h3>
                  <p className="text-[10px] text-slate-400">سجل فواتير الزبائن مباشرة من السيارة للربط مع المحل.</p>
                </div>
                <div className="grid grid-cols-3 bg-slate-950 p-1.5 border-b border-white/5 text-[10.5px] font-bold text-slate-400">
                  {(['sales_saisie','history','inventory'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveSubTab(tab)} className={`py-2 rounded-xl transition-all ${activeSubTab === tab ? 'bg-teal-500 text-slate-950 shadow-sm' : 'hover:text-white'}`}>
                      {tab === 'sales_saisie' ? 'تفريغ الفواتير' : tab === 'history' ? 'سجل فواتيري' : 'مخزن السلع'}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-slate-900 text-white">
                  {activeSubTab === 'sales_saisie' && (
                    <div className="space-y-4">
                      <form onSubmit={handleAddToBatch} className="bg-slate-950/80 p-3.5 border border-white/10 rounded-2xl space-y-3">
                        <span className="text-[10.5px] font-bold text-teal-300 block">إدخال الفاتورة الحالية (Saisie)</span>
                        {saisieError && <div className="p-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg">{saisieError}</div>}
                        {saisieSuccess && <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg">{saisieSuccess}</div>}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">اسم العميل *</label>
                          <input type="text" required placeholder="مثال: بقالة الأمانة" value={saisieCustomerName} onChange={e => setSaisieCustomerName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500 text-right" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">الصنف المباع *</label>
                          <select value={saisieProductId} onChange={e => setSaisieProductId(e.target.value)} required className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-teal-500 text-right">
                            <option value="">-- اختر --</option>
                            {products.map(p => <option key={p.id} value={p.id} disabled={p.stock === 0} className="bg-slate-900">{p.name} ({p.stock} متاح)</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">الكمية *</label>
                          <input type="number" required min="1" value={saisieQty || ''} onChange={e => setSaisieQty(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none text-right font-bold" placeholder="0" />
                        </div>
                        {saisieProductId && saisieQty > 0 && (
                          <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-[10px]">
                            <div className="flex justify-between text-slate-400">
                              <span>الإجمالي (شامل 20%):</span>
                              <span className="font-bold text-white">{fmtMADFull((products.find(p => p.id === saisieProductId)?.sellPrice || 0) * saisieQty * 1.20)}</span>
                            </div>
                          </div>
                        )}
                        <button type="submit" className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 mt-2">
                          <Plus className="w-4 h-4" /><span>إضافة للدفعة</span>
                        </button>
                      </form>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10.5px] font-bold text-slate-400">دفعة الفواتير ({dailyBatchInvoices.length})</span>
                          <div className="flex gap-2">
                            {dailyBatchInvoices.length > 0 && (
                              <button 
                                onClick={() => {
                                  const data = dailyBatchInvoices.map(inv => ({
                                    'العميل': inv.customerName,
                                    'التاريخ': inv.date,
                                    'البيان': inv.items[0].description,
                                    'الكمية': inv.items[0].quantity,
                                    'الإجمالي': inv.total
                                  }));
                                  exportToExcel(data, `Batch_Export_${new Date().toISOString().split('T')[0]}`, 'Batch');
                                }} 
                                className="text-[10px] font-black text-blue-400 flex items-center gap-1 hover:underline"
                              >
                                <span>تصدير Excel</span>
                              </button>
                            )}
                            {dailyBatchInvoices.length > 0 && (
                              <button onClick={handleSyncBatchToCentral} className="text-[10px] font-black text-teal-400 flex items-center gap-1 hover:underline">
                                <Send className="w-3 h-3" /><span>مزامنة الآن ⚡</span>
                              </button>
                            )}
                          </div>
                        </div>
                        {dailyBatchInvoices.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-[10px] bg-slate-950/40 border border-white/5 rounded-2xl">سجل التفريغ فارغ.</div>
                        ) : (
                          <div className="space-y-2">
                            {dailyBatchInvoices.map((binv, idx) => (
                              <div key={idx} className="p-3 bg-slate-950 border border-white/5 rounded-xl flex justify-between items-center">
                                <div className="text-right">
                                  <span className="text-xs font-bold block text-white">{binv.items[0].description.split('(')[0]}</span>
                                  <span className="text-[9px] text-teal-400 font-bold block">كم: {binv.items[0].quantity} • {fmtMAD(binv.total)}</span>
                                </div>
                                <button onClick={() => handleRemoveFromBatch(idx)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'history' && (
                    <div className="space-y-3">
                      <span className="text-[10.5px] font-bold text-slate-400 block px-1">كشف المسحوبات</span>
                      {distributorInvoices.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-[10px]">لا توجد فواتير.</div>
                      ) : (
                        <div className="space-y-2">
                          {distributorInvoices.map(inv => (
                            <div key={inv.id} className="p-3 bg-slate-950 border border-white/5 rounded-xl space-y-2 text-right">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-teal-300 font-mono">{inv.id}</span>
                                <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${inv.status === 'مدفوعة' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>{inv.status}</span>
                              </div>
                              <p className="text-[10px] text-slate-300 font-semibold">{inv.items[0]?.description || 'توزيع بضائع'}</p>
                              <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[9px] text-slate-400">
                                <span className="font-mono">{inv.date}</span>
                                <span className="font-bold text-white text-xs">{fmtMAD(inv.total)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSubTab === 'inventory' && (
                    <div className="space-y-3">
                      <span className="text-[10.5px] font-bold text-slate-400 block px-1">المخزون المركزي</span>
                      <div className="space-y-2">
                        {products.map(p => (
                          <div key={p.id} className="p-3 bg-slate-950 border border-white/5 rounded-xl flex justify-between items-center text-right">
                            <div>
                              <span className="text-xs font-bold text-white block">{p.name}</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">سعر التجزئة: {fmtMAD(p.sellPrice)}</span>
                            </div>
                            <div className="text-left">
                              <span className="text-[9px] text-slate-500 block">المتاح</span>
                              <span className={`text-[11px] font-bold block ${p.stock === 0 ? 'text-red-400' : 'text-teal-400'}`}>{p.stock} حبة</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-slate-950/90 text-center text-[9px] text-slate-500 border-t border-white/5">تم التحديث تلقائياً • اتصال مشفر</div>
              </div>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${isMobileEmulator ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="space-y-1 text-right">
                <span className="text-slate-400 text-xs font-bold block">إجمالي المسحوبات والمبيعات</span>
                <span className="text-2xl font-black text-slate-900 block">{fmtMAD(totalPurchased)}</span>
                <span className="text-[10px] text-slate-400 block">شامل ضريبة القيمة المضافة 15%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600"><Boxes className="w-6 h-6" /></div>
            </div>
            <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="space-y-1 text-right">
                <span className="text-slate-400 text-xs font-bold block">الذمم والمديونية المستحقة</span>
                <span className="text-2xl font-black text-rose-600 block">{fmtMAD(totalOutstanding)}</span>
                <span className="text-[10px] text-amber-600 block">يرجى تسوية المديونيات</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600"><CreditCard className="w-6 h-6" /></div>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="text-right">
                <h3 className="font-bold text-slate-900 text-sm">تفاصيل العمليات المزامنة</h3>
                <span className="text-[10px] text-slate-500 block mt-0.5">كشف حركة الفواتير</span>
              </div>
              <button onClick={() => setShowOrderModal(true)} className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" /><span>طلب سحب بضاعة (يدوي)</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              {distributorInvoices.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">لا توجد فواتير بعد.</div>
              ) : (
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                      <th className="py-2.5 px-4">رقم الفاتورة</th>
                      <th className="py-2.5 px-4">تاريخ الرفع</th>
                      <th className="py-2.5 px-4">بيان التوزيع</th>
                      <th className="py-2.5 px-4">المبلغ (شامل الضريبة)</th>
                      <th className="py-2.5 px-4 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {distributorInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.id}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono">{inv.date}</td>
                        <td className="py-2.5 px-4 text-slate-700 font-semibold max-w-[200px] truncate">{inv.items[0]?.description}</td>
                        <td className="py-2.5 px-4 font-black text-slate-950">{fmtMAD(inv.total)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${inv.status === 'مدفوعة' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOrderModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant z-10 text-right font-sans">
              <div className="bg-primary text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-teal-300" /></div>
                  <div>
                    <h3 className="font-bold text-sm">سحب بضائع جديدة</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">طلب من المستودع</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowOrderModal(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{errorMsg}</div>}
                {successMsg && <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{successMsg}</div>}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">اختر المنتج *</label>
                  <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} required className="w-full bg-slate-50 border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary">
                    <option value="">-- اختر من المستودع --</option>
                    {products.map(p => <option key={p.id} value={p.id} disabled={p.stock === 0}>{p.name} ({p.stock} وحدة)</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">الكمية *</label>
                  <input type="number" required min="1" placeholder="مثال: 15" value={orderQty || ''} onChange={e => setOrderQty(parseInt(e.target.value) || 0)} className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:border-primary" />
                </div>
                {selectedProductId && orderQty > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>سعر البيع:</span>
                      <span className="font-bold text-slate-800">{fmtMAD(products.find(p => p.id === selectedProductId)?.sellPrice || 0)} / وحدة</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ضريبة 15%:</span>
                      <span className="font-bold text-slate-800">{fmtMAD(((products.find(p => p.id === selectedProductId)?.sellPrice || 0) * orderQty) * 0.15)}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between font-bold text-primary">
                      <span>إجمالي الفاتورة:</span>
                      <span className="text-sm font-black font-mono text-slate-900">{fmtMAD(((products.find(p => p.id === selectedProductId)?.sellPrice || 0) * orderQty) * 1.15)}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
                  <button type="submit" className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold shadow-md">تأكيد سحب البضاعة</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
