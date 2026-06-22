export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  tenantId: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  gstPercent: number;
  hsnSac?: string;
  barcode?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  stock: number;
  minStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  discount?: number;
  dueDate?: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  productId: string;
  product?: Product;
  quantity: number;
  rate: number;
  gstPercent: number;
  amount: number;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId?: string;
  invoice?: Invoice;
  amount: number;
  mode: 'CASH' | 'UPI' | 'BANK' | 'CARD' | 'SPLIT' | 'OTHER';
  reference?: string;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  categoryId: string;
  category?: ExpenseCategory;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
}

export interface BusinessProfile {
  id: string;
  tenantId: string;
  name: string;
  logo?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  invoicePrefix: string;
  invoiceNumber: number;
}

export interface DashboardStats {
  thisMonth: {
    sales: number;
    invoices: number;
    paidInvoices: number;
    growth: number;
  };
  pendingInvoices: number;
  expenses: number;
  profit: number;
  collectionRate: number;
}
