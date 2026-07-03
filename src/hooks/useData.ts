import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchProducts, insertProduct, deleteProduct, updateProductStock,
  fetchInvoices, insertInvoice,
  fetchPartners, insertPartner, insertPartnerInvoice,
} from '../lib/db';
import type { Product, Invoice, Supplier, SupplierInvoice } from '../types';

export function useData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [p, inv, sup] = await Promise.all([
        fetchProducts(),
        fetchInvoices(),
        fetchPartners(),
      ]);
      setProducts(p);
      setInvoices(inv);
      setSuppliers(sup);
    } catch (err: any) {
      setDataError(err.message ?? 'Unknown error loading data');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadAll(); 

    // Subscribe to real-time changes
    const productsSub = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts().then(setProducts);
      })
      .subscribe();

    const invoicesSub = supabase
      .channel('public:invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices().then(setInvoices);
      })
      .subscribe();

    const partnersSub = supabase
      .channel('public:partners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, () => {
        fetchPartners().then(setSuppliers);
      })
      .subscribe();

    const partnerInvoicesSub = supabase
      .channel('public:partner_invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_invoices' }, () => {
        fetchPartners().then(setSuppliers);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsSub);
      supabase.removeChannel(invoicesSub);
      supabase.removeChannel(partnersSub);
      supabase.removeChannel(partnerInvoicesSub);
    };
  }, [loadAll]);

  // Product actions
  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    const created = await insertProduct(newProd);
    // Optimistic update handled by Realtime
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    // Optimistic update handled by Realtime
  };

  const handleUpdateProductStock = async (productId: string, quantityChange: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newStock = Math.max(0, product.stock + quantityChange);
    await updateProductStock(productId, newStock);
    // Optimistic update handled by Realtime
  };

  // Invoice actions
  const handleAddInvoice = async (newInvoice: Invoice) => {
    await insertInvoice(newInvoice);
    // Optimistic update handled by Realtime
  };

  // Partner actions
  const handleAddSupplier = async (newSup: { name: string; type: 'مورد' | 'موزع'; phone?: string }) => {
    await insertPartner(newSup);
    // Optimistic update handled by Realtime
  };

  const handleAddSupplierInvoice = async (supplierId: string, newBill: SupplierInvoice) => {
    await insertPartnerInvoice(supplierId, newBill);
    // Optimistic update handled by Realtime
  };

  return {
    products, invoices, suppliers,
    dataLoading, dataError,
    handleAddProduct, handleDeleteProduct, handleUpdateProductStock,
    handleAddInvoice,
    handleAddSupplier, handleAddSupplierInvoice,
    reload: loadAll,
  };
}
