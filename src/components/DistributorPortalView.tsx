import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes, ShoppingBag, LogOut, History, Plus, Truck,
  Search, Check, FileText, Send, Trash2, AlertCircle, Loader2
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
  const [activeSubTab, setActiveSubTab] = useState<'sales_saisie' | 'history' | 'inventory'>('sales_saisie');
  const [saisieCustomerName, setSaisieCustomerName] = useState('');
  const [saisieProductId, setSaisieProductId] = useState('');
  const [saisieQty, setSaisieQty] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saisieError, setSaisieError] = useState('');
  const [saisieSuccess, setSaisieSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Use the distributor's real name to filter invoices they created
  const distributorInvoices = useMemo(() => 
    invoices.filter(inv => inv.customerName === distributor.name), 
    [invoices, distributor.name]
  );
  
  const totalPurchased = useMemo(() => 
    distributorInvoices.reduce((acc, curr) => acc + curr.total, 0), 
    [distributorInvoices]
  );
  
  const totalOutstanding = useMemo(() => 
    distributorInvoices.reduce((acc, curr) => acc + (curr.status === 'مستحقة' ? curr.balance : 0), 0), 
    [distributorInvoices]
  );

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), 
    [products, searchTerm]
  );

  const handleDirectSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaisieError(''); setSaisieSuccess('');
    if (!saisieCustomerName.trim()) { setSaisieError('يرجى تحديد اسم العميل.'); return; }
    if (!saisieProductId) { setSaisieError('يرجى اختيار المنتج.'); return; }
    if (saisieQty <= 0) { setSaisieError('يرجى إدخال كمية صحيحة.'); return; }
    
    const product = products.find(p => p.id === saisieProductId);
    if (!product) { setSaisieError('المنتج غير متوفر.'); return; }
    if (saisieQty > product.stock) { setSaisieError(`الكمية (${saisieQty}) تتجاوز المخزون (${product.stock}).`); return; }
    
    setIsSubmitting(true);
    try {
      const taxRate = 0.20;
      const itemTotal = saisieQty * product.sellPrice * (1 + taxRate);
      const invoiceId = 'INV-DIST-' + Math.floor(100000 + Math.random() * 900000);
      
      const newInvoice: Invoice = { 
        id: invoiceId,
        customerName: distributor.name, // Set to distributor name for admin visibility
        customerVat: '', 
        date: new Date().toISOString().split('T')[0], 
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], 
        total: itemTotal, 
        balance: itemTotal,
        status: 'مستحقة', 
        items: [{ 
          description: `${product.name} (مبيع لـ: ${saisieCustomerName})`, 
          quantity: saisieQty, 
          price: product.sellPrice, 
          tax: 20, 
          total: itemTotal 
        }] 
      };

      await onAddInvoice(newInvoice);
      await onUpdateProductStock(product.id, -saisieQty);
      
      setSaisieProductId(''); setSaisieQty(0); setSaisieCustomerName('');
      setSaisieSuccess('تم تسجيل العملية بنجاح ورفعها للمدير!');
      setTimeout(() => setSaisieSuccess(''), 3000);
    } catch (err: any) {
      setSaisieError('فشل تسجيل العملية: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10" dir="rtl">
      {/* Responsive Header */}
      <div className="bg-slate-900 text-white p-4 md:p-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Truck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-black">{distributor.name}</h2>
              <p className="text-xs text-teal-400 font-bold">بوابة المندوب الذكية</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={onLogout} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /><span>خروج</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-bold mb-1">إجمالي المبيعات</p>
            <p className="text-2xl font-black text-slate-900">{fmtMAD(totalPurchased)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-bold mb-1">الديون المستحقة</p>
            <p className="text-2xl font-black text-rose-600">{fmtMAD(totalOutstanding)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-bold mb-1">عدد العمليات</p>
            <p className="text-2xl font-black text-teal-600">{distributorInvoices.length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-200 p-1 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
          {(['sales_saisie', 'history', 'inventory'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeSubTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'sales_saisie' && <PlusCircle className="w-4 h-4" />}
              {tab === 'history' && <History className="w-4 h-4" />}
              {tab === 'inventory' && <Boxes className="w-4 h-4" />}
              {tab === 'sales_saisie' ? 'تسجيل مبيع' : tab === 'history' ? 'سجل العمليات' : 'المخزون'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSubTab === 'sales_saisie' && (
              <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">تسجيل فاتورة جديدة</h3>
                </div>

                <form onSubmit={handleDirectSale} className="space-y-5">
                  {saisieError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />{saisieError}
                    </div>
                  )}
                  {saisieSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold rounded-2xl flex items-center gap-2">
                      <Check className="w-4 h-4" />{saisieSuccess}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">اسم الزبون (المحل)</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: بقالة الأمانة"
                      value={saisieCustomerName}
                      onChange={e => setSaisieCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">المنتج المباع</label>
                      <select
                        value={saisieProductId}
                        onChange={e => setSaisieProductId(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      >
                        <option value="">-- اختر المنتج --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock === 0}>
                            {p.name} ({p.stock} متاح)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">الكمية</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={saisieQty || ''}
                        onChange={e => setSaisieQty(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {saisieProductId && saisieQty > 0 && (
                    <div className="p-6 bg-slate-900 rounded-3xl text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">سعر الوحدة:</span>
                        <span className="font-bold">{fmtMAD(products.find(p => p.id === saisieProductId)?.sellPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <span className="text-sm font-bold">الإجمالي (شامل الضريبة 20%):</span>
                        <span className="text-xl font-black text-teal-400">
                          {fmtMADFull((products.find(p => p.id === saisieProductId)?.sellPrice || 0) * saisieQty * 1.20)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 rounded-2xl text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    <span>{isSubmitting ? 'جاري الرفع...' : 'تأكيد العملية ورفعها'}</span>
                  </button>
                </form>
              </div>
            )}

            {activeSubTab === 'history' && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-slate-900">سجل عملياتي الأخيرة</h3>
                  <button 
                    onClick={() => {
                      const data = distributorInvoices.map(inv => ({
                        'رقم الفاتورة': inv.id,
                        'التاريخ': inv.date,
                        'البيان': inv.items[0].description,
                        'المبلغ': inv.total,
                        'الحالة': inv.status
                      }));
                      exportToExcel(data, `Sales_History_${distributor.name}`, 'History');
                    }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700"
                  >تصدير Excel</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">التاريخ</th>
                        <th className="px-6 py-4">البيان</th>
                        <th className="px-6 py-4">المبلغ</th>
                        <th className="px-6 py-4">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {distributorInvoices.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">لا توجد عمليات مسجلة بعد.</td></tr>
                      ) : (
                        distributorInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{inv.date}</td>
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{inv.items[0].description}</td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900">{fmtMAD(inv.total)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                inv.status === 'مدفوعة' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>{inv.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === 'inventory' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="font-black text-slate-900 text-xl">المخزون المتوفر بالمحل</h3>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث عن منتج..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-2xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <Boxes className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          product.stock > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {product.stock} متوفر
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 mb-1">{product.name}</h4>
                      <p className="text-xs text-slate-500 mb-4">{product.category || 'عام'}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <span className="text-xs text-slate-400 font-bold">سعر البيع:</span>
                        <span className="text-lg font-black text-slate-900">{fmtMAD(product.sellPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Re-add missing icons
function PlusCircle(props: any) {
  return <Plus {...props} />
}
