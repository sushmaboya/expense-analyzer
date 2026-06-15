const BASE_CURRENCY = 'INR';
const USD_TO_INR_RATE = 82.5;

function normalizeCurrency(currency) {
  return (currency || '').toString().trim().toUpperCase();
}

function isSupportedCurrency(currency) {
  return ['INR', 'USD'].includes(normalizeCurrency(currency));
}

function convertToBaseCurrency(amount, currency) {
  const normalized = normalizeCurrency(currency);
  const value = Number(amount);
  if (isNaN(value)) {
    return 0;
  }

  if (normalized === 'USD') {
    return Math.round(value * USD_TO_INR_RATE * 100) / 100;
  }

  return Math.round(value * 100) / 100;
}

module.exports = {
  BASE_CURRENCY,
  USD_TO_INR_RATE,
  normalizeCurrency,
  isSupportedCurrency,
  convertToBaseCurrency
};
