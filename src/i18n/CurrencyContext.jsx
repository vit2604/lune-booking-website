import { createContext, useEffect, useMemo, useState } from 'react';
import { currencyConfig } from '../config/currencyConfig.js';
import { legacyStorageKeys, storageKeys } from '../constants/storageKeys.js';

const CURRENCY_KEY = storageKeys.currency;

export const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currentCurrency, setCurrentCurrency] = useState(
    localStorage.getItem(CURRENCY_KEY) ||
      legacyStorageKeys.currency.map((key) => localStorage.getItem(key)).find(Boolean) ||
      currencyConfig.baseCurrency,
  );

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currentCurrency);
    localStorage.setItem('lune_guest_currency', currentCurrency);
  }, [currentCurrency]);

  const value = useMemo(
    () => ({
      currentCurrency,
      supportedCurrencies: currencyConfig.supportedCurrencies,
      changeCurrency: (currency) => {
        if (currencyConfig.supportedCurrencies.includes(currency)) setCurrentCurrency(currency);
      },
    }),
    [currentCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
