import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, History, CheckCircle, LogOut,
  FileText, DollarSign, X, Boxes
} from 'lucide-react';
import { Product, Supplier, SupplierInvoice } from '../types';
import { generateUniqueId } from '../lib/id';
import { fmtMAD } from '../lib/currency';

interface SupplierPortalViewProps {
  supplier: Supplier;
  products: Product[];
  onAddSupplierInvoice: (supplierId: string, newBill: SupplierInvoice) => void;
  onUpdateProductStock: (productId: string, quantityChange: number) => void;
  onLogout: () => void;
}

export default function SupplierPortalView({
  supplier,
  products,
  onAddSupplierInvoice,
  onUpdateProductStock,
  onLogout,
}: SupplierPortalViewProps) {
  const [showSupplyModal, setShowSupplyModal]   = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [supplyQty, setSupplyQty]               = useState<number>(0);
  const [supplyPrice, setSupplyPrice]           = useState<string>('');
  const [successMsg, setSuccessMsg]             = useState('');
  const [errorMsg, setErrorMsg]                 = useState('');

  const invoices = supplier.invoices || [];

  const handleRegisterSupply = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(''); setErrorMsg('');

    if (!selectedProductId) { setErrorMsg('الرجاء اختيار المنتج المراد توريده.'); return; }
    if (supplyQty <= 0)     { setErrorMsg('الرجاء إدخال كمية توريد صحيحة أكبر من صفر.'); return; }

    const price = parseFloat(supplyPrice);
    if (isNaN(price) || price <= 0) { setErrorMsg('الرجاء إدخال سعر توريد صحيح.'); return; }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) { setErrorMsg('المنتج المختار غير موجود.'); return; }

    const invoiceId = generateUniqueId('SUP-INV');
    const amount    = supplyQty * price;

    const newBill: SupplierInvoice = {
      id:              invoiceId,
      date:            new Date().toISOString().split('T')[0],
      productsSummary: `${product.name} (عدد ${supplyQty})`,
      amount,
      status: 'مكتملة',
    };

    onAddSupplierInvoice(supplier.id, newBill);
    onUpdateProductStock(selectedProductId, supplyQty);

    setSuccessMsg('تم تسجيل شحنة التوريد بنجاح وزيادة كمية المخزون!');
    setSelectedProductId(''); setSupplyQty(0); setSupplyPrice('');
    setTimeout(() => { setShowSupplyModal(false); setSuccessMsg(''); }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="bg-white border border-outline-variant p-6 rounded-3xl ambient-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 text-right">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl">
            {supplier.initialLetter || 'م'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold">بوابة المورّدين</span>
              <span className="text-xs text-slate-400 font-mono">رقم الحساب: {supplier.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-950 mt-1">{supplier.name}</h1>
            <p className="text-slate-500 text-xs mt-0.5">مرحباً بك في لوحة التوريد الرقمية الخاصة بك.</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج من البوابة</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-outline-variant p-6 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">إجمالي المكاسب</span>
            <span className="text-2xl font-black text-slate-900 block">{fmtMAD(supplier.totalEarned ?? 0)}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-6 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">عدد الشحنات</span>
            <span className="text-2xl font-black text-slate-900 block">{invoices.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-6 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">المنتجات المتاحة</span>
            <span className="text-2xl font-black text-slate-900 block">{products.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => setShowSupplyModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>تسجيل شحنة توريد جديدة</span>
      </button>

      {/* Invoice history */}
      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden ambient-shadow">
        <div className="p-5 border-b border-outline-variant flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-on-surface">سجل الشحنات</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-sm">لا توجد شحنات مسجلة بعد.</div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-surface-container transition-colors">
                <div>
                  <p className="text-sm font-bold text-on-surface">{inv.productsSummary}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{inv.date} — {inv.id}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-on-surface">{fmtMAD(inv.amount)}</p>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supply Modal */}
      <AnimatePresence>
        {showSupplyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant z-10 text-right font-sans"
            >
              <div className="bg-primary text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">تسجيل شحنة توريد</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">{supplier.name}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowSupplyModal(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterSupply} className="p-6 space-y-4">
                {errorMsg   && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">{errorMsg}</div>}
                {successMsg && <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100">{successMsg}</div>}

                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">المنتج</label>
                  <select
                    value={selectedProductId}
                    onChange={e => {
                      setSelectedProductId(e.target.value);
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) setSupplyPrice(prod.buyPrice.toString());
                    }}
                    required
                    className="w-full bg-slate-50 border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">-- اختر المنتج --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} في المخزون)</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">الكمية</label>
                    <input
                      type="number" required min="1" placeholder="50"
                      value={supplyQty}
                      onChange={e => setSupplyQty(parseInt(e.target.value) || 0)}
                      className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:border-primary"
                    />
                  </div>
                  {/* Supply Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">سعر التوريد (د.م.)</label>
                    <input
                      type="number" required min="0.01" step="0.01" placeholder="0.00"
                      value={supplyPrice}
                      onChange={e => setSupplyPrice(e.target.value)}
                      className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {selectedProductId && supplyQty > 0 && supplyPrice && (
                  <div className="p-4 bg-slate-900 rounded-2xl text-white flex justify-between items-center">
                    <span className="text-xs text-slate-400">إجمالي الفاتورة:</span>
                    <span className="text-lg font-black text-teal-400">{fmtMAD(supplyQty * parseFloat(supplyPrice || '0'))}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
                >
                  تأكيد وتسجيل الشحنة
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
