import api from './index';

export interface LoginData { email: string; password: string }
export interface RegisterData { email: string; password: string; name: string; businessName: string }

export const authApi = {
  login: (data: LoginData) => api.post('/auth/login', data),
  register: (data: RegisterData) => api.post('/auth/register', data),
};

export const businessApi = {
  get: () => api.get('/business'),
  update: (data: any) => api.put('/business', data),
};

export const clientApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const productApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getByBarcode: (code: string) => api.get(`/products/barcode/${code}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  updateStock: (id: string, data: { quantity: number; type: 'IN' | 'OUT'; reference: string }) =>
    api.put(`/products/stock/${id}`, data),
};

export const invoiceApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  updateStatus: (id: string, data: { status: string }) => api.put(`/invoices/${id}/status`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
};

export const paymentApi = {
  getAll: (params?: { page?: number; limit?: number }) => api.get('/payments', { params }),
  create: (data: any) => api.post('/payments', data),
  getOutstanding: () => api.get('/payments/outstanding'),
};

export const expenseApi = {
  getAll: (params?: { page?: number; limit?: number; categoryId?: string }) =>
    api.get('/expenses', { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const categoryApi = {
  getProductCategories: () => api.get('/categories/product'),
  createProductCategory: (data: { name: string; description?: string }) =>
    api.post('/categories/product', data),
  getExpenseCategories: () => api.get('/categories/expense'),
  createExpenseCategory: (data: { name: string }) => api.post('/categories/expense', data),
};

export const reportApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/sales', { params }),
  getGST: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/gst', { params }),
  getProfitLoss: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/profit-loss', { params }),
};
