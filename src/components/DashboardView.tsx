import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Coins, AlertTriangle, Receipt, FileSpreadsheet, FileText, ShoppingBag } from 'lucide-react';
import { Product, Invoice } from '../types';
import { fmtMAD } from '../lib/currency';
import { exportToExcel, exportToPDF } from '../lib/export';

interface DashboardViewProps {
  products: Product[];
  invoices: Invoice[];
  onNavigate: (tab: 'inventory' | 'sales' | 'suppliers') => void;
}

export default function DashboardView({ products, invoices, onNavigate }: DashboardViewProps) {
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const totalStockItems  = products.reduce((acc, p) => acc + p.stock, 0);
  const stockShortages   = products.filter(p => p.stock < 5).length;
  const totalSalesValue  = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const outstandingDebts = invoices
    .filter(inv => inv.status === 'مستحقة')
    .reduce((acc, inv) => acc + inv.balance, 0);

  /**
   * Real profit calculation based on (sellPrice - buyPrice) * quantity.
   * Invoice items store a free-text description, not a product ID, so we
   * match by name — requiring the product name to appear at the start of
   * the description to avoid partial-name false matches.
   */
  const totalProfit = invoices.reduce((acc, inv) => {
    return acc + inv.items.reduce((itemAcc, item) => {
      const desc    = item.description.trim();
      const product = products.find(p => {
        const name = p.name.trim();
        return desc === name || desc.startsWith(name + ' ') || desc.startsWith(name + '(');
      });
      if (product) {
        const profitPerUnit = product.sellPrice - product.buyPrice;
        return itemAcc + profitPerUnit * item.quantity;
      }
      return itemAcc;
    }, 0);
  }, 0);

  const handleExport = (type: 'excel' | 'pdf') => {
    if (type === 'excel') {
      const exportData = [
        { 'البيان': 'إجمالي المبيعات',        'القيمة': fmtMAD(totalSalesValue) },
        { 'البيان': 'صافي الأرباح',           'القيمة': fmtMAD(totalProfit) },
        { 'البيان': 'المخزون الإجمالي',       'القيمة': totalStockItems.toLocaleString('ar-MA') },
        { 'البيان': 'الذمم المستحقة',         'القيمة': fmtMAD(outstandingDebts) },
      ];
      exportToExcel(exportData, `SahabERP_Summary_${new Date().toISOString().split('T')[0]}`, 'Summary');
      setShowNotification('تم تصدير ملف Excel بنجاح!');
    } else {
      const columns = ['البيان', 'القيمة'];
      const data = [
        ['إجمالي المبيعات',  fmtMAD(totalSalesValue)],
        ['صافي الأرباح',     fmtMAD(totalProfit)],
        ['المخزون الإجمالي', totalStockItems.toLocaleString('ar-MA')],
        ['الذمم المستحقة',   fmtMAD(outstandingDebts)],
      ];
      exportToPDF(columns, data, `SahabERP_Report_${new Date().toISOString().split('T')[0]}`);
      setShowNotification('تم تصدير ملف PDF بنجاح!');
    }
    setTimeout(() => setShowNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-white/10"
        >
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <p className="font-medium text-sm">{showNotification}</p>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">لوحة القيادة 📊</h1>
          <p className="text-slate-500 text-sm mt-1">نظرة شاملة على أداء المبيعات والمخزون والذمم المالية.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleExport('excel')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-lg shadow-slate-900/20"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Card */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Coins className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <h3 className="text-xs text-slate-500 mb-1 font-bold">إجمالي المبيعات</h3>
          <div className="text-2xl font-black text-slate-900">{fmtMAD(totalSalesValue)}</div>
        </div>

        {/* Profit Card */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-xs text-slate-500 mb-1 font-bold">صافي الأرباح</h3>
          <div className="text-2xl font-black text-emerald-600">{fmtMAD(totalProfit)}</div>
        </div>

        {/* Inventory Card */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group cursor-pointer hover:border-teal-500/30 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            {stockShortages > 0 && (
              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black">{stockShortages} نقص</span>
            )}
          </div>
          <h3 className="text-xs text-slate-500 mb-1 font-bold">إجمالي المخزون</h3>
          <div className="text-2xl font-black text-slate-900">{totalStockItems.toLocaleString('ar-MA')}</div>
        </div>

        {/* Debt Card */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group cursor-pointer hover:border-rose-500/30 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <h3 className="text-xs text-slate-500 mb-1 font-bold">الذمم المستحقة</h3>
          <div className="text-2xl font-black text-rose-600">{fmtMAD(outstandingDebts)}</div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal-500" />
            آخر الفواتير
          </h2>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">لا توجد فواتير بعد.</p>
            ) : (
              invoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-black text-slate-900">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{inv.date}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900">{fmtMAD(inv.total)}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      inv.status === 'مدفوعة' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))
            )}
            {invoices.length > 5 && (
              <button onClick={() => onNavigate('sales')} className="w-full mt-6 py-3 text-xs font-bold text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
                عرض جميع الفواتير ({invoices.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
