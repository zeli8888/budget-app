import axios, { AxiosInstance } from 'axios';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface Transaction {
  id: number;
  user_id: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category: string;
  payment_method: string;
  transaction_at: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category: string;
  payment_method: string;
  transaction_at: string;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionInput {
  amount?: number;
  currency?: string;
  type?: 'income' | 'expense';
  category?: string;
  payment_method?: string;
  transaction_at?: string;
  metadata?: Record<string, any>;
}

export interface TransactionListResponse {
  data: Transaction[];
  next_cursor: number | null;
}

export interface StatsSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  currency: string;
}

export interface CategoryStat {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface CategoryBreakdownResponse {
  data: CategoryStat[];
  type: 'income' | 'expense';
}

// Transaction API
export const transactionApi = {
  create: async (data: CreateTransactionInput): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  list: async (params?: {
    start_date?: string;
    end_date?: string;
    type?: string;
    category?: string;
    limit?: number;
    cursor?: number;
  }): Promise<TransactionListResponse> => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  get: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateTransactionInput): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

// Stats API
export const statsApi = {
  getSummary: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<StatsSummary> => {
    const response = await api.get('/stats/summary', { params });
    return response.data;
  },

  getCategoryBreakdown: async (params?: {
    start_date?: string;
    end_date?: string;
    type?: string;
  }): Promise<CategoryBreakdownResponse> => {
    const response = await api.get('/stats/category', { params });
    return response.data;
  },
};

export default api;
