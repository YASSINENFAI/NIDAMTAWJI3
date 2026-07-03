import { supabase } from './supabase';
import type { Product, Invoice, Supplier, SupplierInvoice } from '../types';

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category ?? undefined,
    stock: p.stock,
    barcode: p.barcode,
    buyPrice: p.buy_price,
    sellPrice: p.sell_price,
    profitMargin: p.profit_margin,
    imageUrl: p.image_url ?? undefined,
  }));
}

export async function insertProduct(prod: Omit<Product, 'id'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: prod.name,
      category: prod.category ?? null,
      stock: prod.stock,
      barcode: prod.barcode,
      buy_price: prod.buyPrice,
      sell_price: prod.sellPrice,
      profit_margin: prod.profitMargin,
      image_url: prod.imageUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return { ...prod, id: data.id };
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function updateProductStock(productId: string, newStock: number): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) throw error;
}

// ─── INVOICES ────────────────────────────────────────────────────────────────

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((inv) => ({
    id: inv.id,
    customerName: inv.customer_name,
    customerVat: inv.customer_vat ?? undefined,
    date: inv.date,
    dueDate: inv.due_date,
    total: inv.total,
    balance: inv.balance,
    status: inv.status as Invoice['status'],
    items: inv.items as Invoice['items'],
  }));
}

export async function insertInvoice(inv: Invoice): Promise<void> {
  const { error } = await supabase.from('invoices').insert({
    id: inv.id,
    customer_name: inv.customerName,
    customer_vat: inv.customerVat ?? null,
    date: inv.date,
    due_date: inv.dueDate,
    total: inv.total,
    balance: inv.balance,
    status: inv.status,
    items: inv.items as any,
  });
  if (error) throw error;
}

// ─── PARTNERS (Suppliers & Distributors) ─────────────────────────────────────

export async function fetchPartners(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('partners')
    .select('*, partner_invoices(*)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as Supplier['type'],
    phone: p.phone ?? undefined,
    totalEarned: p.total_earned,
    monthlyGrowth: p.monthly_growth,
    initialLetter: p.initial_letter,
    invoices: ((p.partner_invoices as any[]) ?? []).map((pi: any): SupplierInvoice => ({
      id: pi.id,
      date: pi.date,
      productsSummary: pi.products_summary,
      amount: pi.amount,
      status: pi.status,
    })),
  }));
}

export async function insertPartner(
  sup: { name: string; type: 'مورد' | 'موزع'; phone?: string }
): Promise<Supplier> {
  const initialLetter = sup.name.trim().charAt(0) || 'م';
  const { data, error } = await supabase
    .from('partners')
    .insert({
      name: sup.name,
      type: sup.type,
      phone: sup.phone ?? null,
      total_earned: 0,
      monthly_growth: 0,
      initial_letter: initialLetter,
      user_id: null,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    type: data.type as Supplier['type'],
    phone: data.phone ?? undefined,
    totalEarned: 0,
    monthlyGrowth: 0,
    initialLetter,
    invoices: [],
  };
}

export async function insertPartnerInvoice(
  partnerId: string,
  bill: SupplierInvoice
): Promise<void> {
  // 1. Insert the invoice record
  const { error: invoiceError } = await supabase.from('partner_invoices').insert({
    id: bill.id,
    partner_id: partnerId,
    date: bill.date,
    products_summary: bill.productsSummary,
    amount: bill.amount,
    status: bill.status,
  });
  if (invoiceError) throw invoiceError;

  // 2. Increment the partner total_earned
  const { error: updateError } = await supabase.rpc('increment_partner_earned', {
    p_id: partnerId,
    p_amount: bill.amount,
  });
  if (updateError) throw updateError;
}
