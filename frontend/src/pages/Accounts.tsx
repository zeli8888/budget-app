import React, { useState, useEffect, useMemo } from 'react';
import {
    currencyApi,
    categoryApi,
    accountApi,
    Currency,
    Category,
    Account,
} from '../services/api';
import CreatableSelect from 'react-select/creatable';
import { creatableSelectStyles, formatAmount } from '../components/utils';
import { usePreference } from '../contexts/PreferenceContext';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import CurrencySwitcher from '../components/CurrencySwitcher';
import { Link } from 'react-router-dom';
import ExchangeToggle from '../components/ExchangeToggle';

type TabType = 'accounts' | 'currencies' | 'categories';

const Accounts: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('accounts');
    const [loading, setLoading] = useState(true);

    const { currencyOptions, loadPreferences, currency: selectedCurrency, currencies, categories, accounts } = usePreference();
    const { convertAll, convert, currenciesNotSet, setCurrenciesNotSet } = useExchangeRate();

    // Form states
    const [showCurrencyForm, setShowCurrencyForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    // Currency form
    const [currencyCode, setCurrencyCode] = useState('');

    // Category form
    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');

    // Account form
    const [accountName, setAccountName] = useState('');
    const [accountCurrency, setAccountCurrency] = useState('EUR');
    const [accountBalance, setAccountBalance] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            await loadPreferences();
        } catch (error) {
            console.error('Failed to fetch settings data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Currency handlers
    const handleCreateCurrency = async () => {
        if (!currencyCode.trim()) return;
        try {
            await currencyApi.create({ code: currencyCode.toUpperCase() });
            setCurrencyCode('');
            setShowCurrencyForm(false);
            await fetchData()
        } catch (error) {
            console.error('Failed to create currency:', error);
        }
    };

    const handleUpdateCurrency = async () => {
        if (!editingCurrency || !currencyCode.trim()) return;
        try {
            await currencyApi.update(editingCurrency.id, { code: currencyCode.toUpperCase() });
            setCurrencyCode('');
            setEditingCurrency(null);
            await fetchData()
        } catch (error) {
            console.error('Failed to update currency:', error);
        }
    };

    const handleDeleteCurrency = async (id: number) => {
        if (!confirm('Are you sure you want to delete this currency?')) return;
        try {
            await currencyApi.delete(id);
            await fetchData()
        } catch (error) {
            console.error('Failed to delete currency:', error);
        }
    };

    // Category handlers
    const handleCreateCategory = async () => {
        if (!categoryName.trim()) return;
        try {
            await categoryApi.create({ name: categoryName, type: categoryType });
            setCategoryName('');
            setCategoryType('expense');
            setShowCategoryForm(false);
            await fetchData()
        } catch (error) {
            console.error('Failed to create category:', error);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !categoryName.trim()) return;
        try {
            await categoryApi.update(editingCategory.id, { name: categoryName, type: categoryType });
            setCategoryName('');
            setCategoryType('expense');
            setEditingCategory(null);
            await fetchData()
        } catch (error) {
            console.error('Failed to update category:', error);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await categoryApi.delete(id);
            await fetchData()
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    // Account handlers
    const handleCreateAccount = async () => {
        if (!accountName.trim() || !accountCurrency) return;
        try {
            await accountApi.create({
                name: accountName,
                currency: accountCurrency,
                balance: Math.round(parseFloat(accountBalance || '0') * 100),
            });
            setAccountName('');
            setAccountCurrency('EUR');
            setAccountBalance('');
            setShowAccountForm(false);
            await fetchData()
        } catch (error) {
            console.error('Failed to create account:', error);
        }
    };

    const handleUpdateAccount = async () => {
        if (!editingAccount || !accountName.trim()) return;
        try {
            await accountApi.update(editingAccount.id, {
                name: accountName,
                currency: accountCurrency,
                balance: Math.round(parseFloat(accountBalance || '0') * 100),
            });
            setAccountName('');
            setAccountCurrency('EUR');
            setAccountBalance('');
            setEditingAccount(null);
            await fetchData()
        } catch (error) {
            console.error('Failed to update account:', error);
        }
    };

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            await accountApi.delete(id);
            await fetchData()
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    const startEditCurrency = (currency: Currency) => {
        setEditingCurrency(currency);
        setCurrencyCode(currency.code);
        setShowCurrencyForm(false);
    };

    const startEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setCategoryType(category.type);
        setShowCategoryForm(false);
    };

    const startEditAccount = (account: Account) => {
        setEditingAccount(account);
        setAccountName(account.name);
        setAccountCurrency(account.currency);
        setAccountBalance((account.balance / 100).toString());
        setShowAccountForm(false);
    };

    const cancelEdit = () => {
        setEditingCurrency(null);
        setEditingCategory(null);
        setEditingAccount(null);
        setShowCurrencyForm(false);
        setShowCategoryForm(false);
        setShowAccountForm(false);
        setCurrencyCode('');
        setCategoryName('');
        setCategoryType('expense');
        setAccountName('');
        setAccountCurrency('EUR');
        setAccountBalance('');
    };

    // Calculate balances for all currencies
    const balancesByCurrency = useMemo(() => {
        const balances: Record<string, number> = {};
        accounts.forEach(account => {
            balances[account.currency] = (balances[account.currency] || 0) + account.balance;
        });
        return balances;
    }, [accounts]);

    // Group accounts by name and convert balances if needed
    const { accountsByName, missingCurrencies, totalConverted } = useMemo(() => {
        let accountsByName: Record<string, Account[]> = {};
        let missingCurrencies: string[] = [];
        let totalConverted = 0;

        for (const account of accounts) {
            let processedAccount = account;

            if (convertAll) {
                const { result, error } = convert(account.balance, account.currency, selectedCurrency);
                if (error) {
                    missingCurrencies.push(error);
                } else {
                    processedAccount = { ...account, balance: result };
                    totalConverted += result;
                }
            }

            (accountsByName[account.name] ??= []).push(processedAccount);
        }

        return { accountsByName, missingCurrencies, totalConverted };

    }, [accounts, selectedCurrency, convertAll, convert]);

    useEffect(() => {
        setCurrenciesNotSet(missingCurrencies);
    }, [missingCurrencies, setCurrenciesNotSet]);

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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Accounts & Settings</h1>
                    <p className="mt-1 text-gray-500">Manage your accounts, currencies, and categories</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <ExchangeToggle />
                    <CurrencySwitcher />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        Balance in {selectedCurrency}
                    </p>
                    <p className={`text-2xl font-bold ${(balancesByCurrency[selectedCurrency] || 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {formatAmount(balancesByCurrency[selectedCurrency] || 0, selectedCurrency)}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        Total Converted to {selectedCurrency}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <p className={`text-2xl font-bold ${totalConverted >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                            {formatAmount(totalConverted, selectedCurrency)}
                        </p>

                        {currenciesNotSet.length > 0 ? (
                            <Link to="/exchange-rates" className="flex items-center gap-2 shrink-0 whitespace-nowrap text-amber-600 hover:text-amber-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-sm underline">Set exchange rates first</span>
                            </Link>
                        ) : (
                            <Link to="/exchange-rates" className="flex items-center gap-2 shrink-0 whitespace-nowrap text-green-600 hover:text-green-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-sm underline">Edit exchange rates</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Account Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Balance by Account */}
                <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Account Balances
                        </h2>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {Object.keys(accountsByName).length} Accounts
                        </span>
                    </div>

                    {Object.keys(accountsByName).length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-10">
                            <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p>No accounts yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(accountsByName).map(([name, accts]) => (
                                <div key={name} className="group overflow-hidden bg-gray-50 rounded-xl border border-gray-100 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm">
                                    {/* Account Header */}
                                    <div className="px-4 py-3 border-b border-gray-100 bg-white/50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-tight">{name}</h3>
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                                    </div>

                                    {/* Accounts List */}
                                    <div className="p-3 space-y-2">
                                        {accts.map(acc => (
                                            <div key={acc.id} className="flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 shadow-sm">
                                                        {acc.currency}
                                                    </span>
                                                </div>
                                                <span className={`text-sm font-mono font-bold ${acc.balance >= 0 ? 'text-success-700' : 'text-danger-600'}`}>
                                                    {formatAmount(acc.balance, (convertAll && !currenciesNotSet.includes(acc.currency)) ? selectedCurrency : acc.currency)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Total Balances per Currency Section */}
                <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Currency Summaries
                        </h2>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {Object.keys(balancesByCurrency).length} Currencies
                        </span>
                    </div>

                    {Object.keys(balancesByCurrency).length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>No balance data</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(balancesByCurrency).map(([currency, total]) => (
                                <div
                                    key={currency}
                                    className="relative overflow-hidden group p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow"
                                >
                                    {/* Background "Watermark" for style */}
                                    <div className="absolute -right-2 -bottom-2 text-gray-100 font-bold text-4xl select-none group-hover:text-blue-50 transition-colors">
                                        {currency}
                                    </div>

                                    <div className="relative z-10">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            Total {currency}
                                        </p>
                                        <p className={`text-xl font-mono font-bold ${total >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                            {formatAmount(total, currency)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'accounts'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => { setActiveTab('accounts'); cancelEdit(); }}
                        >
                            💳 Accounts
                        </button>
                        <button
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'currencies'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => { setActiveTab('currencies'); cancelEdit(); }}
                        >
                            💱 Currencies
                        </button>
                        <button
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'categories'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => { setActiveTab('categories'); cancelEdit(); }}
                        >
                            🏷️ Categories
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Accounts Tab */}
                    {activeTab === 'accounts' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Payment Methods / Accounts</h3>
                                {!showAccountForm && !editingAccount && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowAccountForm(true)}
                                    >
                                        + Add Account
                                    </button>
                                )}
                            </div>

                            {(showAccountForm || editingAccount) && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="form-label">Name</label>
                                            <input
                                                type="text"
                                                value={accountName}
                                                onChange={(e) => setAccountName(e.target.value)}
                                                placeholder="e.g., Revolut"
                                                className="form-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Currency</label>
                                            <CreatableSelect
                                                isClearable
                                                options={currencyOptions}
                                                value={accountCurrency ? { value: accountCurrency, label: accountCurrency } : null}
                                                onChange={(newValue) => setAccountCurrency(newValue ? newValue.value.toUpperCase() : '')}
                                                classNames={creatableSelectStyles}
                                                placeholder="Select..."
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Balance</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={accountBalance}
                                                onChange={(e) => setAccountBalance(e.target.value)}
                                                placeholder="0.00"
                                                className="form-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-outline" onClick={cancelEdit}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={editingAccount ? handleUpdateAccount : handleCreateAccount}
                                        >
                                            {editingAccount ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {accounts.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No accounts yet. Add your first account!</p>
                                ) : (
                                    accounts.map(account => (
                                        <div
                                            key={account.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <span className="text-lg">💳</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{account.name}</p>
                                                    <p className="text-sm text-gray-500">{account.currency}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-semibold ${account.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                                    {formatAmount(account.balance, account.currency)}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                                        onClick={() => startEditAccount(account)}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                                                        onClick={() => handleDeleteAccount(account.id)}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Currencies Tab */}
                    {activeTab === 'currencies' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Currencies</h3>
                                {!showCurrencyForm && !editingCurrency && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowCurrencyForm(true)}
                                    >
                                        + Add Currency
                                    </button>
                                )}
                            </div>

                            {(showCurrencyForm || editingCurrency) && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="form-label">Currency Code</label>
                                            <input
                                                type="text"
                                                value={currencyCode}
                                                onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                                                placeholder="e.g., USD"
                                                className="form-input"
                                                maxLength={10}
                                            />
                                        </div>
                                        <button className="btn btn-outline" onClick={cancelEdit}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={editingCurrency ? handleUpdateCurrency : handleCreateCurrency}
                                        >
                                            {editingCurrency ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {currencies.length === 0 ? (
                                    <p className="col-span-full text-gray-500 text-center py-8">No currencies yet</p>
                                ) : (
                                    currencies.map(currency => (
                                        <div
                                            key={currency.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="font-medium text-gray-900">{currency.code}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                    onClick={() => startEditCurrency(currency)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                                                    onClick={() => handleDeleteCurrency(currency.id)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Categories</h3>
                                {!showCategoryForm && !editingCategory && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowCategoryForm(true)}
                                    >
                                        + Add Category
                                    </button>
                                )}
                            </div>

                            {(showCategoryForm || editingCategory) && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="form-label">Name</label>
                                            <input
                                                type="text"
                                                value={categoryName}
                                                onChange={(e) => setCategoryName(e.target.value)}
                                                placeholder="e.g., Groceries"
                                                className="form-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Type</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className={`flex-1 py-2 px-4 rounded-lg font-medium border-2 transition-all ${categoryType === 'expense'
                                                        ? 'border-danger-500 bg-danger-50 text-danger-700'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                        }`}
                                                    onClick={() => setCategoryType('expense')}
                                                >
                                                    Expense
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`flex-1 py-2 px-4 rounded-lg font-medium border-2 transition-all ${categoryType === 'income'
                                                        ? 'border-success-500 bg-success-50 text-success-700'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                        }`}
                                                    onClick={() => setCategoryType('income')}
                                                >
                                                    Income
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-outline" onClick={cancelEdit}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                        >
                                            {editingCategory ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                        📉 Expense Categories
                                    </h4>
                                    <div className="space-y-2">
                                        {categories.filter(c => c.type === 'expense').length === 0 ? (
                                            <p className="text-gray-500 text-sm py-4">No expense categories</p>
                                        ) : (
                                            categories.filter(c => c.type === 'expense').map(category => (
                                                <div
                                                    key={category.id}
                                                    className="flex items-center justify-between p-3 bg-danger-50 rounded-xl hover:bg-danger-100 transition-colors"
                                                >
                                                    <span className="font-medium text-gray-900">{category.name}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                            onClick={() => startEditCategory(category)}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                        📈 Income Categories
                                    </h4>
                                    <div className="space-y-2">
                                        {categories.filter(c => c.type === 'income').length === 0 ? (
                                            <p className="text-gray-500 text-sm py-4">No income categories</p>
                                        ) : (
                                            categories.filter(c => c.type === 'income').map(category => (
                                                <div
                                                    key={category.id}
                                                    className="flex items-center justify-between p-3 bg-success-50 rounded-xl hover:bg-success-100 transition-colors"
                                                >
                                                    <span className="font-medium text-gray-900">{category.name}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                            onClick={() => startEditCategory(category)}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Accounts;
