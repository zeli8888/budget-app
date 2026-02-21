import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ExchangeRatesType {
    [currency: string]: number; // Rate to convert FROM this currency TO base currency
}

interface ConversionResult {
    error: string | null;
    result: number;
}

interface ExchangeRateContextType {
    baseCurrency: string;
    setBaseCurrency: (currency: string) => void;
    rates: ExchangeRatesType;
    storeRatesBaseCurrency: (rates: ExchangeRatesType, baseCurrency: string) => void;
    currenciesNotSet: string[];
    setCurrenciesNotSet: React.Dispatch<React.SetStateAction<string[]>>;
    convertAll: boolean;
    setConvertAll: (enabled: boolean) => void;
    convert: (amount: number, fromCurrency: string, toCurrency: string) => ConversionResult;
}

const STORAGE_KEY = 'exchange_rates_config';

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const useExchangeRate = () => {
    const context = useContext(ExchangeRateContext);
    if (context === undefined) {
        throw new Error('useExchangeRate must be used within an ExchangeRateProvider');
    }
    return context;
};

interface StoredConfig {
    baseCurrency: string;
    rates: ExchangeRatesType;
}

export const ExchangeRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [baseCurrency, setBaseCurrency] = useState<string>('EUR');
    const [rates, setRatesState] = useState<ExchangeRatesType>({});
    const [convertAll, setConvertAll] = useState(false);
    const [currenciesNotSet, setCurrenciesNotSet] = useState<string[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const config: StoredConfig = JSON.parse(stored);
                setBaseCurrency(config.baseCurrency || 'EUR');
                setRatesState(config.rates || {});
            }
        } catch (error) {
            console.error('Failed to load exchange rates from localStorage:', error);
        }
    }, []);

    useEffect(() => {
        setCurrenciesNotSet(prev => prev.filter(currency => rates[currency] == null || rates[currency] <= 0));
    }, [rates]);

    const saveToStorage = (newBaseCurrency: string, newRates: ExchangeRatesType) => {
        try {
            const config: StoredConfig = {
                baseCurrency: newBaseCurrency,
                rates: newRates,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save exchange rates to localStorage:', error);
        }
    }

    const storeRatesBaseCurrency = (newRates: ExchangeRatesType, newBaseCurrency: string) => {
        const filteredRates = Object.fromEntries(
            Object.entries(newRates).filter(([_, value]) => value > 0)
        );
        setRatesState(filteredRates);
        setBaseCurrency(newBaseCurrency);
        saveToStorage(newBaseCurrency, filteredRates);
    };

    // Convert amount from one currency to another
    // Strategy: Convert to base currency first, then to target currency
    const convert = useCallback((amount: number, fromCurrency: string, toCurrency: string): ConversionResult => {
        if (fromCurrency === toCurrency) return { error: null, result: amount };

        // Step 1: Convert from source currency to base currency
        let amountInBase: number;
        if (fromCurrency === baseCurrency) {
            amountInBase = amount;
        } else {
            const rateToBase = rates[fromCurrency];
            if (!rateToBase || rateToBase <= 0) {
                return { error: fromCurrency, result: 0 };
            }
            amountInBase = amount * rateToBase;
        }

        // Step 2: Convert from base currency to target currency
        if (toCurrency === baseCurrency) {
            return { error: null, result: amountInBase };
        } else {
            const rateToBase = rates[toCurrency];
            if (!rateToBase || rateToBase <= 0) {
                return { error: toCurrency, result: 0 };
            }
            return { error: null, result: amountInBase / rateToBase };
        }
    }, [baseCurrency, rates]);

    return (
        <ExchangeRateContext.Provider
            value={{
                baseCurrency,
                setBaseCurrency,
                rates,
                storeRatesBaseCurrency,
                currenciesNotSet,
                setCurrenciesNotSet,
                convertAll,
                setConvertAll,
                convert,
            }}
        >
            {children}
        </ExchangeRateContext.Provider>
    );
};
