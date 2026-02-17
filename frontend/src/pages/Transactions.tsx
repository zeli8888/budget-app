import React, { useEffect, useState, useCallback } from 'react';
import {
  transactionApi,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../services/api';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTransactions = useCallback(async (cursor?: number) => {
    try {
      const params: any = { limit: 20 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (typeFilter) params.type = typeFilter;
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
  }, [startDate, endDate, typeFilter]);

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
    await fetchTransactions();
    setLoading(false);
  };

  const handleUpdate = async (data: UpdateTransactionInput) => {
    if (!editingTransaction) return;
    await transactionApi.update(editingTransaction.id, data);
    setEditingTransaction(null);
    setLoading(true);
    await fetchTransactions();
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

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full sm:w-auto">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <label className="form-label">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <button
            className="btn btn-outline w-full sm:w-auto"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setTypeFilter('');
            }}
          >
            Clear Filters
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
  );
};

export default Transactions;
