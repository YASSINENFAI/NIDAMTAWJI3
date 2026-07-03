import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Coins, 
  AlertTriangle, 
  Receipt, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ArrowUpRight 
} from 'lucide-react';
import { Product, Invoice } from '../types';

interface DashboardViewProps {
  products: Product[];
  invoices: Invoice[];
  onNavigate: (tab: 'inventory' | 'sales' | 'suppliers') => void;
}

export default function DashboardView({ products, invoices, onNavigate }: DashboardViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Derive some real-time stats from our global state
  const totalProducts = products.reduce((acc, p) => acc + p.stock, 0);
  const stockShortages = products.filter(p => p.stock <= 5).length;
  
  // Calculate daily sales estimation & total profit
  const totalSalesEstimate = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const outstandingDebts = invoices
    .filter(inv => inv.status === 'مستحقة')
    .reduce((acc, inv) => acc + inv.balance, 0);

  const handleExport = (type: 'excel' | 'pdf') => {
    setShowNotification(
      type === 'excel' 
        ? 'تم تصدير ملف Excel بنجاح وجاري التحميل...' 
        : 'تم إنشاء تقرير PDF المالي بنجاح وبانتظار الطباعة...'
    );
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // SVG Chart points
  const weeklyPoints = "50,220 150,150 250,180 350,100 450,120 550,50 650,80";
  const monthlyPoints = "50,200 200,110 350,160 500,80 650,40";
  const yearlyPoints = "50,190 180,120 310,140 440,70 570,90 650,30";

  return (
    <div className="space-y-6">
      {/* Notifications Toast */}
      {showNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-outline-variant"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          <p className="font-medium text-sm">{showNotification}</p>
        </motion.div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">نظرة عامة</h1>
          <p className="text-secondary text-sm mt-1">ملخص أداء الأعمال اليوم والتحليلات المالية المباشرة</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => handleExport('excel')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200"
          >
            <span className="text-xs font-semibold">تصدير Excel</span>
            <FileSpreadsheet className="w-4 h-4 text-[#1d6f42]" />
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors duration-200 shadow-sm"
          >
            <span className="text-xs font-semibold">تقرير PDF</span>
            <FileText className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Bento Grid: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Daily Sales */}
        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('sales')}
          className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden cursor-pointer group hover:border-primary-fixed-dim transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-primary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-fixed/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">
              +12.5%
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">المبيعات اليومية</h3>
            <div className="text-2xl font-bold text-on-surface flex items-baseline gap-1.5" dir="ltr">
              <span className="text-sm font-semibold text-on-surface-variant">د.م.</span>
              12,500
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Profit/Loss */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden group hover:border-primary-fixed-dim transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-secondary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">
              +5.2%
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">الأرباح والخسائر المقدرة</h3>
            <div className="text-2xl font-bold text-green-700 flex items-baseline gap-1.5" dir="ltr">
              <span className="text-sm font-semibold text-green-600">د.م.</span>
              +2,300
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Stock Count */}
        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden cursor-pointer group hover:border-tertiary-fixed transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-tertiary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            {stockShortages > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium">
                تنبيه نواقص
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-green-800 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">
                مستقر
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">جرد المخزون الإجمالي</h3>
            <div className="text-2xl font-bold text-on-surface flex items-baseline gap-1.5" dir="ltr">
              <span className="text-sm font-semibold text-on-surface-variant">عنصر</span>
              {totalProducts || 450}
            </div>
          </div>
        </motion.div>

        {/* Metric 4: Outstanding Debts */}
        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('sales')}
          className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden cursor-pointer group hover:border-red-400 transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-error-container"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-red-600" />
            </div>
            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium">
              مستحق دفع
            </span>
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">الديون القائمة (فواتير مستحقة)</h3>
            <div className="text-2xl font-bold text-red-600 flex items-baseline gap-1.5" dir="ltr">
              <span className="text-sm font-semibold text-red-400">د.م.</span>
              {outstandingDebts.toLocaleString() || "5,000"}
            </div>
          </div>
        </motion.div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Chart Area */}
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-primary">
              اتجاهات المبيعات {chartPeriod === 'weekly' ? '(أسبوعي)' : chartPeriod === 'monthly' ? '(شهري)' : '(سنوي)'}
            </h2>
            <div className="flex bg-surface-container p-1 rounded-xl">
              <button 
                onClick={() => setChartPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartPeriod === 'weekly' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                أسبوع
              </button>
              <button 
                onClick={() => setChartPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartPeriod === 'monthly' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                شهر
              </button>
              <button 
                onClick={() => setChartPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartPeriod === 'yearly' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                عام
              </button>
            </div>
          </div>

          {/* SVG Animated Line Chart */}
          <div className="flex-1 w-full relative min-h-[250px] flex items-end pt-4" dir="ltr">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-10 pb-8 px-4 opacity-10 pointer-events-none">
              <div className="border-b border-on-surface w-full"></div>
              <div className="border-b border-on-surface w-full"></div>
              <div className="border-b border-on-surface w-full"></div>
              <div className="border-b border-on-surface w-full"></div>
            </div>

            {/* Dynamic Line SVG */}
            <svg className="w-full h-48 overflow-visible z-10" viewBox="0 0 700 250" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d8e3fb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d8e3fb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid vertical reference lines */}
              <g className="stroke-gray-100" strokeWidth="1" strokeDasharray="5,5">
                <line x1="50" y1="0" x2="50" y2="250" />
                <line x1="200" y1="0" x2="200" y2="250" />
                <line x1="350" y1="0" x2="350" y2="250" />
                <line x1="500" y1="0" x2="500" y2="250" />
                <line x1="650" y1="0" x2="650" y2="250" />
              </g>

              {/* Trend Gradient Area */}
              <motion.path 
                key={`${chartPeriod}-area`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                d={chartPeriod === 'weekly' 
                  ? `M 50,250 L ${weeklyPoints} L 650,250 Z`
                  : chartPeriod === 'monthly'
                  ? `M 50,250 L ${monthlyPoints} L 650,250 Z`
                  : `M 50,250 L ${yearlyPoints} L 650,250 Z`
                }
                fill="url(#chartGrad)"
              />

              {/* Trend line path with trace animation */}
              <motion.path 
                key={`${chartPeriod}-path`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                d={chartPeriod === 'weekly' 
                  ? `M ${weeklyPoints}` 
                  : chartPeriod === 'monthly'
                  ? `M ${monthlyPoints}`
                  : `M ${yearlyPoints}`
                }
                fill="none" 
                stroke="#091426" 
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Interactive nodes */}
              {chartPeriod === 'weekly' ? (
                <>
                  <circle cx="50" cy="220" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="150" cy="150" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="250" cy="180" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="350" cy="100" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="450" cy="120" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="550" cy="50" r="6" fill="#091426" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="650" cy="80" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                </>
              ) : chartPeriod === 'monthly' ? (
                <>
                  <circle cx="50" cy="200" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="200" cy="110" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="350" cy="160" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="500" cy="80" r="6" fill="#091426" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="650" cy="40" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                </>
              ) : (
                <>
                  <circle cx="50" cy="190" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="180" cy="120" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="310" cy="140" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="440" cy="70" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="570" cy="90" r="5" fill="#ffffff" stroke="#091426" strokeWidth="2" />
                  <circle cx="650" cy="30" r="6" fill="#091426" stroke="#ffffff" strokeWidth="2" />
                </>
              )}
            </svg>

            {/* X-Axis labels */}
            <div className="absolute bottom-1 inset-x-0 flex justify-between px-6 text-[11px] font-semibold text-on-surface-variant">
              {chartPeriod === 'weekly' ? (
                <>
                  <span>السبت</span>
                  <span>الأحد</span>
                  <span>الإثنين</span>
                  <span>الثلاثاء</span>
                  <span>الأربعاء</span>
                  <span>الخميس</span>
                  <span>الجمعة</span>
                </>
              ) : chartPeriod === 'monthly' ? (
                <>
                  <span>الأسبوع 1</span>
                  <span>الأسبوع 2</span>
                  <span>الأسبوع 3</span>
                  <span>الأسبوع 4</span>
                  <span>الأسبوع 5</span>
                </>
              ) : (
                <>
                  <span>الربع الأول</span>
                  <span>الربع الثاني</span>
                  <span>الربع الثالث</span>
                  <span>الربع الرابع</span>
                  <span>نهاية العام</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Business Distribution Analysis Panel */}
        <div className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">توزيع العمليات المالية</h2>
            <p className="text-xs text-on-surface-variant">تحليل نسب المعاملات والمخزون المتاحة</p>
          </div>

          <div className="space-y-4 my-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface-variant">مبيعات التجزئة</span>
                <span className="text-primary">68%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface-variant">المبيعات بالجملة</span>
                <span className="text-primary">22%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface-variant">الخدمات والدعم الفني</span>
                <span className="text-primary">10%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary-fixed-dim h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-start gap-3">
            <div className="p-1 rounded-lg bg-green-100 text-green-700 mt-0.5">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface">ملخص الذكاء المالي</h4>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                أظهرت التحليلات نمواً في مبيعات التجزئة بنسبة 12% هذا الأسبوع مع انخفاض ملحوظ في الفواتير المتأخرة المستحقة.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
