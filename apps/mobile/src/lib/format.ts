const DEFAULT_CURRENCY = 'USD';

const formatGroupedInteger = (value: number): string => {
  const absolute = Math.abs(Math.trunc(value));
  return absolute.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatCurrencyFallback = (
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string => {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const grouped = formatGroupedInteger(rounded);

  if (currency === DEFAULT_CURRENCY) {
    return `${sign}$${grouped}`;
  }

  return `${sign}${currency} ${grouped}`;
};

export const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return fallback;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const isValidCurrencyCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Z]{3}$/.test(value);

export const formatCurrencyFromCents = (
  cents: unknown,
  currency: unknown = DEFAULT_CURRENCY
): string => {
  const safeAmount = toFiniteNumber(cents) / 100;
  const safeCurrency = isValidCurrencyCode(currency)
    ? currency
    : DEFAULT_CURRENCY;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return formatCurrencyFallback(safeAmount, safeCurrency);
  }
};

export const formatWholeNumber = (value: unknown): string => {
  const safeValue = toFiniteNumber(value);

  try {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(safeValue);
  } catch {
    const rounded = Math.round(safeValue);
    const sign = rounded < 0 ? '-' : '';
    return `${sign}${formatGroupedInteger(rounded)}`;
  }
};
