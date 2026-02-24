import React from 'react';
import { Link } from 'react-router-dom';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { usePreference } from '../contexts/PreferenceContext';

const ExchangeToggle: React.FC = () => {
    const { currenciesNotSet, convertAll, setConvertAll } = useExchangeRate();
    const { currency } = usePreference();

    const handleToggle = () => {
        setConvertAll(!convertAll);
    };

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                role="switch"
                aria-checked={convertAll}
                onClick={handleToggle}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${convertAll ? 'bg-primary-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${convertAll ? 'translate-x-4' : 'translate-x-0'
                        }`}
                />
            </button>

            {!convertAll ? (
                <span
                    onClick={handleToggle}
                    className="text-sm font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors"
                >
                    Convert All to {currency}
                </span>
            ) : currenciesNotSet.length > 0 ? (
                <Link
                    to="/exchange-rates"
                    className="group flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                    <span className="underline underline-offset-4 decoration-amber-300/70 group-hover:decoration-amber-500 transition-colors">
                        Rates Not Set
                    </span>

                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                </Link>
            ) : (
                <Link
                    to="/exchange-rates"
                    className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors underline underline-offset-4 decoration-green-300/70 hover:decoration-green-500"
                >
                    Edit Rates
                </Link>
            )}
        </div>
    );
};

export default ExchangeToggle;
