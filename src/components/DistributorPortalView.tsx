import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes, ShoppingBag, CheckCircle, LogOut, History, Plus, Truck, X,
  Search, Smartphone, Check,
  PlusCircle, FileText, Send, Trash2
} from 'lucide-react';
import { Product, Supplier, Invoice } from '../types';
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
    
    // Moroccan VAT 20%
    const taxRate = 0.20;
    const itemTotal = saisieQty * product.sellPrice * (1 + taxRate);
    
    setDailyBatchInvoices(prev => [...prev, { 
      customerName: distributor.name, 
      customerVat: '300998877100003', 
      date: new Date().toISOString().split('T')[0], 
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], 
      total: itemTotal, 
      status: 'مستحقة', 
      items: [{ 
        description: `${product.name} (مبيعات التجزئة للعميل: ${saisieCustomerName})`, 
        quantity: saisieQty, 
        price: product.sellPrice, 
        tax: 20, 
        total: itemTotal 
      }] 
    }]);
    
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
    
    // Moroccan VAT 20%
    const taxRate = 0.20;
    const itemTotal = orderQty * product.sellPrice * (1 + taxRate);
    const invoiceId = 'INV-DIST-' + Math.floor(100000 + Math.random() * 900000);
    
    onAddInvoice({ 
      id: invoiceId, 
      customerName: distributor.name, 
      customerVat: '300998877100003', 
      date: new Date().toISOString().split('T')[0], 
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], 
      total: itemTotal, 
      balance: itemTotal, 
      status: 'مستحقة', 
      items: [{ 
        description: `${product.name} (سحب بضائع)`, 
        quantity: orderQty, 
        price: product.sellPrice, 
        tax: 20, 
        total: itemTotal 
      }] 
    });
    
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
                            {dailyBatchInvoices.map((inv, i) => (
                              <div key={i} className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                                <div className="text-right">
                                  <div className="text-[10px] font-bold text-white">{inv.items[0].description.split(':')[1]?.trim() || 'عميل مجهول'}</div>
                                  <div className="text-[9px] text-slate-500">{inv.items[0].quantity}x • {fmtMAD(inv.total)}</div>
                                </div>
                                <button onClick={() => handleRemoveFromBatch(i)} className="text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'history' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10.5px] font-bold text-slate-400">الفواتير التي تم رفعها ({distributorInvoices.length})</span>
                      </div>
                      {distributorInvoices.map(inv => (
                        <div key={inv.id} className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-teal-400">{inv.id}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${inv.status === 'مكتملة' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{inv.status}</span>
                          </div>
                          <div className="text-[10px] font-bold text-white">{inv.items[0]?.description || 'عملية سحب'}</div>
                          <div className="flex justify-between items-center pt-1 border-t border-white/5">
                            <span className="text-[9px] text-slate-500">{inv.date}</span>
                            <span className="text-[10px] font-black text-white">{fmtMAD(inv.total)}</span>
                          </div>
                        </div>
                      ))}
                      {distributorInvoices.length === 0 && <div className="p-8 text-center text-slate-500 text-[10px]">لا يوجد سجل فواتير.</div>}
                    </div>
                  )}

                  {activeSubTab === 'inventory' && (
                    <div className="space-y-3">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex items-center gap-2 mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        <input type="text" placeholder="بحث في المخزن..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none text-[10px] text-white focus:ring-0 w-full text-right" />
                      </div>
                      {filteredProducts.map(p => (
                        <div key={p.id} className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-white">{p.name}</div>
                            <div className="text-[9px] text-slate-500">{fmtMAD(p.sellPrice)} للوحدة</div>
                          </div>
                          <div className="text-left">
                            <div className={`text-[10px] font-black ${p.stock <= 5 ? 'text-rose-400' : 'text-teal-400'}`}>{p.stock} متاح</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-slate-950 p-2.5 border-t border-white/5 flex justify-center">
                  <div className="w-24 h-1 bg-slate-800 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${isMobileEmulator ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6`}>
          <div className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-right">
                <h2 className="text-xl font-black text-slate-900">الملخص المالي للمندوب 📊</h2>
                <p className="text-xs text-slate-500 mt-0.5">متابعة المبيعات والديون المستحقة لـ {distributor.name}</p>
              </div>
              <button onClick={() => setShowOrderModal(true)} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all">
                <PlusCircle className="w-4 h-4" /><span>طلب سحب بضائع جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-right relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-1 h-full bg-teal-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">إجمالي المسحوبات</span>
                <span className="text-2xl font-black text-slate-900 block">{fmtMAD(totalPurchased)}</span>
                <div className="flex items-center gap-1.5 text-[9px] text-teal-600 font-bold mt-1">
                  <CheckCircle className="w-3 h-3" /><span>فواتير مسجلة في النظام</span>
                </div>
              </div>
              <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2 text-right relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-1 h-full bg-rose-500" />
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block">الذمم المستحقة (الآجل)</span>
                <span className="text-2xl font-black text-rose-600 block">{fmtMAD(totalOutstanding)}</span>
                <div className="flex items-center gap-1.5 text-[9px] text-rose-500 font-bold mt-1">
                  <History className="w-3 h-3" /><span>يجب تسويتها مع المدير العام</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /><span>آخر الفواتير المسجلة</span>
                </h3>
                {distributorInvoices.length > 0 && (
                  <button 
                    onClick={() => {
                      const data = distributorInvoices.map(inv => ({
                        'رقم الفاتورة': inv.id,
                        'التاريخ': inv.date,
                        'البيان': inv.items[0]?.description || 'سحب بضائع',
                        'الإجمالي': inv.total,
                        'الحالة': inv.status
                      }));
                      exportToExcel(data, `Distributor_Invoices_${distributor.name}_${new Date().toISOString().split('T')[0]}`, 'Invoices');
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>تصدير السجل لـ Excel</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest">
                      <th className="pb-3 pr-2">رقم الفاتورة</th>
                      <th className="pb-3">التاريخ</th>
                      <th className="pb-3">البيان</th>
                      <th className="pb-3 text-left">المبلغ</th>
                      <th className="pb-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {distributorInvoices.slice(0, 10).map(inv => (
                      <tr key={inv.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pr-2 font-mono font-bold text-slate-900">{inv.id}</td>
                        <td className="py-4 text-slate-500">{inv.date}</td>
                        <td className="py-4 text-slate-600 font-medium">{inv.items[0]?.description || 'سحب بضائع'}</td>
                        <td className="py-4 text-left font-black text-slate-900">{fmtMAD(inv.total)}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${inv.status === 'مكتملة' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {distributorInvoices.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-[10px] font-bold italic">لا توجد فواتير مسجلة حالياً</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-slate-900 p-6 text-white text-right relative">
                <button onClick={() => setShowOrderModal(false)} className="absolute left-6 top-6 text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                <h3 className="text-xl font-black">طلب سحب بضائع 📦</h3>
                <p className="text-slate-400 text-xs mt-1">قم باختيار المنتجات التي تريد سحبها من المخزن المركزي.</p>
              </div>
              <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-right">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المنتج المطلوب</label>
                  <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all">
                    <option value="">اختر المنتج...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (متوفر: {p.stock})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الكمية المطلوبة</label>
                  <input type="number" value={orderQty} onChange={e => setOrderQty(Number(e.target.value))} required min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all" />
                </div>
                {errorMsg && <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl border border-rose-100">{errorMsg}</div>}
                {successMsg && <div className="p-3 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-xl border border-emerald-100">{successMsg}</div>}
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all">تأكيد الطلب</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
