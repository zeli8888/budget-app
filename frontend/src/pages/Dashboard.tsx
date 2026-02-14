import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi, StatsSummary, transactionApi, Transaction } from '../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">{format(new Date(), 'MMMM yyyy')} Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-success-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-success-600">
                {summary ? formatAmount(summary.total_income, summary.currency) : '$0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-danger-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📉</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-danger-600">
                {summary ? formatAmount(summary.total_expense, summary.currency) : '$0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-primary-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Net Balance</p>
              <p className={`text-2xl font-bold ${summary && summary.net_balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {summary ? formatAmount(summary.net_balance, summary.currency) : '$0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link
            to="/transactions"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            View All →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <Link to="/transactions" className="btn btn-primary">
              Add Your First Transaction
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-4">
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
                <p className={`font-semibold ${tx.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatAmount(tx.amount, tx.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/transactions"
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <span className="text-2xl">➕</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Add Transaction</p>
            <p className="text-sm text-gray-500">Record income or expense</p>
          </div>
        </Link>

        <Link
          to="/stats"
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">View Statistics</p>
            <p className="text-sm text-gray-500">Analyze your spending</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
