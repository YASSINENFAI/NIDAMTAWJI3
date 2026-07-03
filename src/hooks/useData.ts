import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => { loadAll(); }, [loadAll]);

  // Product actions
  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    const created = await insertProduct(newProd);
    setProducts((prev) => [created, ...prev]);
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateProductStock = async (productId: string, quantityChange: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newStock = Math.max(0, product.stock + quantityChange);
    await updateProductStock(productId, newStock);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  // Invoice actions
  const handleAddInvoice = async (newInvoice: Invoice) => {
    await insertInvoice(newInvoice);
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  // Partner actions
  const handleAddSupplier = async (newSup: { name: string; type: 'مورد' | 'موزع'; phone?: string }) => {
    const created = await insertPartner(newSup);
    setSuppliers((prev) => [...prev, created]);
  };

  const handleAddSupplierInvoice = async (supplierId: string, newBill: SupplierInvoice) => {
    await insertPartnerInvoice(supplierId, newBill);
    setSuppliers((prev) =>
      prev.map((sup) => {
        if (sup.id === supplierId) {
          return {
            ...sup,
            totalEarned: sup.totalEarned + newBill.amount,
            invoices: [newBill, ...sup.invoices],
          };
        }
        return sup;
      })
    );
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
