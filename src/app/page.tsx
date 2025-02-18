'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as ReChartsPieChart, Pie, Cell } from 'recharts';
import { CATEGORIES, CATEGORY_COLORS, Category, Transaction, Budget } from '@/types';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState<Category>('Other');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [_error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  // Memoize monthly data calculations
  const monthlyData = useMemo(() => {
    return transactions.reduce((acc: { month: string, expenses: number, income: number, net: number }[], transaction) => {
      const date = new Date(transaction.date);
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const existingMonth = acc.find(item => item.month === month);
      if (existingMonth) {
        existingMonth.expenses += transaction.amount < 0 ? Math.abs(transaction.amount) : 0;
        existingMonth.income += transaction.amount > 0 ? transaction.amount : 0;
        existingMonth.net += transaction.amount;
      } else {
        acc.push({
          month,
          expenses: transaction.amount < 0 ? Math.abs(transaction.amount) : 0,
          income: transaction.amount > 0 ? transaction.amount : 0,
          net: transaction.amount
        });
      }
      return acc;
    }, []).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });
  }, [transactions]);

  // Memoize category data calculations
  const monthlyCategoryData = useMemo(() => {
    const selectedDate = new Date(selectedMonth);
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === selectedDate.getMonth() &&
             transactionDate.getFullYear() === selectedDate.getFullYear() &&
             t.amount < 0;
    });

    return Object.entries(
      filteredTransactions.reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {})
    ).map(([name, value]) => ({
      name,
      value,
      fill: CATEGORY_COLORS[name as Category]
    }));
  }, [transactions, selectedMonth]);

  // Memoize total calculations
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    };
  }, [transactions]);

  const fetchTransactions = async (pageNum = 1, append = false) => {
    try {
      setError(null);
      const response = await fetch(`/api/transactions?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setHasMore(data.length === ITEMS_PER_PAGE);
      setTransactions(prev => append ? [...prev, ...data] : data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch transactions');
    }
  };

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchTransactions(page + 1, true);
    }
  }, [hasMore, loading, page]);

  useEffect(() => {
    fetchTransactions();
    fetchBudgets();
  }, [selectedMonth]);

  const fetchBudgets = async () => {
    try {
      const response = await fetch(`/api/budgets?month=${selectedMonth}`);
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Convert date string to ISO format
      const transactionDate = new Date(date);
      transactionDate.setHours(12); // Set to noon to avoid timezone issues
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          description,
          category,
          date: transactionDate.toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create transaction');
      }

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('Other');
      setDate(new Date().toISOString().slice(0, 10));
      
      // Refresh data
      await fetchTransactions();
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetUpdate = async (category: Category, amount: number) => {
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          amount,
          month: selectedMonth,
        }),
      });
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(budgetAmount),
          category: budgetCategory,
          month: selectedMonth,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add budget');
      }

      setBudgetAmount('');
      setBudgetCategory('Other');
      await fetchBudgets();
    } catch (error) {
      console.error('Error adding budget:', error);
      setError('Failed to add budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(id);
      setError(null);
      
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      await fetchTransactions(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Calculate overall category-wise spending (all time)
  const categorySpending = useMemo(() => {
    // Filter transactions for expenses only (negative amounts)
    const expenses = transactions.filter(t => t.amount < 0);
    
    // Initialize all categories with 0
    const initialSpending = CATEGORIES.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    // Calculate spending for each category
    const spendingByCategory = expenses.reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, initialSpending);

    // Convert to array format for Recharts
    return Object.entries(spendingByCategory)
      .map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name as Category]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Calculate budget vs actual
  const budgetComparison = useMemo(() => {
    // Get transactions for the selected month only
    const monthStart = new Date(selectedMonth + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd && t.amount < 0;
    });

    return CATEGORIES.map(category => {
      // Get budget for this category
      const budget = budgets.find(b => b.category === category)?.amount || 0;
      
      // Calculate actual spending (use absolute values)
      const actual = monthlyTransactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        category,
        budget,
        actual,
        remaining: budget - actual,
        color: CATEGORY_COLORS[category]
      };
    })
    .filter(item => item.budget > 0 || item.actual > 0) // Only show categories with budget or spending
    .sort((a, b) => b.actual - a.actual); // Sort by actual spending
  }, [transactions, budgets, selectedMonth]);

  // Spending insights
  const insights = budgetComparison
    .filter(item => item.budget > 0)
    .map(item => {
      if (item.actual > item.budget) {
        return `You've exceeded your ${item.category} budget by ${formatCurrency(item.actual - item.budget)}`;
      } else if (item.actual > item.budget * 0.8) {
        return `You're close to your ${item.category} budget (${(item.actual / item.budget * 100).toFixed(1)}% used)`;
      }
      return null;
    })
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Personal Finance Tracker
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Balance</h3>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(balance)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Income</h3>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500 mt-2">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Expenses</h3>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500 mt-2">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Transaction Form */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Transaction
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter amount (use negative for expenses)"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {loading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </form>
          </div>

          {/* Spending by Category (All Time) */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Overall Spending by Category
              </div>
            </h2>
            <div className="h-[400px] w-full relative">
              {categorySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsPieChart>
                    <Pie
                      data={categorySpending}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(Math.abs(value))}
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#F9FAFB'
                      }}
                    />
                  </ReChartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No spending data available
                </div>
              )}
            </div>
            
            {/* Category List with Percentages */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {categorySpending
                .sort((a, b) => b.value - a.value)
                .map((category) => {
                  const total = categorySpending.reduce((sum, cat) => sum + cat.value, 0);
                  const percentage = ((category.value / total) * 100).toFixed(1);
                  
                  return (
                    <div key={category.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.fill }}
                        />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{category.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(Math.abs(category.value))}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Add Budget */}
        <div className="mt-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Monthly Budget
          </h2>
          <form onSubmit={handleAddBudget} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount
              </label>
              <input
                id="budgetAmount"
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Enter budget amount"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="budgetCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                id="budgetCategory"
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value as Category)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? 'Adding...' : '+ Add Budget'}
            </Button>
          </form>
        </div>

        {/* Monthly Category Distribution */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Monthly Category Distribution
            </h2>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
            
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[400px] w-full">
              {monthlyCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsPieChart>
                    <Pie
                      data={monthlyCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={130}
                      paddingAngle={3}
                    >
                      {monthlyCategoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(Math.abs(value))}
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#F9FAFB',
                        padding: '8px 12px'
                      }}
                    />
                  </ReChartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No spending data for {selectedMonth}
                </div>
              )}
            </div>
            
            {/* Monthly Category List */}
            <div className="space-y-3">
              {monthlyCategoryData
                .sort((a, b) => b.value - a.value)
                .map((category) => {
                  const total = monthlyCategoryData.reduce((sum, cat) => sum + cat.value, 0);
                  const percentage = ((category.value / total) * 100).toFixed(1);
                  
                  return (
                    <div key={category.name} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.fill }}
                        />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(Math.abs(category.value))}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Budget vs Actual */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Budget vs Actual</h2>
          <div className="space-y-4">
            {budgetComparison.length > 0 ? (
              budgetComparison.map(({ category, budget, actual, remaining, color }) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(actual)} of {formatCurrency(budget)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {budget > 0 && (
                      <div
                        className="absolute h-full rounded-full transition-all duration-500 ease-in-out"
                        style={{
                          width: `${Math.min((actual / budget) * 100, 100)}%`,
                          backgroundColor: color,
                          opacity: actual > budget ? '0.8' : '1'
                        }}
                      />
                    )}
                  </div>
                  <div className="text-sm text-right">
                    <span className={remaining >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {remaining >= 0 ? 'Remaining: ' : 'Over by: '}
                      {formatCurrency(Math.abs(remaining))}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No budget data available. Add budgets to see comparison.
              </div>
            )}
          </div>
        </div>

        {/* Spending Insights */}
        {insights.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Spending Insights</h2>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Monthly Expenses Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Monthly Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number, name: string) => [
                    `₹${value}`,
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction List */}
        <div 
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          onScroll={handleScroll}
          style={{ maxHeight: '600px', overflowY: 'auto' }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`text-lg ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(new Date(transaction.date))} • {transaction.category}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(transaction._id)}
                  disabled={deleteLoading === transaction._id}
                  className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading === transaction._id ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
            {hasMore && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
