import React, { useEffect, useState, useMemo } from 'react';
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
import { formatAmount } from '../components/utils';
import { usePreference } from '../contexts/PreferenceContext';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import CurrencySwitcher from '../components/CurrencySwitcher';
import ExchangeToggle from '../components/ExchangeToggle';

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

const Stats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statsType, setStatsType] = useState<'expense' | 'income'>('expense');
  const [statsSummaryResponse, setStatsSummaryResponse] = useState<StatsSummary[]>([]);
  const [statsCategoryResponse, setStatsCategoryResponse] = useState<Record<string, CategoryStat[]>>({});
  const [convertAll, setConvertAll] = useState(false);
  const { currency } = usePreference();
  const { convert, isRateSet } = useExchangeRate();

  // Calculate summary based on conversion mode
  const summary = useMemo(() => {
    if (!statsSummaryResponse || statsSummaryResponse.length === 0) return null;

    if (!convertAll) {
      return statsSummaryResponse.find(s => s.currency === currency) || null;
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let allRatesAvailable = true;

    statsSummaryResponse.forEach(s => {
      if (s.currency === currency) {
        totalIncome += s.total_income;
        totalExpense += s.total_expense;
      } else if (isRateSet(s.currency) && isRateSet(currency)) {
        totalIncome += convert(s.total_income, s.currency, currency);
        totalExpense += convert(s.total_expense, s.currency, currency);
      } else {
        allRatesAvailable = false;
      }
    });

    if (!allRatesAvailable) {
      return statsSummaryResponse.find(s => s.currency === currency) || null;
    }

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_balance: totalIncome - totalExpense,
      currency: currency,
    };
  }, [statsSummaryResponse, currency, convertAll, convert, isRateSet]);

  // Calculate category stats based on conversion mode
  const categoryStats = useMemo(() => {
    if (!convertAll) {
      return statsCategoryResponse[currency] || [];
    }

    // Merge all currency category stats into one
    const mergedStats: Record<string, { total: number; count: number }> = {};
    let allRatesAvailable = true;

    Object.entries(statsCategoryResponse).forEach(([curr, stats]) => {
      stats.forEach(stat => {
        if (!mergedStats[stat.category]) {
          mergedStats[stat.category] = { total: 0, count: 0 };
        }

        if (curr === currency) {
          mergedStats[stat.category].total += stat.total;
          mergedStats[stat.category].count += stat.count;
        } else if (isRateSet(curr) && isRateSet(currency)) {
          mergedStats[stat.category].total += convert(stat.total, curr, currency);
          mergedStats[stat.category].count += stat.count;
        } else {
          allRatesAvailable = false;
        }
      });
    });

    if (!allRatesAvailable) {
      return statsCategoryResponse[currency] || [];
    }

    // Calculate percentages
    const totalAmount = Object.values(mergedStats).reduce((sum, s) => sum + s.total, 0);
    const result: CategoryStat[] = Object.entries(mergedStats).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
    }));

    // Sort by total descending
    return result.sort((a, b) => b.total - a.total);
  }, [statsCategoryResponse, currency, convertAll, convert, isRateSet]);

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

        setStatsSummaryResponse(summaryData);
        setStatsCategoryResponse(categoryData.data || {});
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

  const pieData = useMemo(() => {
    const MAX_COLORS = COLORS.length;
    const needsGrouping = categoryStats.length > MAX_COLORS;

    const displayStats = needsGrouping
      ? [
        ...categoryStats.slice(0, MAX_COLORS - 1),
        {
          category: 'Other',
          total: categoryStats.slice(MAX_COLORS - 1).reduce((sum, s) => sum + s.total, 0)
        }
      ]
      : categoryStats;

    return {
      labels: displayStats.map((s) => s.category),
      datasets: [
        {
          data: displayStats.map((s) => s.total / 100),
          backgroundColor: COLORS.slice(0, displayStats.length),
          borderWidth: 0,
        },
      ],
    };
  }, [categoryStats]);

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
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ExchangeToggle enabled={convertAll} onToggle={setConvertAll} />
          <CurrencySwitcher />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline text-sm py-2" onClick={() => setPresetRange(0)}>
            This Month
          </button>
          <button className="btn btn-outline text-sm py-2" onClick={() => setPresetRange(3)}>
            Last 3 Months
          </button>
          <button className="btn btn-outline text-sm py-2" onClick={() => setPresetRange(6)}>
            Last 6 Months
          </button>
          <button className="btn btn-outline text-sm py-2" onClick={() => setPresetRange(12)}>
            Last Year
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total Income {convertAll && <span className="text-xs">(converted)</span>}
            </p>
            <p className="text-2xl font-bold text-success-600">
              {formatAmount(summary.total_income, summary.currency)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total Expenses {convertAll && <span className="text-xs">(converted)</span>}
            </p>
            <p className="text-2xl font-bold text-danger-600">
              {formatAmount(summary.total_expense, summary.currency)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Net Balance {convertAll && <span className="text-xs">(converted)</span>}
            </p>
            <p className={`text-2xl font-bold ${summary.net_balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {formatAmount(summary.net_balance, summary.currency)}
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Category Breakdown {convertAll && <span className="text-sm font-normal text-gray-500">(all currencies converted)</span>}
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statsType === 'expense'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setStatsType('expense')}
            >
              Expenses
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statsType === 'income'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setStatsType('income')}
            >
              Income
            </button>
          </div>
        </div>

        {categoryStats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <p className="text-gray-500">No data available for the selected period</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution</h3>
                <div className="h-72">
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

              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">By Category</h3>
                <div className="h-72">
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

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-900">Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryStats.map((stat, index) => (
                      <tr key={stat.category} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></span>
                            <span className="font-medium text-gray-900">{stat.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {formatAmount(stat.total, currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {stat.percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {stat.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Stats;
