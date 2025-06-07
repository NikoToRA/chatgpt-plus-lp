import axios from 'axios';
import { Customer, DashboardStats, AccountLinking, InvoiceRequest } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'https://chatgpt-plus-api.azurewebsites.net/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Customer APIs
export const customerApi = {
  getAll: async (): Promise<Customer[]> => {
    try {
      const response = await api.get('/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers from API:', error);
      
      // Try to load from localStorage as fallback
      const localCustomers = localStorage.getItem('customers');
      if (localCustomers) {
        return JSON.parse(localCustomers);
      }
      
      // If no local data, return empty array
      return [];
    }
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  linkAccount: async (linking: AccountLinking): Promise<void> => {
    await api.post(`/customers/${linking.customerId}/link`, linking);
  },
};

// Dashboard APIs
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentApplications: async (): Promise<Customer[]> => {
    const response = await api.get('/dashboard/recent');
    return response.data;
  },
};

// Invoice APIs
export const invoiceApi = {
  request: async (data: InvoiceRequest): Promise<{ invoiceNumber: string }> => {
    const response = await api.post('/invoices/request', data);
    return response.data;
  },
};

// Account APIs
export const accountApi = {
  provision: async (customerId: string): Promise<void> => {
    await api.post('/accounts/provision', { customerId });
  },

  getUsage: async (accountId: string): Promise<any> => {
    const response = await api.get(`/accounts/${accountId}/usage`);
    return response.data;
  },
};

export default api;