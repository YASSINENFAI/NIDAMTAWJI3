import { Product, Invoice, Supplier } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'هاتف ذكي X200',
    category: 'إلكترونيات',
    stock: 45,
    barcode: '1009283746',
    buyPrice: 2500,
    sellPrice: 3200,
    profitMargin: 28.0,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=60'
  },
  {
    id: '2',
    name: 'سماعات لاسلكية Pro',
    category: 'إكسسوارات',
    stock: 4,
    barcode: '8837261524',
    buyPrice: 450,
    sellPrice: 750,
    profitMargin: 66.6,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=60'
  },
  {
    id: '3',
    name: 'شاحن سريع 45W',
    category: 'إكسسوارات',
    stock: 120,
    barcode: '9928371625',
    buyPrice: 120,
    sellPrice: 200,
    profitMargin: 66.6,
    imageUrl: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=150&auto=format&fit=crop&q=60'
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: '553',
    customerName: 'شركة الأفق للتجارة',
    customerVat: '300987654300003',
    date: '2023-10-25',
    dueDate: '2023-11-10',
    total: 15000.00,
    balance: 0.00,
    status: 'مدفوعة',
    items: [
      {
        description: 'رخصة نظام ERP الاحترافي (سنوي)',
        quantity: 1,
        price: 13043.48,
        tax: 1956.52,
        total: 15000.00,
      }
    ]
  },
  {
    id: '554',
    customerName: 'مؤسسة الرواد',
    customerVat: '311987654300003',
    date: '2023-10-26',
    dueDate: '2023-11-10',
    total: 8500.00,
    balance: 4000.00,
    status: 'مستحقة',
    items: [
      {
        description: 'رخصة نظام ERP (سنوي)',
        quantity: 1,
        price: 5000.00,
        tax: 750.00,
        total: 5750.00,
      },
      {
        description: 'ساعات دعم فني (باقة 10 ساعات)',
        quantity: 1,
        price: 2391.30,
        tax: 358.70,
        total: 2750.00,
      }
    ]
  },
  {
    id: '555',
    customerName: 'عميل نقدي (معرض)',
    customerVat: '300111222300003',
    date: '2023-10-26',
    dueDate: '2023-10-26',
    total: 1250.00,
    balance: 0.00,
    status: 'مدفوعة',
    items: [
      {
        description: 'باقة ملحقات الهاتف المتكاملة',
        quantity: 1,
        price: 1086.96,
        tax: 163.04,
        total: 1250.00,
      }
    ]
  },
  {
    id: '556',
    customerName: 'شركة التقنية الحديثة',
    customerVat: '305544332200003',
    date: '2023-10-27',
    dueDate: '2023-11-15',
    total: 45000.00,
    balance: 0.00,
    status: 'مدفوعة',
    items: [
      {
        description: 'خدمة تركيب وتخصيص الخوادم السحابية المتكاملة',
        quantity: 1,
        price: 39130.43,
        tax: 5869.57,
        total: 45000.00,
      }
    ]
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'شركة الجزيرة للأجهزة',
    totalEarned: 24500,
    monthlyGrowth: 12,
    initialLetter: 'ج',
    type: 'مورد',
    phone: '+966 50 111 2222',
    invoices: [
      {
        id: 'INV-2023-089',
        date: '2023-10-27',
        productsSummary: 'أجهزة إلكترونية (x12)',
        amount: 4500,
        status: 'مكتملة',
      },
      {
        id: 'INV-2023-088',
        date: '2023-10-27',
        productsSummary: 'ملحقات مكتبية (x50)',
        amount: 1250,
        status: 'قيد المعالجة',
      },
      {
        id: 'INV-2023-087',
        date: '2023-10-26',
        productsSummary: 'شاشات عرض (x5)',
        amount: 8900,
        status: 'مكتملة',
      }
    ]
  },
  {
    id: 's2',
    name: 'مستودعات الخليج للتقنية',
    totalEarned: 18300,
    monthlyGrowth: 8,
    initialLetter: 'خ',
    type: 'مورد',
    phone: '+966 50 333 4444',
    invoices: [
      {
        id: 'INV-2023-094',
        date: '2023-10-28',
        productsSummary: 'كابلات توصيل ومحولات الطاقة (x100)',
        amount: 3200,
        status: 'مكتملة',
      },
      {
        id: 'INV-2023-093',
        date: '2023-10-27',
        productsSummary: 'سماعات رأس سلكية اقتصادية (x30)',
        amount: 15100,
        status: 'قيد المعالجة',
      }
    ]
  },
  {
    id: 's3',
    name: 'مؤسسة الرياض للتوزيع',
    totalEarned: 32000,
    monthlyGrowth: -3,
    initialLetter: 'ر',
    type: 'موزع',
    phone: '+966 50 555 6666',
    invoices: [
      {
        id: 'INV-2023-102',
        date: '2023-10-25',
        productsSummary: 'ألواح ذكية وشاشات عرض تفاعلية (x3)',
        amount: 19500,
        status: 'مكتملة',
      },
      {
        id: 'INV-2023-101',
        date: '2023-10-24',
        productsSummary: 'حوامل أجهزة بروجيكتور وسقوف ذكية (x15)',
        amount: 12500,
        status: 'مكتملة',
      }
    ]
  },
  {
    id: 's4',
    name: 'شركة المشرق للتجارة والتوزيع',
    totalEarned: 45000,
    monthlyGrowth: 15,
    initialLetter: 'م',
    type: 'موزع',
    phone: '+966 50 777 8888',
    invoices: []
  }
];
