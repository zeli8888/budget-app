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
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${convertAll ? 'bg-primary-600' : 'bg-gray-300'} cursor-pointer`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${convertAll ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
            {
                !convertAll ? (
                    <span className="text-sm text-gray-600">
                        Convert All to {currency}
                    </span>) : (
                    currenciesNotSet.length > 0 ? (
                        <Link to="/exchange-rates" className="text-sm text-amber-600 hover:text-amber-700 underline">
                            Rates Not Set
                        </Link>
                    ) : (
                        <Link to="/exchange-rates" className="text-sm text-green-600 hover:text-green-700 underline">
                            Edit Rates
                        </Link>
                    )
                )
            }
        </div>
    );
};

export default ExchangeToggle;
