import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ChevronLeft, 
  TrendingUp, 
  Wallet, 
  Receipt, 
  Calendar, 
  Barcode, 
  Check,
  Search,
  CheckCircle,
  Clock,
  Briefcase,
  Phone
} from 'lucide-react';
import { Supplier, SupplierInvoice } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onAddSupplierInvoice: (supplierId: string, invoice: SupplierInvoice) => void;
}

export default function SuppliersView({ suppliers, onAddSupplierInvoice }: SuppliersViewProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Input states for new supplier invoice
  const [billId, setBillId] = useState('');
  const [billDate, setBillDate] = useState('');
  const [productSummary, setProductSummary] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [totalAmount, setTotalAmount] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Find currently selected supplier
  const selectedSupplier = useMemo(() => {
    return suppliers.find(sup => sup.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  // Handle Form Submission
  const handleAddBill = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!billId.trim()) {
      setFormError('يرجى إدخال رقم الفاتورة');
      return;
    }
    if (!billDate) {
      setFormError('يرجى تحديد تاريخ الفاتورة');
      return;
    }
    if (!productSummary.trim()) {
      setFormError('يرجى كتابة وصف المنتجات أو الباركود');
      return;
    }
    
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('يرجى إدخال مبلغ إجمالي صالح أكبر من صفر');
      return;
    }

    const newInvoice: SupplierInvoice = {
      id: billId.toUpperCase(),
      date: billDate,
      productsSummary: `${productSummary} (x${quantity})`,
      amount,
      status: 'مكتملة',
    };

    onAddSupplierInvoice(selectedSupplierId, newInvoice);

    // Reset Form
    setBillId('');
    setBillDate('');
    setProductSummary('');
    setQuantity(1);
    setTotalAmount('');

    setFormSuccess('تم حفظ فاتورة المورد وتحديث الملخص المالي بنجاح!');
    setTimeout(() => {
      setFormSuccess('');
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">إدارة الموردين وإدخال الفواتير</h1>
        <p className="text-secondary text-sm mt-1">تسجيل ومتابعة مستحقات الموردين وإدخال فواتير المشتريات الضريبية الواردة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Supplier list & stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* List Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>الموردين والموزعين</span>
              </h2>
            </div>

            <ul className="space-y-2">
              {suppliers.map((sup) => {
                const isSelected = sup.id === selectedSupplierId;
                return (
                  <li 
                    key={sup.id}
                    onClick={() => {
                      setSelectedSupplierId(sup.id);
                      setFormError('');
                      setFormSuccess('');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-150 ${
                      isSelected 
                        ? 'bg-secondary-container/25 border-primary/20 font-semibold text-primary' 
                        : 'border-transparent hover:bg-surface-container-low hover:border-outline-variant'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isSelected 
                          ? 'bg-primary text-white' 
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {sup.initialLetter}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold block leading-snug">{sup.name}</span>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                          sup.type === 'موزع' 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {sup.type || 'مورد'}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-on-surface-variant opacity-60'}`} />
                  </li>
                );
              })}
            </ul>
            <p className="text-[10px] text-slate-400 mt-4 text-center italic">لإضافة مورد أو موزع جديد، انتقل إلى صفحة "المستخدمين"</p>
          </div>

          {/* Supplier Finance Summary */}
          {selectedSupplier && (
            <motion.div 
              key={selectedSupplier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">ملخص المورد: {selectedSupplier.name}</h3>
                <Wallet className="w-5 h-5 text-secondary" />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-on-surface-variant">إجمالي المشتريات المستحقة</span>
                <span className="text-3xl font-bold text-primary flex items-baseline gap-1" dir="ltr">
                  <span className="text-xs font-semibold text-on-surface-variant">د.م.</span>
                  {selectedSupplier.totalEarned.toLocaleString()}
                </span>
              </div>

              {selectedSupplier.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>الجوال:</span>
                  <span className="font-mono text-slate-800">{selectedSupplier.phone}</span>
                </div>
              )}

              <div className={`flex items-center gap-1 text-xs font-semibold w-fit px-3 py-1 rounded-full ${
                selectedSupplier.monthlyGrowth >= 0 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-600'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {selectedSupplier.monthlyGrowth >= 0 ? '+' : ''}
                  {selectedSupplier.monthlyGrowth}% عن الشهر الماضي
                </span>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right column: Form & invoice lists (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* New Supplier Invoice Form */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary mb-4 border-b border-surface-container pb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <span>إدخال فاتورة مشتريات جديدة لـ {selectedSupplier?.name}</span>
            </h2>

            <form onSubmit={handleAddBill} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">رقم الفاتورة الواردة</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-on-surface-variant">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    value={billId}
                    onChange={(e) => setBillId(e.target.value)}
                    className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-4 py-2.5 pl-10 text-sm text-on-surface placeholder:text-outline-variant transition-colors rounded-t-lg font-mono font-bold"
                    placeholder="INV-2023-001"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">تاريخ الفاتورة</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-on-surface-variant">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input 
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-4 py-2.5 pl-10 text-sm text-on-surface transition-colors rounded-t-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant">بيان المنتجات أو باركود الأصناف المستلمة</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-on-surface-variant">
                    <Barcode className="w-4.5 h-4.5" />
                  </span>
                  <input 
                    type="text"
                    value={productSummary}
                    onChange={(e) => setProductSummary(e.target.value)}
                    className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-4 py-2.5 pl-10 text-sm text-on-surface placeholder:text-outline-variant transition-colors rounded-t-lg"
                    placeholder="امسح الباركود أو أدخل تفاصيل الصنف يدوياً..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">الكمية المستلمة</label>
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-4 py-2.5 text-sm text-on-surface transition-colors rounded-t-lg font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">إجمالي قيمة الفاتورة (شامل الضريبة)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-on-surface-variant">د.م.</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-4 py-2.5 pl-12 text-sm text-on-surface font-bold transition-colors rounded-t-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formError && (
                <div className="md:col-span-2 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="md:col-span-2 p-3 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {formSuccess}
                </div>
              )}

              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>حفظ فاتورة المورد</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Invoices for Selected Supplier */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <span>سجل فواتير المشتريات الأخيرة</span>
              </h2>
              
              <div className="flex bg-surface-container-low p-1 rounded-xl">
                {(['today', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      filterPeriod === p 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {p === 'today' ? 'اليوم' : p === 'week' ? 'الأسبوع' : 'الشهر'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-wider">
                    <th className="pb-3 pr-2">رقم الفاتورة</th>
                    <th className="pb-3">التاريخ</th>
                    <th className="pb-3">البيان / المنتجات</th>
                    <th className="pb-3 text-left">المبلغ (د.م.)</th>
                    <th className="pb-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {selectedSupplier?.invoices?.length > 0 ? (
                    selectedSupplier.invoices.map((inv) => (
                      <tr key={inv.id} className="group hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 pr-2">
                          <span className="text-xs font-mono font-bold text-primary">{inv.id}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-xs text-on-surface font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-outline-variant" />
                            {inv.date}
                          </div>
                        </td>
                        <td className="py-4 max-w-[200px]">
                          <span className="text-xs text-on-surface-variant font-medium truncate block">{inv.productsSummary}</span>
                        </td>
                        <td className="py-4 text-left">
                          <span className="text-sm font-bold text-primary" dir="ltr">{inv.amount.toLocaleString()}</span>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${
                            inv.status === 'مكتملة' 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {inv.status === 'مكتملة' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-40">
                          <Search className="w-8 h-8" />
                          <span className="text-xs font-bold">لا توجد فواتير مسجلة لهذه الفترة</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
