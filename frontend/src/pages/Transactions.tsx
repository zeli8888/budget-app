import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  transactionApi,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../services/api';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { usePreference } from '../contexts/PreferenceContext';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { currencyOptions, categoryOptions, paymentOptions, loadPreferences } = usePreference();

  // Helper to determine which categories to show in the filter
  const activeCategoryOptions = useMemo(() => {
    if (typeFilter === 'income') return categoryOptions.income;
    if (typeFilter === 'expense') return categoryOptions.expense;

    // If "All", merge and deduplicate by label/value
    const all = [...categoryOptions.income, ...categoryOptions.expense];
    // Since value and label are the same, we filter the array to unique values
    const uniqueValues = Array.from(new Set(all.map(opt => opt.value)));
    return uniqueValues.map(val => ({ value: val, label: val }));
  }, [typeFilter, categoryOptions]);

  const fetchTransactions = useCallback(async (cursor?: number) => {
    try {
      const params: any = { limit: 20 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (typeFilter) params.type = typeFilter;
      if (currencyFilter) params.currency = currencyFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (paymentFilter) params.payment_method = paymentFilter;
      if (cursor) params.cursor = cursor;

      const response = await transactionApi.list(params);

      if (cursor) {
        setTransactions((prev) => [...prev, ...(response.data || [])]);
      } else {
        setTransactions(response.data || []);
      }
      setNextCursor(response.next_cursor);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [startDate, endDate, typeFilter, currencyFilter, categoryFilter, paymentFilter]);

  useEffect(() => {
    setLoading(true);
    fetchTransactions().finally(() => setLoading(false));
  }, [fetchTransactions]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchTransactions(nextCursor);
    setLoadingMore(false);
  };

  const handleCreate = async (data: CreateTransactionInput) => {
    await transactionApi.create(data);
    setShowForm(false);
    setLoading(true);
    await Promise.all([fetchTransactions(), loadPreferences()]);
    setLoading(false);
  };

  const handleUpdate = async (data: UpdateTransactionInput) => {
    if (!editingTransaction) return;
    await transactionApi.update(editingTransaction.id, data);
    setEditingTransaction(null);
    setLoading(true);
    await Promise.all([fetchTransactions(), loadPreferences()]);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await transactionApi.delete(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('');
    setCurrencyFilter('');
    setCategoryFilter('');
    setPaymentFilter('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        {!showForm && !editingTransaction && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </button>
        )}
      </div>

      {(showForm || editingTransaction) && (
        <TransactionForm
          onSubmit={(data: any) =>
            editingTransaction ? handleUpdate(data) : handleCreate(data)
          }
          initialData={editingTransaction || undefined}
          onCancel={handleCancelForm}
        />
      )}

      {(!showForm && !editingTransaction) && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCategoryFilter(''); // Reset category when type changes
                  }}
                  className="form-input"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="form-label">Currency</label>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Currencies</option>
                  {currencyOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Categories</option>
                  {activeCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Methods</option>
                  {paymentOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                onClick={clearFilters}
              >
                Clear All Filters
              </button>
            </div>
          </div>

          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />

          {nextCursor && (
            <div className="text-center">
              <button
                className="btn btn-outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;