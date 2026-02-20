import React, { useState, useEffect } from 'react';
import { CreateTransactionInput, Transaction, UpdateTransactionInput } from '../services/api';
import CreatableSelect from 'react-select/creatable';
import { creatableSelectStyles } from './utils';
import { usePreference } from '../contexts/PreferenceContext';

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  initialData?: Transaction;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData ? (initialData.amount / 100).toString() : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'EUR');
  const [category, setCategory] = useState(initialData?.category || (type === 'expense' ? 'Food' : 'Salary'));
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || 'Revolut');
  const [transactionAt, setTransactionAt] = useState(
    initialData ? initialData.transaction_at.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(initialData?.metadata?.description || '');
  const [tags, setTags] = useState(initialData?.metadata?.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currencyOptions, categoryOptions, paymentOptions } = usePreference();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const metadata: Record<string, any> = {};
      if (description) metadata.description = description;
      if (tags) metadata.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);

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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {initialData ? 'Edit Transaction' : 'New Transaction'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="form-label">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 py-3 px-4 rounded-lg font-medium border-2 transition-all ${type === 'expense'
              ? 'border-danger-500 bg-danger-50 text-danger-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            onClick={() => setType('expense')}
          >
            📉 Expense
          </button>
          <button
            type="button"
            className={`flex-1 py-3 px-4 rounded-lg font-medium border-2 transition-all ${type === 'income'
              ? 'border-success-500 bg-success-50 text-success-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            onClick={() => setType('income')}
          >
            📈 Income
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="form-input"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="form-label">Currency</label>
          <CreatableSelect
            isClearable
            options={currencyOptions}
            value={currencyOptions.find(opt => opt.value === currency) || (currency ? { value: currency, label: currency } : null)}
            onChange={(newValue) => setCurrency(newValue ? newValue.value.toUpperCase() : '')}
            placeholder="Select..."
            classNames={creatableSelectStyles}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Category</label>
          <CreatableSelect
            isClearable
            options={categoryOptions[type]}
            value={categoryOptions[type].find(opt => opt.value === category) || (category ? { value: category, label: category } : null)}
            onChange={(newValue) => setCategory(newValue ? newValue.value : '')}
            placeholder="Select..."
            classNames={creatableSelectStyles}
          />
        </div>
        <div>
          <label className="form-label">Payment Method</label>
          <CreatableSelect
            isClearable
            options={paymentOptions}
            value={paymentOptions.find(opt => opt.value === paymentMethod) || (paymentMethod ? { value: paymentMethod, label: paymentMethod } : null)}
            onChange={(newValue) => setPaymentMethod(newValue ? newValue.value : '')}
            placeholder="Select..."
            classNames={creatableSelectStyles}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label">Date</label>
        <input
          type="date"
          value={transactionAt}
          onChange={(e) => setTransactionAt(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="form-input resize-none"
        />
      </div>

      <div className="mb-6">
        <label className="form-label">Tags (optional, comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., groceries, weekly"
          className="form-input"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : initialData ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
