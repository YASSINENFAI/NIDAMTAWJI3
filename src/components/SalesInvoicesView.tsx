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
  Hash,
  ShoppingBag
} from 'lucide-react';
import { Invoice, InvoiceItem } from '../types';

interface SalesInvoicesViewProps {
  invoices: Invoice[];
  onAddInvoice: (invoice: Invoice) => void;
}

export default function SalesInvoicesView({ invoices, onAddInvoice }: SalesInvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[1]?.id || invoices[0]?.id || '');
  const [previewFormat, setPreviewFormat] = useState<'A4' | 'thermal'>('A4');
  
  // Real-time Hardware Printer Listener states
  const [isPrinterConnected, setIsPrinterConnected] = useState(true);
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
          
          // Trigger actual physical print command
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

    // Process items to include VAT 20% (Morocco Standard)
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

    const newInvoiceId = (Math.floor(557 + Math.random() * 400)).toString();

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
      balance: grandTotal, // Unpaid by default
      status: 'مستحقة',
      items: processedItems
    };

    onAddInvoice(newInvoice);
    setSelectedInvoiceId(newInvoiceId);
    setShowAddModal(false);

    // Reset Modal States
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-colors font-semibold flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>إنشاء فاتورة جديدة</span>
        </button>
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
        
        {/* Left Side: Invoice Listing (2/3 width) */}
        <div className="xl:col-span-2 bg-white border border-outline-variant rounded-2xl overflow-hidden ambient-shadow flex flex-col print:hidden">
          
          {/* Table Toolbar */}
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

          {/* Invoices List Table */}
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
          
          <div className="p-4 border-t border-outline-variant bg-surface-container-low text-xs text-on-surface-variant text-right">
            عرض {filteredInvoices.length} من {invoices.length} فواتير مسجلة
          </div>

        </div>

        {/* Right Side: Print Preview Panel (1/3 width) */}
        <div className="xl:col-span-1 bg-white border border-outline-variant rounded-2xl overflow-hidden ambient-shadow flex flex-col xl:sticky xl:top-24 max-h-[85vh] print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:static print:w-full print:bg-white">
          
          {/* Controls Header */}
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-col gap-3.5 print:hidden">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-primary flex items-center gap-2 text-sm">
                <Printer className="w-4.5 h-4.5" />
                <span>معاينة خيارات الطباعة</span>
              </h3>
              <span className="font-mono text-xs bg-primary text-white px-2.5 py-1 rounded-lg">#{selectedInvoice?.id || '---'}</span>
            </div>

            {/* Real-time Hardware Listener Bar */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5 text-right">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">قناة طابعة الفواتير (ESC/POS)</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className={`w-2 h-2 rounded-full ${isPrinterConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  {isPrinterConnected ? 'نشط وجاهز للطباعة' : 'غير متصل'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>الاتصال: USB & Wi-Fi LAN</span>
                <span>المستمع: 127.0.0.1:9100</span>
              </div>
            </div>

            {/* Layout Toggle */}
            <div className="flex bg-surface-container p-1 rounded-xl">
              <button 
                onClick={() => setPreviewFormat('A4')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  previewFormat === 'A4' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                A4 (رسمي)
              </button>
              <button 
                onClick={() => setPreviewFormat('thermal')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  previewFormat === 'thermal' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                حراري (80mm)
              </button>
            </div>

            <button 
              onClick={handlePrint}
              className="w-full bg-secondary hover:bg-secondary/90 text-white py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>إرسال أمر الطباعة المباشر</span>
            </button>
          </div>

          {/* Actual Invoice Content Container */}
          <div className="flex-1 overflow-y-auto bg-surface-container p-4 flex justify-center custom-scrollbar relative print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full">
            
            {/* Live Data Transfer/Printing Overlay */}
            <AnimatePresence>
              {isPrinting && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary/95 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-6 text-center text-white"
                >
                  <div className="w-10 h-10 border-4 border-white/20 border-t-teal-400 rounded-full animate-spin mb-4" />
                  <span className="font-bold text-xs block mb-1">{printStatusText}</span>
                  <span className="text-[10px] text-teal-300">يتم بث حزم البيانات للطابعة الحرارية...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedInvoice ? (
              previewFormat === 'A4' ? (
                /* OFFICIAL A4 FORMAT */
                <div className="bg-white shadow-xl w-full max-w-[210mm] p-6 text-[10px] text-on-surface relative border border-gray-100 rounded-xl space-y-4 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:text-black print:text-xs">
                  
                  {/* Company Logo and Header info */}
                  <div className="flex justify-between items-start border-b border-outline-variant pb-4">
                    <div className="text-right space-y-1">
                      <h2 className="text-sm font-bold text-primary">نظام السحاب المتكامل</h2>
                      <p className="text-[9px] text-on-surface-variant">الدار البيضاء، المغرب</p>
                      <p className="text-[9px] text-on-surface-variant">الرقم الضريبي: 300123456700003</p>
                      <p className="text-[9px] text-on-surface-variant">هاتف: +212 5 22 34 56 78</p>
                    </div>
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-on-surface-variant border border-dashed border-outline-variant">
                      <Hash className="w-6 h-6 text-primary-fixed-dim" />
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div className="flex justify-between text-[9px] gap-4">
                    <div className="space-y-1">
                      <h1 className="text-xs font-bold text-primary mb-2">فاتورة ضريبية</h1>
                      <div className="flex justify-between gap-2">
                        <span className="text-on-surface-variant">رقم الفاتورة:</span>
                        <span className="font-mono font-bold">INV-2023-{selectedInvoice.id}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-on-surface-variant">تاريخ الإصدار:</span>
                        <span>{selectedInvoice.date}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-on-surface-variant">تاريخ الاستحقاق:</span>
                        <span>{selectedInvoice.dueDate}</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant w-44 space-y-1">
                      <h3 className="font-bold text-on-surface-variant border-b border-outline-variant pb-1">فوتر إلى:</h3>
                      <p className="font-bold">{selectedInvoice.customerName}</p>
                      <p className="text-[8px] text-on-surface-variant">الرقم الضريبي: {selectedInvoice.customerVat || '300000000000003'}</p>
                    </div>
                  </div>

                  {/* Invoice items table */}
                  <table className="w-full text-right text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-y border-outline-variant text-[8px] font-bold">
                        <th className="py-2 px-1 text-right">الوصف</th>
                        <th className="py-2 px-1 text-center w-10">الكمية</th>
                        <th className="py-2 px-1 text-left w-16">السعر</th>
                        <th className="py-2 px-1 text-left w-16">الضريبة (20%)</th>
                        <th className="py-2 px-1 text-left w-20">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-1 font-medium">{item.description}</td>
                          <td className="py-2 px-1 text-center font-mono">{item.quantity}</td>
                          <td className="py-2 px-1 text-left font-mono">{item.price.toFixed(2)}</td>
                          <td className="py-2 px-1 text-left font-mono text-on-surface-variant">{item.tax.toFixed(2)}</td>
                          <td className="py-2 px-1 text-left font-mono font-bold">{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals computation */}
                  <div className="flex justify-end pt-2">
                    <table className="w-44 text-right text-[9px] space-y-1">
                      <tbody>
                        <tr>
                          <td className="py-1 text-on-surface-variant">المجموع الفرعي:</td>
                          <td className="py-1 text-left font-mono">{(selectedInvoice.total - selectedInvoice.items.reduce((a, b) => a + b.tax, 0)).toFixed(2)} د.م.</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-on-surface-variant border-b border-outline-variant pb-1">ضريبة القيمة المضافة:</td>
                          <td className="py-1 text-left font-mono border-b border-outline-variant pb-1">{selectedInvoice.items.reduce((a, b) => a + b.tax, 0).toFixed(2)} د.م.</td>
                        </tr>
                        <tr className="font-bold text-primary">
                          <td className="py-2">الإجمالي المستحق:</td>
                          <td className="py-2 text-left font-mono text-sm">{selectedInvoice.total.toLocaleString()} د.م.</td>
                        </tr>
                        {selectedInvoice.balance > 0 && (
                          <tr className="text-red-600 font-bold">
                            <td className="py-1">المبلغ المتبقي:</td>
                            <td className="py-1 text-left font-mono bg-red-50 px-1 rounded">{selectedInvoice.balance.toLocaleString()} د.م.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bill Footer Note */}
                  <div className="border-t border-outline-variant pt-3 text-center text-[8px] text-on-surface-variant leading-relaxed">
                    <p>نشكر لكم اختياركم "نظام السحاب المتكامل". يرجى تسديد الديون لحساب الآيبان الضريبي المعتمد:</p>
                    <p className="font-mono font-bold text-primary mt-1">SA00100000001234567890</p>
                  </div>

                </div>
              ) : (
                /* THERMAL 80MM RECEIPT FORMAT */
                <div className="bg-white shadow-xl w-[180px] p-4 text-[8px] text-on-surface font-mono border border-gray-100 rounded-xl flex flex-col items-center space-y-2 print:shadow-none print:border-none print:p-0 print:m-0 print:w-[80mm] print:text-black print:text-[10px]">
                  <div className="text-center w-full space-y-0.5">
                    <h2 className="text-[10px] font-bold">نظام السحاب المتكامل</h2>
                    <p className="text-[7px]">الرقم الضريبي: 300123456700003</p>
                    <p className="text-[7px]">هاتف: +212522345678</p>
                  </div>
                  
                  <div className="border-b border-dashed border-on-surface w-full"></div>
                  
                  <div className="w-full text-[7px] space-y-0.5">
                    <div className="flex justify-between"><span>رقم الفاتورة:</span><span>#INV-{selectedInvoice.id}</span></div>
                    <div className="flex justify-between"><span>التاريخ:</span><span>{selectedInvoice.date} 14:30</span></div>
                    <div className="flex justify-between"><span>العميل:</span><span>{selectedInvoice.customerName}</span></div>
                  </div>
                  
                  <div className="border-b border-dashed border-on-surface w-full"></div>
                  
                  {/* Item rows */}
                  <table className="w-full text-right text-[7px] border-collapse">
                    <thead>
                      <tr className="border-b border-on-surface font-bold">
                        <th className="py-1 text-right">الصنف</th>
                        <th className="py-1 text-center">الكمية</th>
                        <th className="py-1 text-left">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1 text-right break-words max-w-[80px]">{item.description}</td>
                          <td className="py-1 text-center">{item.quantity}</td>
                          <td className="py-1 text-left">{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-b border-dashed border-on-surface w-full"></div>

                  <div className="w-full space-y-0.5 text-right">
                    <div className="flex justify-between"><span>الإجمالي شامل الضريبة:</span><span className="font-bold">{selectedInvoice.total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[6px]"><span>ضريبة القيمة المضافة (20%):</span><span>{selectedInvoice.items.reduce((a, b) => a + b.tax, 0).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-red-600"><span>المبلغ المستحق:</span><span>{selectedInvoice.balance.toFixed(2)}</span></div>
                  </div>

                  <div className="border-b border-dashed border-on-surface w-full"></div>
                  
                  <div className="text-center space-y-2 w-full pt-1">
                    <p className="text-[6px]">نشكركم لتعاملكم معنا</p>
                    <div className="w-12 h-12 bg-gray-100 border border-gray-200 mx-auto flex items-center justify-center rounded-lg text-[6px]">
                      رمز QR الضريبي
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center text-xs text-on-surface-variant p-6">
                يرجى تحديد فاتورة من القائمة للمعاينة
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Dynamic Invoice Creation Dialog Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ambient-shadow border border-outline-variant p-6 flex flex-col gap-6"
            >
              {/* Modal Title */}
              <div className="flex justify-between items-center border-b border-surface-container pb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>توليد فاتورة ضريبية جديدة</span>
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-on-surface-variant hover:bg-surface-container p-1.5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">اسم العميل أو المؤسسة المستفيدة</label>
                    <input 
                      type="text"
                      value={newClient}
                      onChange={(e) => setNewClient(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary outline-none"
                      placeholder="مثل: شركة الرواد للتجارة والمقاولات"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">الرقم الضريبي للعميل (اختياري)</label>
                    <input 
                      type="text"
                      value={newClientVat}
                      onChange={(e) => setNewClientVat(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary outline-none font-mono"
                      placeholder="300XXXXXXXXXXXX"
                    />
                  </div>
                </div>

                {/* Dynamic Item list generator */}
                <div className="border-t border-surface-container pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-primary">بنود وخدمات الفاتورة</h4>
                    <button 
                      type="button"
                      onClick={handleAddFormItem}
                      className="text-xs font-bold text-primary hover:bg-primary-fixed-dim/20 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 border border-outline-variant"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة بند صنف</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newInvoiceItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-end bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-on-surface-variant mb-1">وصف الصنف / الخدمة</label>
                          <input 
                            type="text"
                            value={item.description}
                            onChange={(e) => handleFormItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-white border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface focus:border-primary outline-none"
                            placeholder="مثل: ترخيص نظام سنوي أو صيانة خوادم"
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-[10px] font-bold text-on-surface-variant mb-1">الكمية</label>
                          <input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleFormItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-white border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface focus:border-primary outline-none font-mono"
                            min="1"
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-[10px] font-bold text-on-surface-variant mb-1">السعر (د.م)</label>
                          <input 
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => handleFormItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface focus:border-primary outline-none font-mono"
                            placeholder="0.00"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveFormItem(idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {modalError && (
                  <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-200">{modalError}</p>
                )}

                {/* Actions Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-surface-container mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="border border-outline-variant px-5 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    تأكيد وحفظ الفاتورة
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
