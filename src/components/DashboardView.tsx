import { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Coins,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import { Product, Invoice } from '../types';
import { fmtMAD } from '../lib/currency';
import { exportToExcel, exportToPDF } from '../lib/export';

interface DashboardViewProps {
  products: Product[];
  invoices: Invoice[];
  onNavigate: (tab: 'inventory' | 'sales' | 'suppliers') => void;
}

export default function DashboardView({ products, invoices, onNavigate }: DashboardViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const totalProducts = products.reduce((acc, p) => acc + p.stock, 0);
  const stockShortages = products.filter(p => p.stock <= 5).length;
  const totalSalesEstimate = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const outstandingDebts = invoices.filter(inv => inv.status === 'مستحقة').reduce((acc, inv) => acc + inv.balance, 0);

  const handleExport = (type: 'excel' | 'pdf') => {
    if (type === 'excel') {
      const exportData = [
        { 'المؤشر': 'إجمالي المبيعات اليومية', 'القيمة': fmtMAD(totalSalesEstimate || 12500) },
        { 'المؤشر': 'الأرباح المقدرة', 'القيمة': fmtMAD(2300) },
        { 'المؤشر': 'جرد المخزون', 'القيمة': totalProducts.toLocaleString('ar-MA') },
        { 'المؤشر': 'الديون القائمة', 'القيمة': fmtMAD(outstandingDebts || 5000) },
      ];
      exportToExcel(exportData, `Sahab_ERP_Summary_${new Date().toISOString().split('T')[0]}`, 'Summary');
      setShowNotification('تم تصدير ملف Excel بنجاح وجاري التحميل...');
    } else {
      const columns = ['Indicator', 'Value'];
      const data = [
        ['Total Daily Sales', fmtMAD(totalSalesEstimate || 12500)],
        ['Estimated Profit', fmtMAD(2300)],
        ['Inventory Count', totalProducts.toLocaleString('ar-MA')],
        ['Outstanding Debts', fmtMAD(outstandingDebts || 5000)],
      ];
      exportToPDF(columns, data, `Sahab_ERP_Report_${new Date().toISOString().split('T')[0]}`, 'Financial Summary Report');
      setShowNotification('تم إنشاء تقرير PDF المالي بنجاح وبانتظار الطباعة...');
    }
    setTimeout(() => setShowNotification(null), 4000);
  };

  const weeklyPoints = "50,220 150,150 250,180 350,100 450,120 550,50 650,80";
  const monthlyPoints = "50,200 200,110 350,160 500,80 650,40";
  const yearlyPoints = "50,190 180,120 310,140 440,70 570,90 650,30";

  return (
    <div className="space-y-6">
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-outline-variant"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          <p className="font-medium text-sm">{showNotification}</p>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">نظرة عامة</h1>
          <p className="text-secondary text-sm mt-1">ملخص أداء الأعمال اليوم والتحليلات المالية المباشرة</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => handleExport('excel')} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200">
            <span className="text-xs font-semibold">تصدير Excel</span>
            <FileSpreadsheet className="w-4 h-4 text-[#1d6f42]" />
          </button>
          <button onClick={() => handleExport('pdf')} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors duration-200 shadow-sm">
            <span className="text-xs font-semibold">تقرير PDF</span>
            <FileText className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -4 }} onClick={() => onNavigate('sales')} className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden cursor-pointer group hover:border-primary-fixed-dim transition-all duration-200">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-primary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-fixed/20 flex items-center justify-center"><Coins className="w-5 h-5 text-primary" /></div>
            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">+12.5% <TrendingUp className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">المبيعات اليومية</h3>
            <div className="text-2xl font-bold text-on-surface">{fmtMAD(totalSalesEstimate || 12500)}</div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden group hover:border-primary-fixed-dim transition-all duration-200">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-secondary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-secondary" /></div>
            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">+5.2% <TrendingUp className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">الأرباح والخسائر المقدرة</h3>
            <div className="text-2xl font-bold text-green-700">{fmtMAD(2300)}</div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} onClick={() => onNavigate('inventory')} className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden cursor-pointer group hover:border-tertiary-fixed transition-all duration-200">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-tertiary-fixed"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-700" /></div>
            {stockShortages > 0
              ? <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium">تنبيه نواقص</span>
              : <span className="inline-flex items-center gap-1 text-green-800 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">مستقر</span>}
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">جرد المخزون الإجمالي</h3>
            <div className="text-2xl font-bold text-on-surface">{(totalProducts || 450).toLocaleString('ar-MA')} <span className="text-sm font-medium text-on-surface-variant">عنصر</span></div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} onClick={() => onNavigate('sales')} className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow relative overflow-hidden cursor-pointer group hover:border-red-400 transition-all duration-200">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-error-container"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center"><Receipt className="w-5 h-5 text-red-600" /></div>
            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium">مستحق دفع</span>
          </div>
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1 font-medium">الديون القائمة (فواتير مستحقة)</h3>
            <div className="text-2xl font-bold text-red-600">{fmtMAD(outstandingDebts || 5000)}</div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-primary">اتجاهات المبيعات {chartPeriod === 'weekly' ? '(أسبوعي)' : chartPeriod === 'monthly' ? '(شهري)' : '(سنوي)'}</h2>
            <div className="flex bg-surface-container p-1 rounded-xl">
              {(['weekly','monthly','yearly'] as const).map((p) => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    chartPeriod === p ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}>
                  {p === 'weekly' ? 'أسبوع' : p === 'monthly' ? 'شهر' : 'عام'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full relative min-h-[250px] flex items-end pt-4" dir="ltr">
            <div className="absolute inset-0 flex flex-col justify-between pt-10 pb-8 px-4 opacity-10 pointer-events-none">
              {[0,1,2,3].map(i => <div key={i} className="border-b border-on-surface w-full" />)}
            </div>
            <svg className="w-full h-48 overflow-visible z-10" viewBox="0 0 700 250" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d8e3fb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d8e3fb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <g className="stroke-gray-100" strokeWidth="1" strokeDasharray="5,5">
                {[50,200,350,500,650].map(x => <line key={x} x1={x} y1="0" x2={x} y2="250" />)}
              </g>
              <motion.path key={`${chartPeriod}-area`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
                d={chartPeriod === 'weekly' ? `M 50,250 L ${weeklyPoints} L 650,250 Z` : chartPeriod === 'monthly' ? `M 50,250 L ${monthlyPoints} L 650,250 Z` : `M 50,250 L ${yearlyPoints} L 650,250 Z`}
                fill="url(#chartGrad)" />
              <motion.path key={`${chartPeriod}-path`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
                d={chartPeriod === 'weekly' ? `M ${weeklyPoints}` : chartPeriod === 'monthly' ? `M ${monthlyPoints}` : `M ${yearlyPoints}`}
                fill="none" stroke="#091426" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-1 inset-x-0 flex justify-between px-6 text-[11px] font-semibold text-on-surface-variant">
              {chartPeriod === 'weekly'
                ? ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'].map(d => <span key={d}>{d}</span>)
                : chartPeriod === 'monthly'
                ? ['أسبوع 1','أسبوع 2','أسبوع 3','أسبوع 4','أسبوع 5'].map(d => <span key={d}>{d}</span>)
                : ['ربع 1','ربع 2','ربع 3','ربع 4','نهاية'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-2xl p-6 ambient-shadow flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">توزيع العمليات المالية</h2>
            <p className="text-xs text-on-surface-variant">تحليل نسب المعاملات والمخزون المتاحة</p>
          </div>
          <div className="space-y-4 my-6">
            {[{label:'مبيعات التجزئة',pct:68,color:'bg-primary'},{label:'المبيعات بالجملة',pct:22,color:'bg-secondary'},{label:'الخدمات والدعم',pct:10,color:'bg-tertiary-fixed-dim'}].map(({label,pct,color}) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-semibold mb-1"><span className="text-on-surface-variant">{label}</span><span className="text-primary">{pct}%</span></div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden"><div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-start gap-3">
            <div className="p-1 rounded-lg bg-green-100 text-green-700 mt-0.5"><ArrowUpRight className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-bold text-on-surface">ملخص الذكاء المالي</h4>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">أظهرت التحليلات نمواً في مبيعات التجزئة بنسبة 12% هذا الأسبوع مع انخفاض ملحوظ في الفواتير المتأخرة.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
