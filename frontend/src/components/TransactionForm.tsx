import React, { useState, useEffect } from 'react';
import { CreateTransactionInput, Transaction, UpdateTransactionInput } from '../services/api';
import './TransactionForm.css';

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  initialData?: Transaction;
  onCancel: () => void;
}

const CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'],
};

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Alipay', 'WeChat Pay', 'Other'];

const CURRENCIES = ['EUR', 'EUR', 'GBP', 'CNY', 'JPY'];

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData ? (initialData.amount / 100).toString() : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'EUR');
  const [category, setCategory] = useState(initialData?.category || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || 'Cash');
  const [transactionAt, setTransactionAt] = useState(
    initialData ? initialData.transaction_at.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(initialData?.metadata?.description || '');
  const [tags, setTags] = useState(initialData?.metadata?.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialData && !CATEGORIES[type].includes(category)) {
      setCategory(CATEGORIES[type][0]);
    }
  }, [type, category, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const metadata: Record<string, any> = {};
      if (description) metadata.description = description;
      if (tags) metadata.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);

      const data: CreateTransactionInput = {
        amount: parseFloat(amount),
        currency,
        type,
        category,
        payment_method: paymentMethod,
        transaction_at: transactionAt,
        metadata,
      };

      await onSubmit(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>{initialData ? 'Edit Transaction' : 'New Transaction'}</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label>Type</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`type-btn ${type === 'income' ? 'active income' : ''}`}
              onClick={() => setType('income')}
            >
              Income
            </button>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="form-group">
          <label>Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select category</option>
            {CATEGORIES[type].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          value={transactionAt}
          onChange={(e) => setTransactionAt(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a note..."
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>Tags (optional, comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., groceries, weekly"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
