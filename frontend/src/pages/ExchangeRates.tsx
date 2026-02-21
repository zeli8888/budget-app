import React, { useState, useEffect, useMemo } from 'react';
import { useExchangeRate, ExchangeRatesType } from '../contexts/ExchangeRateContext';
import CreatableSelect from 'react-select/creatable';
import { creatableSelectStyles } from '../components/utils';
import { usePreference } from '../contexts/PreferenceContext';

const ExchangeRates: React.FC = () => {
    const { baseCurrency, rates, storeRatesBaseCurrency, currenciesNotSet } = useExchangeRate();
    const { currencyOptions } = usePreference();
    const [localRates, setLocalRates] = useState<ExchangeRatesType>({});
    const [localBaseCurrency, setLocalBaseCurrency] = useState('EUR');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalRates(rates);
    }, [rates]);

    useEffect(() => {
        setLocalBaseCurrency(baseCurrency);
    }, [baseCurrency]);

    const otherCurrencies = useMemo(() => {
        const uniqueList = Array.from(new Set([...currenciesNotSet, ...Object.keys(rates)]));
        return uniqueList
            .filter(code => code !== localBaseCurrency)
            .sort();
    }, [currenciesNotSet, rates, localBaseCurrency]);

    const handleRateChange = (currency: string, value: string) => {
        let numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) numValue = 0; // set to 0 if invalid or negative, since 0 will be considered as "not set" and shown as empty string in the input
        setLocalRates(prev => ({
            ...prev,
            [currency]: numValue
        }));
    };

    const handleSave = () => {
        storeRatesBaseCurrency(localRates, localBaseCurrency);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Exchange Rates</h1>
                <p className="mt-1 text-gray-500">Set custom exchange rates for currency conversion</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="mb-6">
                    <label className="form-label">Base Currency</label>
                    <p className="text-sm text-gray-500 mb-2">
                        All other currencies will be converted relative to this currency
                    </p>
                    <CreatableSelect
                        options={currencyOptions}
                        value={{ value: localBaseCurrency, label: localBaseCurrency }}
                        onChange={(newValue) => { if (newValue) { setLocalBaseCurrency(newValue.value); } }}
                        classNames={creatableSelectStyles}
                    />
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Exchange Rates</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Enter how much 1 unit of each currency equals in {localBaseCurrency}
                    </p>

                    {otherCurrencies.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No other currencies available.</p>
                            <p className="text-sm mt-1">Add more currencies in Accounts to set exchange rates.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {otherCurrencies.map(opt => (
                                <div key={opt} className="flex items-center gap-4">
                                    <div className="w-20 font-medium text-gray-700">
                                        1 {opt} =
                                    </div>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        value={localRates[opt] || ''} // Show empty string for undefined/null/0.0 to allow clearing the input
                                        onChange={(e) => handleRateChange(opt, e.target.value)}
                                        placeholder="N/A"
                                        className="form-input flex-1"
                                    />
                                    <div className="w-16 text-gray-500">{localBaseCurrency}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div>
                        {saved && (
                            <span className="text-success-600 text-sm font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Saved!
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                    >
                        Save Exchange Rates
                    </button>
                </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex gap-3">
                    <div className="text-blue-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-sm text-blue-700">
                        <p className="font-medium">How it works</p>
                        <p className="mt-1">
                            Exchange rates are stored locally in your browser. When you enable the "Convert All" toggle
                            on other pages, all amounts will be converted to your selected display currency
                            using these rates. Currency without a valid rate (larger than 0) will be treated as 0.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExchangeRates;
