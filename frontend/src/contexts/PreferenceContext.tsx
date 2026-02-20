import React, { createContext, useContext, useEffect, useState } from 'react';
import { currencyApi, categoryApi, accountApi } from '../services/api';

const DEFAULT_CURRENCIES = ['EUR', 'USD', 'CNY'];

const DEFAULT_CATEGORIES = {
    expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'],
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
    // Initialize with defaults immediately
    const [currencyOptions, setCurrencyOptions] = useState<Option[]>(() => toOptions(DEFAULT_CURRENCIES));
    const [categoryOptions, setCategoryOptions] = useState(() => ({
        expense: toOptions(DEFAULT_CATEGORIES.expense),
        income: toOptions(DEFAULT_CATEGORIES.income)
    }));
    const [paymentOptions, setPaymentOptions] = useState<Option[]>(() => toOptions(DEFAULT_PAYMENT_METHODS));

    const [currency, setCurrency] = useState<string>('EUR');

    const loadPreferences = async () => {
        try {
            // Fetch all data in parallel
            const [currenciesRes, categoriesRes, accountsRes] = await Promise.all([
                currencyApi.list().catch(() => ({ data: [] })), // Catch individual errors so others don't fail
                categoryApi.list().catch(() => ({ data: [] })),
                accountApi.list().catch(() => ({ data: [] })),
            ]);

            // 1. Currencies
            if (currenciesRes.data?.length) {
                const fetchedCodes = currenciesRes.data.map((c: any) => c.code);
                setCurrencyOptions(mergeToOptions(DEFAULT_CURRENCIES, fetchedCodes));
            }

            // 2. Categories
            if (categoriesRes.data?.length) {
                const fetchedExpense = categoriesRes.data
                    .filter((c: any) => c.type === 'expense')
                    .map((c: any) => c.name);

                const fetchedIncome = categoriesRes.data
                    .filter((c: any) => c.type === 'income')
                    .map((c: any) => c.name);

                setCategoryOptions({
                    expense: mergeToOptions(DEFAULT_CATEGORIES.expense, fetchedExpense),
                    income: mergeToOptions(DEFAULT_CATEGORIES.income, fetchedIncome),
                });
            }

            // 3. Payment Methods
            if (accountsRes.data?.length) {
                const fetchedAccounts = accountsRes.data.map((a: any) => a.name);
                setPaymentOptions(mergeToOptions(DEFAULT_PAYMENT_METHODS, fetchedAccounts));
            }

        } catch (error) {
            console.error('Critical failure loading preferences:', error);
        }
    };

    useEffect(() => {
        loadPreferences();
    }, []);

    return (
        <PreferenceContext.Provider
            value={{
                currencyOptions,
                categoryOptions,
                paymentOptions,
                currency,
                setCurrency,
                loadPreferences,
            }}
        >
            {children}
        </PreferenceContext.Provider>
    );
}