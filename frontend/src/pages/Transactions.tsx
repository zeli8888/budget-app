import React, { useEffect, useState, useCallback } from 'react';
import {
  transactionApi,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../services/api';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import './Transactions.css';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
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
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        {!showForm && !editingTransaction && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Transaction
          </button>
        )}
      </div>

      {(showForm || editingTransaction) && (
        <TransactionForm
          onSubmit={editingTransaction ? handleUpdate : handleCreate}
          initialData={editingTransaction || undefined}
          onCancel={handleCancelForm}
        />
      )}

      <div className="filters card">
        <div className="filter-row">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setTypeFilter('');
            }}
          >
            Clear
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
        <div className="load-more">
          <button
            className="btn btn-secondary"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Transactions;
