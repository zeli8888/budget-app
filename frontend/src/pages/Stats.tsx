import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { statsApi, StatsSummary, CategoryStat } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import './Stats.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const COLORS = [
  '#1976d2',
  '#388e3c',
  '#d32f2f',
  '#f57c00',
  '#7b1fa2',
  '#0097a7',
  '#c2185b',
  '#512da8',
];

const formatAmount = (amount: number, currency: string): string => {
  const value = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

const Stats: React.FC = () => {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statsType, setStatsType] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [summaryData, categoryData] = await Promise.all([
          statsApi.getSummary({ start_date: startDate, end_date: endDate }),
          statsApi.getCategoryBreakdown({
            start_date: startDate,
            end_date: endDate,
            type: statsType,
          }),
        ]);

        setSummary(summaryData);
        setCategoryStats(categoryData.data || []);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate, statsType]);

  const setPresetRange = (months: number) => {
    const now = new Date();
    if (months === 0) {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else {
      const start = subMonths(now, months);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    }
  };

  const pieData = {
    labels: categoryStats.map((s) => s.category),
    datasets: [
      {
        data: categoryStats.map((s) => s.total / 100),
        backgroundColor: COLORS.slice(0, categoryStats.length),
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: categoryStats.map((s) => s.category),
    datasets: [
      {
        label: statsType === 'expense' ? 'Expenses' : 'Income',
        data: categoryStats.map((s) => s.total / 100),
        backgroundColor: statsType === 'expense' ? '#d32f2f' : '#388e3c',
      },
    ],
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <h1>Statistics</h1>

      <div className="stats-controls card">
        <div className="date-range">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="preset-buttons">
          <button className="btn btn-secondary" onClick={() => setPresetRange(0)}>
            This Month
          </button>
          <button className="btn btn-secondary" onClick={() => setPresetRange(3)}>
            Last 3 Months
          </button>
          <button className="btn btn-secondary" onClick={() => setPresetRange(6)}>
            Last 6 Months
          </button>
          <button className="btn btn-secondary" onClick={() => setPresetRange(12)}>
            Last Year
          </button>
        </div>
      </div>

      {summary && (
        <div className="summary-section">
          <div className="summary-grid">
            <div className="stat-card income">
              <div className="stat-label">Total Income</div>
              <div className="stat-value">
                {formatAmount(summary.total_income, summary.currency)}
              </div>
            </div>
            <div className="stat-card expense">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">
                {formatAmount(summary.total_expense, summary.currency)}
              </div>
            </div>
            <div className="stat-card balance">
              <div className="stat-label">Net Balance</div>
              <div className={`stat-value ${summary.net_balance >= 0 ? 'positive' : 'negative'}`}>
                {formatAmount(summary.net_balance, summary.currency)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="charts-section">
        <div className="chart-header">
          <h2>Category Breakdown</h2>
          <div className="type-toggle">
            <button
              className={`toggle-btn ${statsType === 'expense' ? 'active' : ''}`}
              onClick={() => setStatsType('expense')}
            >
              Expenses
            </button>
            <button
              className={`toggle-btn ${statsType === 'income' ? 'active' : ''}`}
              onClick={() => setStatsType('income')}
            >
              Income
            </button>
          </div>
        </div>

        {categoryStats.length === 0 ? (
          <div className="empty-state card">
            <p>No data available for the selected period</p>
          </div>
        ) : (
          <div className="charts-grid">
            <div className="chart-card card">
              <h3>Distribution</h3>
              <div className="pie-container">
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="chart-card card">
              <h3>By Category</h3>
              <div className="bar-container">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {categoryStats.length > 0 && (
          <div className="category-table card">
            <h3>Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Percentage</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((stat, index) => (
                  <tr key={stat.category}>
                    <td>
                      <span
                        className="color-dot"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      {stat.category}
                    </td>
                    <td>{formatAmount(stat.total, 'EUR')}</td>
                    <td>{stat.percentage.toFixed(1)}%</td>
                    <td>{stat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
