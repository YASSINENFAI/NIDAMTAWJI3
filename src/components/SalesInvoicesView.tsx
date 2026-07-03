import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Printer, 
  FileText, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  X,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { Invoice, InvoiceItem } from '../types';
import { exportToExcel } from '../lib/export';

interface SalesInvoicesViewProps {
  invoices: Invoice[];
  onAddInvoice: (invoice: Invoice) => void;
}

export default function SalesInvoicesView({ invoices, onAddInvoice }: SalesInvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[1]?.id || invoices[0]?.id || '');
  const [previewFormat, setPreviewFormat] = useState<'A4' | 'thermal'>('A4');
  
  // Real-time Hardware Printer Listener states
  const [isPrinterConnected] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatusText, setPrintStatusText] = useState('جاهز');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newClientVat, setNewClientVat] = useState('');
  const [newInvoiceItems, setNewInvoiceItems] = useState<Omit<InvoiceItem, 'tax' | 'total'>[]>([
    { description: '', quantity: 1, price: 0 }
  ]);
  const [modalError, setModalError] = useState('');

  // Find currently selected invoice
  const selectedInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];
  }, [invoices, selectedInvoiceId]);

  // Derived stats
  const totalSalesThisMonth = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + inv.total, 0);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'مستحقة')
      .reduce((acc, inv) => acc + inv.balance, 0);
  }, [invoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.id.includes(searchTerm) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const handleExportExcel = () => {
    const data = filteredInvoices.map(inv => ({
      'رقم الفاتورة': inv.id,
      'العميل': inv.customerName,
      'التاريخ': inv.date,
      'الإجمالي (د.م.)': inv.total,
      'المتبقي (د.م.)': inv.balance,
      'الحالة': inv.status
    }));
    exportToExcel(data, `Invoices_Export_${new Date().toISOString().split('T')[0]}`, 'Invoices');
  };

  // Handles simulated printing and native hardware print trigger
  const handlePrint = () => {
    if (!selectedInvoice) return;
    if (!isPrinterConnected) {
      alert('خطأ في الاتصال: طابعة الفواتير غير متصلة بالنظام حالياً.');
      return;
    }

    setIsPrinting(true);
    setPrintStatusText('جاري الاتصال بقناة الطباعة الحرارية...');
    
    setTimeout(() => {
      setPrintStatusText('جاري نقل البيانات الضريبية المشفرة لرمز الاستجابة السريع QR...');
      
      setTimeout(() => {
        setPrintStatusText('جاري تلقيم الورق والطباعة الآن...');
        
        setTimeout(() => {
          setIsPrinting(false);
          setPrintStatusText('جاهز');
          
          try {
            window.print();
          } catch (e) {
            console.warn('Native printer output blocked inside sandbox iframe.', e);
          }
        }, 1200);
      }, 1000);
    }, 800);
  };

  // Add Item row in creation form
  const handleAddFormItem = () => {
    setNewInvoiceItems(prev => [...prev, { description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveFormItem = (index: number) => {
    if (newInvoiceItems.length === 1) return;
    setNewInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormItemChange = (index: number, field: string, value: any) => {
    setNewInvoiceItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCreateInvoice = (e: FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newClient.trim()) {
      setModalError('يرجى إدخال اسم العميل');
      return;
    }

    const validItems = newInvoiceItems.filter(item => item.description.trim() !== '' && item.price > 0);
    if (validItems.length === 0) {
      setModalError('يرجى إضافة بند واحد صالح على الأقل ذو سعر أكبر من صفر');
      return;
    }

    const processedItems: InvoiceItem[] = validItems.map(item => {
      const subtotal = item.price * item.quantity;
      const tax = parseFloat((subtotal * 0.20).toFixed(2));
      const total = parseFloat((subtotal + tax).toFixed(2));
      return {
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        tax,
        total
      };
    });

    const subtotalSum = processedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxSum = processedItems.reduce((acc, item) => acc + item.tax, 0);
    const grandTotal = parseFloat((subtotalSum + taxSum).toFixed(2));

    const newInvoiceId = 'INV-' + Math.floor(100000 + Math.random() * 900000);

    const today = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueDateStr = due.toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: newInvoiceId,
      customerName: newClient,
      customerVat: newClientVat || '300000000000003',
      date: today,
      dueDate: dueDateStr,
      total: grandTotal,
      balance: grandTotal, 
      status: 'مستحقة',
      items: processedItems
    };

    onAddInvoice(newInvoice);
    setSelectedInvoiceId(newInvoiceId);
    setShowAddModal(false);

    setNewClient('');
    setNewClientVat('');
    setNewInvoiceItems([{ description: '', quantity: 1, price: 0 }]);
  };

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-primary">سجل الفواتير</h1>
          <p className="text-secondary text-sm mt-1">إدارة وتتبع وحالة جميع فواتير مبيعات الشركة والامتثال الضريبي المتكامل.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200"
          >
            <span className="text-xs font-semibold">تصدير Excel</span>
            <FileSpreadsheet className="w-4 h-4 text-[#1d6f42]" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-colors font-semibold flex items-center gap-2 shadow-sm justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>إنشاء فاتورة</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center gap-4 ambient-shadow">
          <div className="bg-secondary-container text-on-secondary-container w-12 h-12 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-xs font-semibold text-on-surface-variant">إجمالي المبيعات (الشهر)</div>
            <div className="text-xl font-bold text-primary mt-1">{totalSalesThisMonth.toLocaleString()} د.م.</div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center gap-4 ambient-shadow">
          <div className="bg-red-50 text-red-700 w-12 h-12 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-on-surface-variant">فواتير مستحقة متأخرة</div>
            <div className="text-xl font-bold text-red-600 mt-1">{totalOutstanding.toLocaleString()} د.م.</div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center gap-4 ambient-shadow">
          <div className="bg-amber-50 text-amber-800 w-12 h-12 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xs font-semibold text-on-surface-variant">عدد الفواتير الصادرة</div>
            <div className="text-xl font-bold text-primary mt-1">{invoices.length} فاتورة</div>
          </div>
        </div>
      </div>

      {/* Main Table + Preview Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start print:block print:w-full">
        <div className="xl:col-span-2 bg-white border border-outline-variant rounded-2xl overflow-hidden ambient-shadow flex flex-col print:hidden">
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between gap-4 bg-surface-container-low">
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 absolute right-3.5 top-2.5 text-on-surface-variant" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-outline-variant rounded-xl pr-10 pl-4 py-2 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="بحث برقم الفاتورة أو اسم العميل..."
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-xs font-bold border-b border-outline-variant">
                  <th className="py-3.5 px-6">رقم الفاتورة</th>
                  <th className="py-3.5 px-6">العميل والمستفيد</th>
                  <th className="py-3.5 px-6">التاريخ والاصدار</th>
                  <th className="py-3.5 px-6">قيمة الفاتورة</th>
                  <th className="py-3.5 px-6">المتبقي للتسديد</th>
                  <th className="py-3.5 px-6">حالة الدفع</th>
                  <th className="py-3.5 px-6 text-center w-24">معاينة</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface divide-y divide-surface-container-highest">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr 
                      key={inv.id}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className={`border-b border-outline-variant hover:bg-surface-container-low transition-all duration-150 cursor-pointer group ${
                        selectedInvoiceId === inv.id ? 'bg-primary-fixed-dim/20 font-medium' : ''
                      }`}
                    >
                      <td className="py-4 px-6 font-mono font-bold text-primary">#{inv.id}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold">{inv.customerName}</div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{inv.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono">{inv.total.toLocaleString()} د.م.</td>
                      <td className="py-4 px-6 font-mono text-xs">
                        {inv.balance > 0 ? (
                          <span className="text-red-600 font-bold">{inv.balance.toLocaleString()} د.م.</span>
                        ) : (
                          <span className="text-on-surface-variant">0.00 د.م.</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          inv.status === 'مدفوعة' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {inv.status === 'مدفوعة' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>مدفوعة</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>مستحقة</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceId(inv.id);
                          }}
                          className="text-primary hover:bg-primary-fixed/30 p-2 rounded-full transition-all"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant font-medium">
                      لا توجد فواتير مطابقة لبحثك
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Print Preview Panel */}
        <div className="xl:col-span-1 bg-white border border-outline-variant rounded-2xl overflow-hidden ambient-shadow flex flex-col xl:sticky xl:top-24 max-h-[85vh] print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:static">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center print:hidden">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span>معاينة الطباعة</span>
            </h3>
            <div className="flex bg-white border border-outline-variant p-1 rounded-lg">
              <button onClick={() => setPreviewFormat('A4')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewFormat === 'A4' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}>A4</button>
              <button onClick={() => setPreviewFormat('thermal')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewFormat === 'thermal' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}>حراري</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar print:bg-white print:p-0 print:overflow-visible">
            {selectedInvoice ? (
              <div className={`mx-auto bg-white shadow-xl print:shadow-none transition-all duration-300 ${previewFormat === 'A4' ? 'w-full aspect-[1/1.41] p-8' : 'w-72 p-4 text-[10px]'}`}>
                <div className="flex justify-between items-start mb-8">
                  <div className="text-right">
                    <h2 className="text-xl font-black text-primary">فاتورة ضريبية</h2>
                    <div className="text-xs font-mono text-on-surface-variant mt-1">#{selectedInvoice.id}</div>
                  </div>
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl">S</div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 text-right">
                  <div>
                    <div className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">العميل</div>
                    <div className="text-sm font-bold">{selectedInvoice.customerName}</div>
                    <div className="text-[10px] text-on-surface-variant mt-1">الرقم الضريبي: {selectedInvoice.customerVat}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">التاريخ</div>
                    <div className="text-sm font-bold">{selectedInvoice.date}</div>
                    <div className="text-[10px] text-on-surface-variant mt-1">تاريخ الاستحقاق: {selectedInvoice.dueDate}</div>
                  </div>
                </div>

                <table className="w-full text-right mb-8">
                  <thead>
                    <tr className="border-b-2 border-primary text-[10px] font-black text-primary uppercase tracking-wider">
                      <th className="pb-2">الوصف</th>
                      <th className="pb-2 text-center">الكمية</th>
                      <th className="pb-2 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="text-xs">
                        <td className="py-3 font-medium">{item.description}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-left font-bold">{item.total.toLocaleString()} د.م.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-48 space-y-2">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>المجموع الفرعي:</span>
                      <span>{(selectedInvoice.total / 1.2).toLocaleString(undefined, {maximumFractionDigits: 2})} د.م.</span>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>الضريبة (20%):</span>
                      <span>{(selectedInvoice.total - (selectedInvoice.total / 1.2)).toLocaleString(undefined, {maximumFractionDigits: 2})} د.م.</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-primary pt-2 border-t border-slate-200">
                      <span>الإجمالي النهائي:</span>
                      <span>{selectedInvoice.total.toLocaleString()} د.م.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant space-y-4 py-20">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">يرجى اختيار فاتورة للمعاينة</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-outline-variant space-y-3 print:hidden">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPrinterConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-bold text-on-surface-variant">حالة الطابعة: {printStatusText}</span>
              </div>
              <span className="text-on-surface-variant font-mono">USB / IP: 192.168.1.44</span>
            </div>
            
            <button 
              onClick={handlePrint}
              disabled={!selectedInvoice || isPrinting}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                isPrinting 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary/95 shadow-primary/20'
              }`}
            >
              {isPrinting ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isPrinting ? 'جاري الطباعة...' : 'تأكيد وطباعة الفاتورة'}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-primary p-6 text-white text-right relative flex-shrink-0">
                <button onClick={() => setShowAddModal(false)} className="absolute left-6 top-6 text-white/70 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                <h3 className="text-xl font-black">إنشاء فاتورة مبيعات جديدة 🧾</h3>
                <p className="text-white/70 text-xs mt-1">أدخل بيانات العميل وبنود الفاتورة ليتم احتساب الضرائب تلقائياً.</p>
              </div>
              
              <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto p-6 space-y-6 text-right custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">اسم العميل *</label>
                    <input type="text" value={newClient} onChange={e => setNewClient(e.target.value)} required placeholder="مثال: شركة التوريدات العامة" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">الرقم الضريبي (اختياري)</label>
                    <input type="text" value={newClientVat} onChange={e => setNewClientVat(e.target.value)} placeholder="000000000000003" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-primary">بنود الفاتورة</h4>
                    <button type="button" onClick={handleAddFormItem} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> إضافة بند</button>
                  </div>
                  
                  <div className="space-y-3">
                    {newInvoiceItems.map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-3 items-end">
                        <div className="flex-1 space-y-1.5 w-full">
                          <label className="text-[9px] font-bold text-slate-400">الوصف</label>
                          <input type="text" value={item.description} onChange={e => handleFormItemChange(idx, 'description', e.target.value)} placeholder="اسم المنتج أو الخدمة" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary" />
                        </div>
                        <div className="w-full md:w-24 space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400">الكمية</label>
                          <input type="number" value={item.quantity} onChange={e => handleFormItemChange(idx, 'quantity', parseInt(e.target.value) || 0)} min="1" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary" />
                        </div>
                        <div className="w-full md:w-32 space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400">السعر (قبل الضريبة)</label>
                          <input type="number" value={item.price} onChange={e => handleFormItemChange(idx, 'price', parseFloat(e.target.value) || 0)} step="0.01" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary" />
                        </div>
                        {newInvoiceItems.length > 1 && (
                          <button type="button" onClick={() => handleRemoveFormItem(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {modalError && <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl border border-rose-100">{modalError}</div>}
              </form>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">إلغاء</button>
                <button onClick={handleCreateInvoice} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all">حفظ وإصدار الفاتورة</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
