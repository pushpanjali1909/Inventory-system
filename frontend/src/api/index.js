import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Products
export const productsApi = {
  getAll: (params) => api.get('/products/', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  restock: (id, data) => api.post(`/products/${id}/restock`, data),
  getCategories: () => api.get('/products/categories/list'),
};

// Customers
export const customersApi = {
  getAll: (params) => api.get('/customers/', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Orders
export const ordersApi = {
  getAll: (params) => api.get('/orders/', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders/', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  getStats: () => api.get('/orders/stats/summary'),
};

// Inventory
export const inventoryApi = {
  getLogs: (params) => api.get('/inventory/logs', { params }),
  adjust: (productId, data) => api.post(`/inventory/adjust/${productId}`, data),
  getSummary: () => api.get('/inventory/summary'),
};

export default api;
