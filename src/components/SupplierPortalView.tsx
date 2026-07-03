import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  Plus, 
  History, 
  CheckCircle, 
  Clock, 
  LogOut, 
  User, 
  Smartphone, 
  FileText,
  DollarSign,
  ChevronRight,
  Boxes,
  Truck,
  X
} from 'lucide-react';
import { Product, Supplier, SupplierInvoice } from '../types';

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
  onLogout
}: SupplierPortalViewProps) {
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [supplyQty, setSupplyQty] = useState<number>(0);
  const [supplyPrice, setSupplyPrice] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Find the details of this supplier's invoices
  const invoices = supplier.invoices || [];

  const handleRegisterSupply = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedProductId) {
      setErrorMsg('الرجاء اختيار المنتج المراد توريده.');
      return;
    }
    if (supplyQty <= 0) {
      setErrorMsg('الرجاء إدخال كمية توريد صحيحة أكبر من صفر.');
      return;
    }

    const price = parseFloat(supplyPrice);
    if (isNaN(price) || price <= 0) {
      setErrorMsg('الرجاء إدخال سعر توريد صحيح.');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      setErrorMsg('المنتج المختار غير موجود.');
      return;
    }

    // 1. Create a Supplier Invoice
    const invoiceId = 'SUP-INV-' + Math.floor(100000 + Math.random() * 900000);
    const amount = supplyQty * price;
    
    const newBill: SupplierInvoice = {
      id: invoiceId,
      date: new Date().toISOString().split('T')[0],
      productsSummary: `${product.name} (عدد ${supplyQty})`,
      amount: amount,
      status: 'مكتملة'
    };

    // 2. Add Invoice to Supplier registry
    onAddSupplierInvoice(supplier.id, newBill);

    // 3. Update the Product Stock in inventory (Increment)
    onUpdateProductStock(selectedProductId, supplyQty);

    setSuccessMsg('تم تسجيل شحنة التوريد بنجاح وزيادة كمية المخزون!');
    setSelectedProductId('');
    setSupplyQty(0);
    setSupplyPrice('');

    setTimeout(() => {
      setShowSupplyModal(false);
      setSuccessMsg('');
    }, 2000);
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
            <p className="text-slate-500 text-xs mt-0.5">مرحباً بك في لوحة التوريد الرقمية الخاصة بك لمتابعة التوريد والأرصدة المستحقة.</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white border border-outline-variant p-6 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">إجمالي قيمة التوريدات</span>
            <span className="text-2xl font-black text-slate-900 block">{(supplier.totalEarned || 0).toLocaleString()} د.م.</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-6 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">شحنات التوريد المسجلة</span>
            <span className="text-2xl font-black text-slate-900 block">{invoices.length} فواتير</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-6 rounded-2xl flex items-center justify-between ambient-shadow">
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-xs font-bold block">قناة الاتصال الرسمية</span>
            <span className="text-sm font-bold text-slate-900 block font-mono mt-2">{supplier.phone || 'غير مسجل'}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Supplies History Table */}
        <div className="xl:col-span-2 bg-white border border-outline-variant rounded-2xl overflow-hidden ambient-shadow flex flex-col">
          <div className="p-5 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
            <div className="text-right">
              <h3 className="font-bold text-slate-900 text-sm">سجل الفواتير والشحنات الموردة</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">تتبع حالة وقيمة البضائع التي قمت بتوريدها إلى المستودع</p>
            </div>
            <button
              onClick={() => setShowSupplyModal(true)}
              className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل شحنة توريد جديدة</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Truck className="w-12 h-12 text-slate-300" />
                <div className="font-bold text-sm">لا توجد شحنات توريد مسجلة حالياً</div>
                <div className="text-xs">اضغط على زر التسجيل لإضافة بضائع وتحديث الأرصدة.</div>
              </div>
            ) : (
              <table className="w-full text-right border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold border-b border-outline-variant">
                    <th className="py-3 px-6">رقم الفاتورة</th>
                    <th className="py-3 px-6">تاريخ التوريد</th>
                    <th className="py-3 px-6">بيان السلع</th>
                    <th className="py-3 px-6">المبلغ الإجمالي</th>
                    <th className="py-3 px-6 text-center">حالة الشحنة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900 font-mono">{inv.id}</td>
                      <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">{inv.date}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-800 text-xs">{inv.productsSummary}</td>
                      <td className="py-3.5 px-6 font-black text-slate-900 text-xs">{(inv.amount || 0).toLocaleString()} د.م.</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>تم الاستلام والمزامنة</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Available catalog / Supply quick guide */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="bg-gradient-to-br from-slate-900 to-primary text-white p-6 rounded-2xl shadow-xl space-y-4 text-right">
            <h3 className="font-black text-sm">كيف تعمل بوابة التوريد الرقمية؟</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              تتيح لك البوابة تسجيل السلع والمواد التي قمت بتوريدها إلى مستودعاتنا في الوقت الفعلي.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-white/10 text-teal-300 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">١</span>
                <span className="text-[10.5px] text-slate-200">اختر المنتج المتوفر في قائمة السلع والمخزون</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-white/10 text-teal-300 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">٢</span>
                <span className="text-[10.5px] text-slate-200">حدد الكمية التي قمت بتوريدها والاتفاق على التكلفة</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-white/10 text-teal-300 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">٣</span>
                <span className="text-[10.5px] text-slate-200">عند الضغط على حفظ، يتم زيادة مخزون المتجر آلياً وتحديث كشف حسابك المالي</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-5 rounded-2xl space-y-4 text-right">
            <h4 className="font-bold text-slate-900 text-xs">كتالوج السلع المستهدفة</h4>
            <p className="text-[10px] text-slate-500">قائمة السلع المتاحة للتوريد ومستويات المخزون الحالية لطلب الإمداد</p>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
                  <div className="flex items-center gap-2">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <Boxes className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">{p.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{p.barcode}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-500 block">سعر التوريد المعتمد</span>
                    <span className="text-xs font-black text-primary block">{p.buyPrice} د.م.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Register Supply Delivery Modal */}
      <AnimatePresence>
        {showSupplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupplyModal(false)}
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
                    <Truck className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">تسجيل شحنة توريد جديدة</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">تحديث فوري لكميات المخزون في النظام</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowSupplyModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterSupply} className="p-6 space-y-4">
                
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100">
                    {successMsg}
                  </div>
                )}

                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">اختر المنتج للتوريد *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) {
                        setSupplyPrice(prod.buyPrice.toString());
                      }
                    }}
                    required
                    className="w-full bg-slate-50 border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">-- اختر من الكتالوج المتوفر --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (المخزون الحالي: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">الكمية الموردة *</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="مثال: 50"
                      value={supplyQty || ''}
                      onChange={(e) => setSupplyQty(parseInt(e.target.value) || 0)}
                      className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Supply Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">سعر الوحدة (د.م.) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      min="0.1"
                      placeholder="مثال: 250"
                      value={supplyPrice}
                      onChange={(e) => setSupplyPrice(e.target.value)}
                      className="w-full text-left px-3 py-2 border border-outline-variant rounded-xl text-xs font-mono font-bold bg-slate-50 focus:outline-none focus:border-primary"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Calculated Total */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-right">
                  <span className="text-slate-500 text-xs font-bold">إجمالي قيمة الفاتورة المضافة:</span>
                  <span className="text-sm font-black text-primary font-mono">
                    {((supplyQty || 0) * (parseFloat(supplyPrice) || 0)).toLocaleString()} د.م.
                  </span>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowSupplyModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>تنفيذ وتحديث المخزون</span>
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
