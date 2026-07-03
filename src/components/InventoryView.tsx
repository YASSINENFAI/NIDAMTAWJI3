import { useState, useMemo, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Barcode, 
  Boxes, 
  AlertTriangle, 
  CircleDollarSign,
  TrendingUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Product } from '../types';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
}

export default function InventoryView({ products, onAddProduct, onDeleteProduct }: InventoryViewProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Add product form states
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [barcode, setBarcode] = useState('');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto calculate profit margin for the form
  const computedMargin = useMemo(() => {
    const buy = parseFloat(buyPrice);
    const sell = parseFloat(sellPrice);
    if (buy > 0 && sell > buy) {
      return (((sell - buy) / buy) * 100).toFixed(1);
    }
    return '0.0';
  }, [buyPrice, sellPrice]);

  // Overall Inventory stats derived dynamically
  const totalItemsCount = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const shortageCount = useMemo(() => {
    return products.filter(p => p.stock <= 5).length;
  }, [products]);

  const estimatedValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.sellPrice), 0);
  }, [products]);

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm)
    );
  }, [products, searchTerm]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setFormError('يرجى إدخال اسم المنتج');
      return;
    }
    if (!barcode.trim()) {
      setFormError('يرجى إدخال باركود أو رمز SKU للمنتج');
      return;
    }
    
    const qty = Number(stock);
    const buy = parseFloat(buyPrice);
    const sell = parseFloat(sellPrice);

    if (isNaN(qty) || qty < 0) {
      setFormError('الكمية يجب أن تكون صفراً أو أكثر');
      return;
    }
    if (isNaN(buy) || buy <= 0) {
      setFormError('سعر الشراء يجب أن يكون أكبر من صفر');
      return;
    }
    if (isNaN(sell) || sell <= 0) {
      setFormError('سعر البيع يجب أن يكون أكبر من صفر');
      return;
    }
    if (sell < buy) {
      setFormError('تنبيه: سعر البيع أقل من سعر الشراء (خسارة متوقعة)');
    }

    // Call callback to add product globally
    onAddProduct({
      name,
      stock: qty,
      barcode,
      buyPrice: buy,
      sellPrice: sell,
      profitMargin: parseFloat(computedMargin),
      imageUrl: imageUrl.trim() || undefined,
    });

    // Reset Form
    setName('');
    setImageUrl('');
    setStock(0);
    setBarcode('');
    setBuyPrice('');
    setSellPrice('');
    
    setSuccessMsg('تم حفظ المنتج بنجاح وإضافته إلى جدول المخزون المالي');
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Generate random barcode helper
  const handleGenerateBarcode = () => {
    const randomCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setBarcode(randomCode);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">إدارة المخزون</h1>
          <p className="text-secondary text-sm mt-1">مراقبة وتحديث تفاصيل المنتجات والأسعار وإدارة هوامش الربح المالي.</p>
        </div>
        <button 
          onClick={() => {
            // Scroll to form or highlight
            const formElement = document.getElementById('quick-add-form');
            formElement?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-colors font-semibold flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total items */}
        <div className="bg-white border border-outline-variant p-6 rounded-2xl relative overflow-hidden ambient-shadow">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-primary"></div>
          <div className="flex justify-between items-start mb-4">
            <Boxes className="w-6 h-6 text-primary" />
            <span className="text-xs text-on-surface-variant font-medium bg-surface-container-low px-2.5 py-1 rounded-lg">إجمالي المنتجات</span>
          </div>
          <div className="text-3xl font-bold text-on-surface">{totalItemsCount.toLocaleString()}</div>
          <div className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#006874]" />
            <span className="text-[#006874] font-semibold">+12</span> منتجاً جديداً هذا الشهر
          </div>
        </div>

        {/* Shortages */}
        <div className="bg-white border border-outline-variant p-6 rounded-2xl relative overflow-hidden ambient-shadow">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-tertiary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <span className="text-xs text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg">نواقص المخزون</span>
          </div>
          <div className="text-3xl font-bold text-on-surface">{shortageCount}</div>
          <div className="text-xs text-on-surface-variant mt-2">
            {shortageCount > 0 ? 'يرجى مراجعة المنتجات ذات المخزون الحرج وإعادة الطلب' : 'جميع بنود المخزون متوفرة بوضع ممتاز'}
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white border border-outline-variant p-6 rounded-2xl relative overflow-hidden ambient-shadow">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-secondary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <CircleDollarSign className="w-6 h-6 text-secondary" />
            <span className="text-xs text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg">قيمة المخزون المقدرة</span>
          </div>
          <div className="text-3xl font-bold text-on-surface flex items-baseline gap-1" dir="ltr">
            <span className="text-lg font-semibold text-on-surface-variant">د.م</span>
            {estimatedValue.toLocaleString()}
          </div>
          <div className="text-xs text-on-surface-variant mt-2">محسوبة بناءً على سعر البيع الحالي</div>
        </div>

      </div>

      {/* Main Workspace: Form and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Add Product Form (Collapsible/Side panel) */}
        <div id="quick-add-form" className="lg:col-span-4 bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow">
          <h2 className="text-lg font-bold text-primary mb-6 border-b border-surface-container pb-4 flex items-center gap-2">
            <span>إضافة منتج سريع</span>
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">اسم المنتج</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="أدخل اسم المنتج بدقة"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">صورة المنتج (اختياري)</label>
              {imageUrl ? (
                <div className="relative rounded-2xl border border-outline-variant overflow-hidden h-32 bg-slate-50 flex items-center justify-center group">
                  <img 
                    src={imageUrl} 
                    alt="Product preview" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      حذف الصورة
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl h-32 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all text-center p-4">
                  <Upload className="w-7 h-7 text-slate-400 mb-1.5" />
                  <span className="text-xs font-bold text-slate-600">اضغط لرفع صورة أو التقاطها</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden" 
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">الكمية (المخزون)</label>
                <input 
                  type="number" 
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">الباركود</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-2 text-sm text-on-surface focus:border-primary outline-none font-mono"
                    placeholder="امسح أو أنشئ..."
                  />
                  <button 
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="absolute left-2.5 top-2 text-primary hover:text-primary/70 transition-colors"
                    title="توليد باركود تلقائي"
                  >
                    <Barcode className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-surface-container pt-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">سعر الشراء (د.م)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary outline-none font-mono"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">سعر البيع (د.م)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary outline-none font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Profit Margin Indicator */}
            <div className="bg-surface-container p-4 rounded-xl flex justify-between items-center border border-dashed border-outline-variant">
              <span className="text-xs font-semibold text-on-surface-variant">هامش الربح المتوقع:</span>
              <span className={`text-lg font-bold ${Number(computedMargin) < 0 ? 'text-red-600' : 'text-[#006874]'}`}>
                {computedMargin}%
              </span>
            </div>

            {/* Error or Success notification */}
            {formError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-lg border border-red-200">{formError}</p>
            )}
            {successMsg && (
              <p className="text-xs text-[#006874] font-semibold bg-teal-50 p-3 rounded-lg border border-teal-200">{successMsg}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm"
            >
              حفظ في المخزن المالي
            </button>
          </form>
        </div>

        {/* Products Data Table */}
        <div className="lg:col-span-8 bg-white border border-outline-variant rounded-2xl overflow-hidden ambient-shadow">
          
          {/* Table Header Filter controls */}
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low">
            <h3 className="text-base font-bold text-on-surface">قائمة المنتجات المتاحة</h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 absolute right-3.5 top-2.5 text-on-surface-variant" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-outline-variant rounded-full pr-10 pl-4 py-2 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="بحث برقم الباركود أو الاسم..."
              />
            </div>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-xs font-bold border-b border-outline-variant">
                  <th className="py-3 px-6">الصورة</th>
                  <th className="py-3 px-6">اسم المنتج والتفاصيل</th>
                  <th className="py-3 px-6 text-center">المخزون</th>
                  <th className="py-3 px-6">سعر الشراء</th>
                  <th className="py-3 px-6">سعر البيع</th>
                  <th className="py-3 px-6">الربح %</th>
                  <th className="py-3 px-6 w-16">إجراءات</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface divide-y divide-surface-container-highest">
                <AnimatePresence mode="popLayout">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((prod) => (
                      <motion.tr 
                        key={prod.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-surface-container-low transition-colors duration-150 group"
                      >
                        <td className="py-3.5 px-6">
                          {prod.imageUrl ? (
                            <img 
                              src={prod.imageUrl} 
                              alt={prod.name} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-xl border border-outline-variant"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-xl border border-outline-variant flex items-center justify-center text-slate-400">
                              <Boxes className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-primary">{prod.name}</div>
                          <div className="text-xs font-mono text-on-surface-variant mt-0.5">{prod.barcode}</div>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                            prod.stock <= 5 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                          }`}>
                            {prod.stock}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-medium">{prod.buyPrice.toLocaleString()} د.م.</td>
                        <td className="py-3.5 px-6 font-mono font-medium">{prod.sellPrice.toLocaleString()} د.م.</td>
                        <td className="py-3.5 px-6">
                          <span className={`font-semibold text-xs px-2.5 py-1 rounded-lg ${
                            prod.profitMargin <= 0 
                              ? 'bg-red-50 text-red-600' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {prod.profitMargin}%
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <button 
                            onClick={() => onDeleteProduct(prod.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="حذف المنتج من المخزون"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant font-medium">
                        لا توجد نتائج مطابقة لعملية البحث الحالية
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-white">
            <span className="text-xs font-medium text-on-surface-variant">
              عرض {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} من {filteredProducts.length}
            </span>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-primary text-white' 
                        : 'border border-outline-variant text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
