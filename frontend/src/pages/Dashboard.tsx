import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi, StatsSummary, transactionApi, Transaction } from '../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import './Dashboard.css';

const formatAmount = (amount: number, currency: string): string => {
  const value = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

        const [summaryData, transactionsData] = await Promise.all([
          statsApi.getSummary({ start_date: startDate, end_date: endDate }),
          transactionApi.list({ limit: 5 }),
        ]);

        setSummary(summaryData);
        setRecentTransactions(transactionsData.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="subtitle">
        {format(new Date(), 'MMMM yyyy')} Overview
      </p>

      <div className="summary-cards">
        <div className="summary-card income">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-label">Total Income</div>
            <div className="card-value">
              {summary ? formatAmount(summary.total_income, summary.currency) : '$0.00'}
            </div>
          </div>
        </div>

        <div className="summary-card expense">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <div className="card-label">Total Expenses</div>
            <div className="card-value">
              {summary ? formatAmount(summary.total_expense, summary.currency) : '$0.00'}
            </div>
          </div>
        </div>

        <div className="summary-card balance">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Net Balance</div>
            <div className={`card-value ${summary && summary.net_balance >= 0 ? 'positive' : 'negative'}`}>
              {summary ? formatAmount(summary.net_balance, summary.currency) : '$0.00'}
            </div>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <Link to="/transactions" className="view-all">
            View All →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions yet</p>
            <Link to="/transactions" className="btn btn-primary">
              Add Your First Transaction
            </Link>
          </div>
        ) : (
          <div className="recent-list">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="recent-item">
                <div className="recent-info">
                  <span className="recent-icon">
                    {tx.type === 'income' ? '📈' : '📉'}
                  </span>
                  <div>
                    <div className="recent-category">{tx.category}</div>
                    <div className="recent-date">
                      {format(new Date(tx.transaction_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className={`recent-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatAmount(tx.amount, tx.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <Link to="/transactions" className="action-card">
          <span className="action-icon">➕</span>
          <span>Add Transaction</span>
        </Link>
        <Link to="/stats" className="action-card">
          <span className="action-icon">📊</span>
          <span>View Statistics</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
