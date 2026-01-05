import React from 'react';
import { Transaction } from '../services/api';
import { format } from 'date-fns';
import './TransactionList.css';

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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {transactions.map((tx) => (
        <div key={tx.id} className={`transaction-item ${tx.type}`}>
          <div className="transaction-main">
            <div className="transaction-category">
              <span className="category-icon">
                {tx.type === 'income' ? '📈' : '📉'}
              </span>
              <div>
                <div className="category-name">{tx.category}</div>
                <div className="transaction-date">
                  {format(new Date(tx.transaction_at), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="transaction-details">
              <div className={`transaction-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'}
                {formatAmount(tx.amount, tx.currency)}
              </div>
              <div className="transaction-method">{tx.payment_method}</div>
            </div>
          </div>
          {tx.metadata?.description && (
            <div className="transaction-description">{tx.metadata.description}</div>
          )}
          {tx.metadata?.tags && tx.metadata.tags.length > 0 && (
            <div className="transaction-tags">
              {tx.metadata.tags.map((tag: string, index: number) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="transaction-actions">
            <button className="btn-icon" onClick={() => onEdit(tx)} title="Edit">
              ✏️
            </button>
            <button
              className="btn-icon"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this transaction?')) {
                  onDelete(tx.id);
                }
              }}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
