import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { currencyApi, categoryApi, accountApi, Currency, Category, Account, } from '../services/api';

const DEFAULT_CURRENCIES = ['EUR', 'USD', 'CNY'];

const DEFAULT_CATEGORIES = {
    expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Housing', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'],
};

const DEFAULT_PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Alipay', 'WeChat Pay', 'Revolut', 'Other'];

// --- Types ---
interface Option {
    value: string;
    label: string;
}

interface PreferenceContextType {
    currencyOptions: Option[];
    categoryOptions: {
        expense: Option[];
        income: Option[];
    };
    paymentOptions: Option[];
    currency: string;
    setCurrency: (currency: string) => void;
    currencies: Currency[];
    categories: Category[];
    accounts: Account[];
    loadPreferences: () => Promise<void>;
}

const toOptions = (items: string[]): Option[] => items.map(item => ({ value: item, label: item }));
const mergeToOptions = (defaults: string[], fetched: string[] = []): Option[] => {
    if (!fetched || fetched.length === 0) return toOptions(defaults);

    const uniqueItems = Array.from(new Set([...defaults, ...fetched]));
    return toOptions(uniqueItems);
};

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export const usePreference = () => {
    const context = useContext(PreferenceContext);
    if (context === undefined) {
        throw new Error('usePreference must be used within a PreferenceProvider');
    }
    return context;
}

export const PreferenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<string>('EUR');
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const loadPreferences = async () => {
        try {
            // Fetch all data in parallel
            const [currenciesRes, categoriesRes, accountsRes] = await Promise.all([
                currencyApi.list().catch(() => ({ data: [] })), // Catch individual errors so others don't fail
                categoryApi.list().catch(() => ({ data: [] })),
                accountApi.list().catch(() => ({ data: [] })),
            ]);

            setCurrencies(currenciesRes.data || []);
            setCategories(categoriesRes.data || []);
            setAccounts(accountsRes.data || []);

        } catch (error) {
            console.error('Critical failure loading preferences:', error);
        }
    };

    useEffect(() => {
        loadPreferences();
    }, []);

    const currencyOptions = useMemo(() => {
        return mergeToOptions(DEFAULT_CURRENCIES, currencies.map((c) => c.code));
    }, [currencies]);

    const categoryOptions = useMemo(() => {
        const expenseOptions = mergeToOptions(DEFAULT_CATEGORIES.expense, categories.filter(c => c.type === 'expense').map(c => c.name));
        const incomeOptions = mergeToOptions(DEFAULT_CATEGORIES.income, categories.filter(c => c.type === 'income').map(c => c.name));
        return { expense: expenseOptions, income: incomeOptions };
    }, [categories]);

    const paymentOptions = useMemo(() => {
        const accountOptions = accounts.map(a => a.name);
        return mergeToOptions(DEFAULT_PAYMENT_METHODS, accountOptions);
    }, [accounts]);

    return (
        <PreferenceContext.Provider
            value={{
                currencyOptions,
                categoryOptions,
                paymentOptions,
                currency,
                setCurrency,
                currencies,
                categories,
                accounts,
                loadPreferences,
            }}
        >
            {children}
        </PreferenceContext.Provider>
    );
}