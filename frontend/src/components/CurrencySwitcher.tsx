import React from 'react';
import { usePreference } from '../contexts/PreferenceContext';

const CurrencySwitcher: React.FC = () => {
    const { currency, setCurrency, currencyOptions } = usePreference();

    if (currencyOptions.length <= 1) return null;

    return (
        <div className="flex items-center">
            {currencyOptions.length > 5 ? (
                /* UI for MANY currencies (Simple Dropdown) */
                <div className="relative">
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2 bg-gray-100 border-none rounded-xl text-sm font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-primary-500 transition-all"
                    >
                        {currencyOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            ) : (
                /* UI for FEW currencies (Hybrid approach) */
                <>
                    {/* Mobile: Native Select (visible only on tiny screens) */}
                    <div className="sm:hidden relative w-full">
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2 bg-gray-100 border-none rounded-xl text-sm font-bold text-gray-700"
                        >
                            {currencyOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Desktop: Pills (visible only on sm screens and up) */}
                    <div className="hidden sm:inline-flex bg-gray-100 p-1 rounded-xl shadow-inner">
                        {currencyOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setCurrency(option.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${currency === option.value
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CurrencySwitcher;