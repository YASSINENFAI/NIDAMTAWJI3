import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Boxes, 
  ShoppingBag, 
  CheckCircle, 
  LogOut, 
  History, 
  Plus, 
  Truck, 
  X,
  CreditCard,
  DollarSign,
  Search,
  AlertCircle,
  Smartphone,
  Check,
  PlusCircle,
  FileText,
  User,
  ListPlus,
  Send,
  Trash2
} from 'lucide-react';
import { Product, Supplier, Invoice, InvoiceItem } from '../types';

interface DistributorPortalViewProps {
  distributor: Supplier;
  products: Product[];
  invoices: Invoice[];
  onAddInvoice: (newInvoice: Invoice) => void;
  onUpdateProductStock: (productId: string, quantityChange: number) => void;
  onLogout: () => void;
}

export default function DistributorPortalView({
  distributor,
  products,
  invoices,
  onAddInvoice,
  onUpdateProductStock,
  onLogout
}: DistributorPortalViewProps) {
  // Mobile UI emulator toggle
  const [isMobileEmulator, setIsMobileEmulator] = useState(true);
  
  // Tab within distributor view: 'sales_saisie' (entering invoices), 'history' (their records), 'inventory' (central warehouse check)
  const [activeSubTab, setActiveSubTab] = useState<'sales_saisie' | 'history' | 'inventory'>('sales_saisie');

  // Fast Saisie States (for entering 10-20 daily invoices)
  const [saisieCustomerName, setSaisieCustomerName] = useState('');
  const [saisieProductId, setSaisieProductId] = useState('');
  const [saisieQty, setSaisieQty] = useState<number>(0);
  
  // Pending batch of invoices to be sent
  const [dailyBatchInvoices, setDailyBatchInvoices] = useState<Omit<Invoice, 'id' | 'balance'>[]>([]);
  const [saisieError, setSaisieError] = useState('');
  const [saisieSuccess, setSaisieSuccess] = useState('');

  // Classic order modal (alternative)
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get invoices belonging to this distributor
  const distributorInvoices = useMemo(() => {
    return invoices.filter(inv => inv.customerName === distributor.name);
  }, [invoices, distributor.name]);

  // Calculate finances
  const totalPurchased = useMemo(() => {
    return distributorInvoices.reduce((acc, curr) => acc + curr.total, 0);
  }, [distributorInvoices]);

  const totalOutstanding = useMemo(() => {
    return distributorInvoices.reduce((acc, curr) => acc + (curr.status === 'مستحقة' ? curr.balance : 0), 0);
  }, [distributorInvoices]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  // Add individual invoice to temporary daily batch (offline/street mode)
  const handleAddToBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setSaisieError('');
    setSaisieSuccess('');

    if (!saisieCustomerName.trim()) {
      setSaisieError('يرجى تحديد اسم العميل / المحل التجاري الفردي.');
      return;
    }
    if (!saisieProductId) {
      setSaisieError('يرجى اختيار المنتج المباع.');
      return;
    }
    if (saisieQty <= 0) {
      setSaisieError('يرجى إدخال كمية بيع صحيحة (أكبر من 0).');
      return;
    }

    const product = products.find(p => p.id === saisieProductId);
    if (!product) {
      setSaisieError('المنتج المختار غير متوفر.');
      return;
    }

    if (saisieQty > product.stock) {
      setSaisieError(`الكمية المطلوبة (${saisieQty}) تتجاوز المخزون المتاح حالياً بالشركة (${product.stock}).`);
      return;
    }

    // Build the pending invoice item
    const subtotal = saisieQty * product.sellPrice;
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const pendingInvoice: Omit<Invoice, 'id' | 'balance'> = {
      customerName: distributor.name, // The distributor is the account owner
      customerVat: '300998877100003',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days credit
      total: total,
      status: 'مستحقة',
      items: [
        {
          description: `${product.name} (مبيعات التجزئة للعميل: ${saisieCustomerName})`,
          quantity: saisieQty,
          price: product.sellPrice,
          tax: 15,
          total: total
        }
      ]
    };

    setDailyBatchInvoices(prev => [...prev, pendingInvoice]);
    
    // Clear item fields for fast sequential inputs
    setSaisieProductId('');
    setSaisieQty(0);
    setSaisieCustomerName(''); // clear or keep depending on user pattern
    setSaisieSuccess('تمت إضافة الفاتورة للدفعة اليومية بنجاح! يمكنك تفريغ المزيد.');
    
    setTimeout(() => {
      setSaisieSuccess('');
    }, 3000);
  };

  // Remove single invoice from batch before sync
  const handleRemoveFromBatch = (index: number) => {
    setDailyBatchInvoices(prev => prev.filter((_, i) => i !== index));
  };

  // Sync / Submit all batch invoices to the general system
  const handleSyncBatchToCentral = () => {
    if (dailyBatchInvoices.length === 0) {
      setSaisieError('سجل الدفعة فارغ، يرجى تعبئة فواتيرك أولاً.');
      return;
    }

    // Process all invoices in batch
    dailyBatchInvoices.forEach(inv => {
      const generatedId = 'INV-DIST-' + Math.floor(100000 + Math.random() * 900000);
      
      const completeInvoice: Invoice = {
        ...inv,
        id: generatedId,
        balance: inv.total
      };

      // Find the main product ID in items description to update stock
      const productItem = products.find(p => inv.items[0].description.includes(p.name));
      if (productItem) {
        onUpdateProductStock(productItem.id, -inv.items[0].quantity);
      }

      onAddInvoice(completeInvoice);
    });

    setDailyBatchInvoices([]);
    setSaisieSuccess(`تمت المزامنة بنجاح! تم رفع جميع الفواتير (${dailyBatchInvoices.length}) إلى كمبيوتر المحل المركزي.`);
    
    // Switch to history to view them
    setTimeout(() => {
      setActiveSubTab('history');
      setSaisieSuccess('');
    }, 2000);
  };

  // Quick direct pull order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProductId) {
      setErrorMsg('الرجاء اختيار المنتج المراد سحبه للتوزيع.');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      setErrorMsg('المنتج المختار غير موجود.');
      return;
    }

    if (orderQty <= 0) {
      setErrorMsg('الرجاء إدخال كمية صحيحة.');
      return;
    }

    if (orderQty > product.stock) {
      setErrorMsg(`الكمية المطلوبة (${orderQty}) تتجاوز المخزون المتاح حالياً (${product.stock}).`);
      return;
    }

    // Generate Invoice
    const invoiceId = 'INV-DIST-' + Math.floor(100000 + Math.random() * 900000);
    const subtotal = orderQty * product.sellPrice;
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const newInvoice: Invoice = {
      id: invoiceId,
      customerName: distributor.name,
      customerVat: '300998877100003',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total: total,
      balance: total,
      status: 'مستحقة',
      items: [
        {
          description: `${product.name} (سحب بضائع للتوزيع بالشارع)`,
          quantity: orderQty,
          price: product.sellPrice,
          tax: 15,
          total: total
        }
      ]
    };

    onAddInvoice(newInvoice);
    onUpdateProductStock(product.id, -orderQty);

    setSuccessMsg('تم تسجيل الفاتورة وسحبها من المخزن بنجاح!');
    setSelectedProductId('');
    setOrderQty(0);

    setTimeout(() => {
      setShowOrderModal(false);
      setSuccessMsg('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Upper Controller Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-bold">بوابة الهواتف والـ APK للمناديب في الشارع 📱</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileEmulator(!isMobileEmulator)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isMobileEmulator 
                ? 'bg-teal-500 border-teal-500 text-slate-950 shadow-md' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isMobileEmulator ? 'إخفاء محاكي الهاتف 📱' : 'تفعيل محاكي الهاتف الذكي 📱'}
          </button>
          
          <button 
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/30"
          >
            <span>خروج</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* APK MOBILE SIMULATOR FRAME */}
        {isMobileEmulator && (
          <div className="lg:col-span-5 flex justify-center">
            {/* Elegant Phone Chassis */}
            <div className="relative w-[375px] h-[780px] bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-[6px] border-slate-800 ring-4 ring-slate-900 flex flex-col overflow-hidden text-right font-sans">
              
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center gap-2">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
                <div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-800" />
              </div>

              {/* StatusBar Simulation */}
              <div className="flex justify-between items-center text-[10px] text-white/80 font-mono px-5 pt-3 pb-2 z-40 bg-slate-900 border-b border-white/5">
                <span className="font-bold">100% 🔋</span>
                <span className="font-bold">09:41 AM ⏰</span>
                <span className="font-bold">5G 📶</span>
              </div>

              {/* Screen Area */}
              <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden rounded-[2.5rem] relative">
                
                {/* Embedded APK Header */}
                <div className="bg-slate-900 p-4 border-b border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-teal-400/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-full font-bold">تطبيق مندوب سحاب v1.4</span>
                    <span className="text-[9px] text-slate-400 font-mono">ID: {distributor.id}</span>
                  </div>
                  <h3 className="text-sm font-black text-white">{distributor.name} 🚚</h3>
                  <p className="text-[10px] text-slate-400">سجل فواتير الزبائن الحالية مباشرة من السيارة للربط مع المحل.</p>
                </div>

                {/* Simulated APK Mobile Navigation Tabs */}
                <div className="grid grid-cols-3 bg-slate-950 p-1.5 border-b border-white/5 text-[10.5px] font-bold text-slate-400">
                  <button 
                    onClick={() => setActiveSubTab('sales_saisie')}
                    className={`py-2 rounded-xl transition-all ${activeSubTab === 'sales_saisie' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'hover:text-white'}`}
                  >
                    تفريغ الفواتير
                  </button>
                  <button 
                    onClick={() => setActiveSubTab('history')}
                    className={`py-2 rounded-xl transition-all ${activeSubTab === 'history' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'hover:text-white'}`}
                  >
                    سجل فواتيري
                  </button>
                  <button 
                    onClick={() => setActiveSubTab('inventory')}
                    className={`py-2 rounded-xl transition-all ${activeSubTab === 'inventory' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'hover:text-white'}`}
                  >
                    مخزن السلع
                  </button>
                </div>

                {/* SubTab Content Frame */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar bg-slate-900 text-white">
                  
                  {/* TAB 1: SALES INVOICE SAISIE */}
                  {activeSubTab === 'sales_saisie' && (
                    <div className="space-y-4">
                      
                      {/* Saisie Fast Form */}
                      <form onSubmit={handleAddToBatch} className="bg-slate-950/80 p-3.5 border border-white/10 rounded-2xl space-y-3">
                        <span className="text-[10.5px] font-bold text-teal-300 block">إدخال الفاتورة الحالية (Saisie)</span>
                        
                        {saisieError && (
                          <div className="p-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg text-right">
                            {saisieError}
                          </div>
                        )}
                        {saisieSuccess && (
                          <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg text-right">
                            {saisieSuccess}
                          </div>
                        )}

                        {/* Customer select or type */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">اسم العميل (البقالة / المحل) *</label>
                          <input 
                            type="text"
                            required
                            placeholder="مثال: بقالة الأمانة، سوبرماركت النور"
                            value={saisieCustomerName}
                            onChange={(e) => setSaisieCustomerName(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500 text-right font-medium"
                          />
                        </div>

                        {/* Product selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">الصنف المباع *</label>
                          <select
                            value={saisieProductId}
                            onChange={(e) => setSaisieProductId(e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-teal-500 text-right"
                          >
                            <option value="">-- اختر من السلع بالمركبة --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.stock === 0} className="bg-slate-900">
                                {p.name} ({p.stock} متاح)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">الكمية المباعة (بالحبة) *</label>
                          <input 
                            type="number"
                            required
                            min="1"
                            value={saisieQty || ''}
                            onChange={(e) => setSaisieQty(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none text-right font-bold"
                            placeholder="0"
                          />
                        </div>

                        {/* Fast calculator breakdown */}
                        {saisieProductId && saisieQty > 0 && (
                          <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl space-y-1 text-[10px]">
                            <div className="flex justify-between text-slate-400">
                              <span>السعر الإجمالي:</span>
                              <span className="font-bold text-white">
                                {((products.find(p => p.id === saisieProductId)?.sellPrice || 0) * saisieQty * 1.15).toFixed(2)} ر.س (شامل الضريبة)
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all shadow-md mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة للدفعة المفرغة</span>
                        </button>
                      </form>

                      {/* Pending Batch of Invoices in Phone Local Memory */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10.5px] font-bold text-slate-400">دفعة الفواتير الحالية لتسليمها ({dailyBatchInvoices.length})</span>
                          {dailyBatchInvoices.length > 0 && (
                            <button 
                              onClick={handleSyncBatchToCentral}
                              className="text-[10px] font-black text-teal-400 flex items-center gap-1 hover:underline"
                            >
                              <Send className="w-3 h-3" />
                              <span>مزامنة الفواتير الآن ⚡</span>
                            </button>
                          )}
                        </div>

                        {dailyBatchInvoices.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-[10px] bg-slate-950/40 border border-white/5 rounded-2xl">
                            سجل التفريغ فارغ حالياً. قم بإضافة الفواتير التي قمت ببيعها اليوم في الشارع لتراها هنا ثم اضغط مزامنة.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dailyBatchInvoices.map((binv, idx) => (
                              <div key={idx} className="p-3 bg-slate-950 border border-white/5 rounded-xl flex justify-between items-center">
                                <div className="text-right">
                                  <span className="text-xs font-bold block text-white">{binv.items[0].description.split('(')[0]}</span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5">الزبون: {binv.items[0].description.split('العميل: ')[1]?.replace(')', '') || 'زبون نقدي'}</span>
                                  <span className="text-[9px] text-teal-400 font-bold block">الكمية: {binv.items[0].quantity} علب • القيمة: {binv.total.toLocaleString()} ر.س</span>
                                </div>
                                <button 
                                  onClick={() => handleRemoveFromBatch(idx)}
                                  className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                                  title="حذف من المسودة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 2: MY DISTRIBUTOR INVOICES HISTORY */}
                  {activeSubTab === 'history' && (
                    <div className="space-y-3">
                      <span className="text-[10.5px] font-bold text-slate-400 block px-1">كشف المسحوبات المرفوعة بنجاح</span>
                      
                      {distributorInvoices.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-[10px]">
                          لا توجد فواتير مزامنة حتى الآن في هذا الهاتف.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {distributorInvoices.map(inv => (
                            <div key={inv.id} className="p-3 bg-slate-950 border border-white/5 rounded-xl space-y-2 text-right">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-teal-300 font-mono">{inv.id}</span>
                                <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${
                                  inv.status === 'مدفوعة' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                }`}>
                                  {inv.status}
                                </span>
                              </div>
                              
                              <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                                {inv.items[0]?.description || 'توزيع بضائع ومبيعات آجلة'}
                              </p>

                              <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[9px] text-slate-400">
                                <span className="font-mono">التاريخ: {inv.date}</span>
                                <span className="font-bold text-white text-xs">{inv.total.toLocaleString()} ر.س</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: WAREHOUSE CENTRAL STOCK */}
                  {activeSubTab === 'inventory' && (
                    <div className="space-y-3">
                      <span className="text-[10.5px] font-bold text-slate-400 block px-1">المخزون المركزي الفعلي لشركة سحاب</span>
                      
                      <div className="space-y-2">
                        {products.map(p => (
                          <div key={p.id} className="p-3 bg-slate-950 border border-white/5 rounded-xl flex justify-between items-center text-right">
                            <div>
                              <span className="text-xs font-bold text-white block">{p.name}</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">سعر التجزئة: {p.sellPrice} ر.س</span>
                            </div>
                            <div className="text-left">
                              <span className="text-[9px] text-slate-500 block">المتاح حالياً</span>
                              <span className={`text-[11px] font-bold block ${p.stock === 0 ? 'text-red-400' : 'text-teal-400'}`}>
                                {p.stock} حبة
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Simulated APK bottom notification */}
                <div className="p-2 bg-slate-950/90 text-center text-[9px] text-slate-500 border-t border-white/5">
                  تم التحديث تلقائياً • اتصال مشفر ممتثل للزكاة والضريبة
                </div>

              </div>
            </div>
          </div>
        )}

        {/* DESKTOP/GENERAL WORKSPACE VIEW (Always visible, expands fully if simulator is closed) */}
        <div className={`space-y-6 ${isMobileEmulator ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          
          {/* Main Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="space-y-1 text-right">
                <span className="text-slate-400 text-xs font-bold block">إجمالي المسحوبات والمبيعات</span>
                <span className="text-2xl font-black text-slate-900 block">{totalPurchased.toLocaleString()} ر.س</span>
                <span className="text-[10px] text-slate-400 block">شامل ضريبة القيمة المضافة 15%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Boxes className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="space-y-1 text-right">
                <span className="text-slate-400 text-xs font-bold block">الذمم والمديونية المستحقة (الآجل)</span>
                <span className="text-2xl font-black text-rose-600 block">{totalOutstanding.toLocaleString()} ر.س</span>
                <span className="text-[10px] text-amber-600 block">يرجى تسوية المديونيات في حاسوب المعرض</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Desktop transactions log */}
          <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="text-right">
                <h3 className="font-bold text-slate-900 text-sm">تفاصيل العمليات المزامنة من الجوال</h3>
                <span className="text-[10px] text-slate-500 block mt-0.5">كشف حركة الفواتير المفرغة المسجلة باسمك</span>
              </div>
              
              <button 
                onClick={() => setShowOrderModal(true)}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>طلب سحب بضاعة جديد (يدوي)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {distributorInvoices.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  لا توجد فواتير تم رفعها بعد. استخدم محاكي الهاتف الذكي على اليمين لتفريغ فواتير المبيعات ثم مزامنتها!
                </div>
              ) : (
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                      <th className="py-2.5 px-4">رقم الفاتورة الآجلة</th>
                      <th className="py-2.5 px-4">تاريخ الرفع</th>
                      <th className="py-2.5 px-4">بيان بضاعة التوزيع للزبائن</th>
                      <th className="py-2.5 px-4">المبلغ شامل الضريبة</th>
                      <th className="py-2.5 px-4 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {distributorInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.id}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono">{inv.date}</td>
                        <td className="py-2.5 px-4 text-slate-700 font-semibold max-w-[200px] truncate" title={inv.items[0]?.description}>
                          {inv.items[0]?.description}
                        </td>
                        <td className="py-2.5 px-4 font-black text-slate-950">{inv.total.toLocaleString()} ر.س</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            inv.status === 'مدفوعة' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {inv.status}
                          </span>
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

      {/* Alternative direct orders modal */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderModal(false)}
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
                    <ShoppingBag className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">سحب بضائع توزيع جديدة</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">طلب سحب من المستودع لتغذية شاحنة التوزيع</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
                
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">اختر المنتج المطلوب للتغذية *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary"
                  >
                    <option value="">-- اختر من البضائع بالمستودع --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock === 0}>
                        {p.name} (المتوفر: {p.stock} وحدة)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">الكمية المسحوبة *</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="مثال: 15"
                    value={orderQty || ''}
                    onChange={(e) => setOrderQty(parseInt(e.target.value) || 0)}
                    className="w-full text-right px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:border-primary"
                  />
                </div>

                {selectedProductId && orderQty > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>سعر البيع الموحد:</span>
                      <span className="font-bold text-slate-800">
                        {products.find(p => p.id === selectedProductId)?.sellPrice || 0} ر.س / وحدة
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة المضافة (15%):</span>
                      <span className="font-bold text-slate-800">
                        {(((products.find(p => p.id === selectedProductId)?.sellPrice || 0) * orderQty) * 0.15).toLocaleString()} ر.س
                      </span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between font-bold text-primary">
                      <span>إجمالي فاتورة الذمة الآجلة:</span>
                      <span className="text-sm font-black font-mono text-slate-900">
                        {(((products.find(p => p.id === selectedProductId)?.sellPrice || 0) * orderQty) * 1.15).toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>تأكيد سحب البضاعة</span>
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
