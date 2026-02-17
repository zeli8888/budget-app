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
  }).format(value) + ' ' + upperCurrency;
};

export const creatableSelectStyles = {
  control: ({ isFocused }: { isFocused: boolean }) =>
    `!w-full !rounded-lg !border !text-sm !transition-colors !min-h-[46px] flex items-center
       ${isFocused
      ? '!border-primary-500 !ring-2 !ring-primary-500 !shadow-none'
      : '!border-gray-300 hover:!border-gray-400'
    }`,
  valueContainer: () => '!px-4',
  input: () => '!text-sm !m-0 !p-0', // Keeps text aligned nicely
  singleValue: () => '!text-sm',
  placeholder: () => '!text-gray-400 !text-sm',
  menu: () => '!mt-1 !rounded-lg !border !border-gray-200 !shadow-lg',
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    `!text-sm !px-4 !py-1 ${isSelected
      ? '!bg-primary-500 !text-white'
      : isFocused
        ? '!bg-zinc-500 !text-white'
        : '!bg-white !text-gray-900'
    }`,
}