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
  Save, 
  Check,
  Search,
  CheckCircle,
  Clock,
  Briefcase,
  Plus,
  X,
  Phone,
  UserPlus
} from 'lucide-react';
import { Supplier, SupplierInvoice } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onAddSupplierInvoice: (supplierId: string, invoice: SupplierInvoice) => void;
  onAddSupplier: (newSup: { name: string; type: 'مورد' | 'موزع'; phone?: string }) => void;
}

export default function SuppliersView({ suppliers, onAddSupplierInvoice, onAddSupplier }: SuppliersViewProps) {
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

  // States for adding a new supplier/distributor
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupType, setNewSupType] = useState<'مورد' | 'موزع'>('مورد');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [addSupplierError, setAddSupplierError] = useState('');
  const [addSupplierSuccess, setAddSupplierSuccess] = useState('');

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

  const handleCreateSupplier = (e: FormEvent) => {
    e.preventDefault();
    setAddSupplierError('');
    setAddSupplierSuccess('');

    if (!newSupName.trim()) {
      setAddSupplierError('يرجى إدخال اسم المورد أو الموزع');
      return;
    }

    onAddSupplier({
      name: newSupName,
      type: newSupType,
      phone: newSupPhone || undefined
    });

    setAddSupplierSuccess('تمت إضافة الجهة بنجاح!');
    setNewSupName('');
    setNewSupPhone('');
    
    setTimeout(() => {
      setShowAddSupplierModal(false);
      setAddSupplierSuccess('');
    }, 1500);
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
              <button
                onClick={() => {
                  setAddSupplierError('');
                  setAddSupplierSuccess('');
                  setShowAddSupplierModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة جديد</span>
              </button>
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
                  <span className="text-xs font-semibold text-on-surface-variant">ر.س</span>
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
                  className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-4 py-2.5 text-sm text-on-surface font-mono rounded-t-lg"
                  min="1"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">المبلغ الإجمالي (شامل الضريبة)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-on-surface-variant font-bold">ر.س</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-4 py-2.5 pl-10 text-sm text-on-surface font-mono rounded-t-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Status messages */}
              {formError && (
                <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-200 md:col-span-2">{formError}</p>
              )}
              {formSuccess && (
                <p className="text-xs text-green-700 font-bold bg-green-50 p-3 rounded-lg border border-green-200 md:col-span-2">{formSuccess}</p>
              )}

              <div className="md:col-span-2 flex justify-end mt-2">
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-sm flex items-center gap-2 transition-colors duration-150"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وإضافة الفاتورة</span>
                </button>
              </div>

            </form>
          </div>

          {/* Supplier Ledgers Reports Area */}
          {selectedSupplier && (
            <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-base font-bold text-primary">فواتير ومعاملات المورد: {selectedSupplier.name}</h3>
                
                {/* Period filters */}
                <div className="flex bg-surface-container p-1 rounded-xl">
                  <button 
                    onClick={() => setFilterPeriod('month')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterPeriod === 'month' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    هذا الشهر
                  </button>
                  <button 
                    onClick={() => setFilterPeriod('week')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterPeriod === 'week' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    هذا الأسبوع
                  </button>
                  <button 
                    onClick={() => setFilterPeriod('today')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterPeriod === 'today' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    اليوم
                  </button>
                </div>
              </div>

              {/* List table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold border-b border-outline-variant">
                      <th className="p-3">رقم الفاتورة</th>
                      <th className="p-3">تاريخ الاستلام</th>
                      <th className="p-3">المنتجات والبيان</th>
                      <th className="p-3">المبلغ الإجمالي</th>
                      <th className="p-3">حالة الفاتورة</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-on-surface divide-y divide-surface-container-highest">
                    {selectedSupplier.invoices.map((inv) => (
                      <tr 
                        key={inv.id}
                        className="border-b border-outline-variant hover:bg-surface-container-low transition-colors duration-100"
                      >
                        <td className="p-3 font-mono font-bold text-primary">{inv.id}</td>
                        <td className="p-3 font-mono text-xs text-on-surface-variant">{inv.date}</td>
                        <td className="p-3 font-semibold text-on-surface-variant">{inv.productsSummary}</td>
                        <td className="p-3 font-mono font-bold">{inv.amount.toLocaleString()} ر.س</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            inv.status === 'مكتملة' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.status === 'مكتملة' ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>مكتملة</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>قيد المعالجة</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 6. Add Supplier/Distributor Modal */}
      <AnimatePresence>
        {showAddSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddSupplierModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant z-10 text-right font-sans"
            >
              {/* Header */}
              <div className="bg-primary text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">إضافة مورد أو موزع جديد</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">أدخل تفاصيل جهة التوريد أو التوزيع لبدء المعاملات</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
                
                {/* Alert message */}
                {addSupplierError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    <span>{addSupplierError}</span>
                  </div>
                )}
                {addSupplierSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2 animate-pulse">
                    <Check className="w-4 h-4" />
                    <span>{addSupplierSuccess}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">اسم المورد أو الموزع *</label>
                  <input 
                    type="text"
                    required
                    placeholder="مثال: شركة الجزيرة للأجهزة الكهربائية"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50"
                  />
                </div>

                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">نوع جهة التعامل</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewSupType('مورد')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        newSupType === 'مورد'
                          ? 'bg-blue-50/70 border-blue-500 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${newSupType === 'مورد' ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                      <span>مورّد (مشتريات)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSupType('موزع')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        newSupType === 'موزع'
                          ? 'bg-amber-50/70 border-amber-500 text-amber-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${newSupType === 'موزع' ? 'bg-amber-600' : 'bg-slate-300'}`}></span>
                      <span>موزّع (مبيعات)</span>
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم الجوال / الهاتف (اختياري)</label>
                  <div className="relative">
                    <input 
                      type="tel"
                      placeholder="مثال: 0501234567"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      className="w-full text-right pl-3 pr-10 py-2 border border-outline-variant rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50"
                      dir="ltr"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ البيانات</span>
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
