export type ActiveTab = 'dashboard' | 'inventory' | 'sales' | 'suppliers' | 'distributors' | 'users';

export interface Product {
  id: string;
  name: string;
  category?: string;
  stock: number;
  barcode: string;
  buyPrice: number;
  sellPrice: number;
  profitMargin: number;
  imageUrl?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerName: string;
  customerVat?: string;
  date: string;
  dueDate: string;
  total: number;
  balance: number;
  status: 'مدفوعة' | 'مستحقة';
  items: InvoiceItem[];
}

export interface SupplierInvoice {
  id: string;
  date: string;
  productsSummary: string;
  amount: number;
  status: 'مكتملة' | 'قيد المعالجة';
}

export interface Supplier {
  id: string;
  name: string;
  totalEarned: number;
  monthlyGrowth: number;
  initialLetter: string;
  invoices: SupplierInvoice[];
  type?: 'مورد' | 'موزع';
  phone?: string;
}
