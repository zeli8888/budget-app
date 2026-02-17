const VALID_ISO_CURRENCIES = new Set(Intl.supportedValuesOf('currency'));

export const formatAmount = (amount: number, currency: string): string => {
  const value = amount / 100;
  const upperCurrency = currency.toUpperCase();
  if (VALID_ISO_CURRENCIES.has(upperCurrency)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upperCurrency,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};