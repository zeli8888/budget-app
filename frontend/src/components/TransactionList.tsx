import React from 'react';
import { Transaction } from '../services/api';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

const formatAmount = (amount: number, currency: string): string => {
  const value = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className={`bg-white rounded-xl shadow-sm p-4 border-l-4 hover:shadow-md transition-shadow group ${
            tx.type === 'income' ? 'border-success-500' : 'border-danger-500'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
              }`}>
                <span className="text-lg">{tx.type === 'income' ? '📈' : '📉'}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{tx.category}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(tx.transaction_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`font-semibold ${tx.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatAmount(tx.amount, tx.currency)}
                </p>
                <p className="text-xs text-gray-500">{tx.payment_method}</p>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(tx)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this transaction?')) {
                      onDelete(tx.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {(tx.metadata?.description || (tx.metadata?.tags && tx.metadata.tags.length > 0)) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {tx.metadata?.description && (
                <p className="text-sm text-gray-600">{tx.metadata.description}</p>
              )}
              {tx.metadata?.tags && tx.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tx.metadata.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
