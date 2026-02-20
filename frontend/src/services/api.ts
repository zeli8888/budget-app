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
  amount: number; // Stored in cents in DB, but represented as number here
  currency: string;
  type: 'income' | 'expense';
  category: string;
  payment_method: string;
  transaction_at: string; // ISO 8601 string
  metadata: Record<string, any>;
}

export interface CreateTransactionInput {
  amount: number; // Input as float (e.g. 10.50), backend converts to cents
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
  // Backend returns map[string][]*CategoryStat (Keyed by Currency Code)
  data: Record<string, CategoryStat[]>;
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
    type?: 'income' | 'expense';
    category?: string;
    payment_method?: string;
    currency?: string;
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
  }): Promise<StatsSummary[]> => {
    // Backend returns []*StatsSummary (Array of summaries)
    const response = await api.get('/stats/summary', { params });
    return response.data;
  },

  getCategoryBreakdown: async (params?: {
    start_date?: string;
    end_date?: string;
    type?: 'income' | 'expense';
  }): Promise<CategoryBreakdownResponse> => {
    const response = await api.get('/stats/category', { params });
    return response.data;
  },
};

// Types
export interface Currency {
  id: number;
  user_id: string;
  code: string;
}

export interface CreateCurrencyInput {
  code: string;
}

export interface UpdateCurrencyInput {
  code?: string;
}

export interface CurrencyListResponse {
  data: Currency[];
}

// Currency API
export const currencyApi = {
  create: async (data: CreateCurrencyInput): Promise<Currency> => {
    const response = await api.post('/currencies', data);
    return response.data;
  },

  list: async (): Promise<CurrencyListResponse> => {
    const response = await api.get('/currencies');
    return response.data;
  },

  get: async (id: number): Promise<Currency> => {
    const response = await api.get(`/currencies/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateCurrencyInput): Promise<Currency> => {
    const response = await api.put(`/currencies/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/currencies/${id}`);
  },
};

// Types
export interface Category {
  id: number;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface CreateCategoryInput {
  name: string;
  type: 'income' | 'expense';
}

export interface UpdateCategoryInput {
  name?: string;
  type?: 'income' | 'expense';
}

export interface CategoryListResponse {
  data: Category[];
}

// Category API
export const categoryApi = {
  create: async (data: CreateCategoryInput): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  list: async (params?: {
    type?: 'income' | 'expense';
  }): Promise<CategoryListResponse> => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  get: async (id: number): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryInput): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// Types
export interface Account {
  id: number;
  user_id: string;
  name: string;
  currency: string;
  balance: number;
}

export interface CreateAccountInput {
  name: string;
  currency: string;
  balance: number;
}

export interface UpdateAccountInput {
  name?: string;
  currency?: string;
  balance?: number;
}

export interface AccountListResponse {
  data: Account[];
}

// Account API
export const accountApi = {
  create: async (data: CreateAccountInput): Promise<Account> => {
    const response = await api.post('/accounts', data);
    return response.data;
  },

  list: async (): Promise<AccountListResponse> => {
    const response = await api.get('/accounts');
    return response.data;
  },

  get: async (id: number): Promise<Account> => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateAccountInput): Promise<Account> => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },
};

export default api;
