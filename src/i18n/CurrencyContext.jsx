import { createContext, useEffect, useMemo, useState } from 'react';
import { currencyConfig } from '../config/currencyConfig.js';
import { legacyStorageKeys, storageKeys } from '../constants/storageKeys.js';
import { apiRequest } from '../services/apiClient.js';

const CURRENCY_KEY = storageKeys.currency;

export const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currentCurrency, setCurrentCurrency] = useState(
    localStorage.getItem(CURRENCY_KEY) ||
      legacyStorageKeys.currency.map((key) => localStorage.getItem(key)).find(Boolean) ||
      currencyConfig.baseCurrency,
  );
  const [ratesVersion, setRatesVersion] = useState(0);

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currentCurrency);
    localStorage.setItem('lune_guest_currency', currentCurrency);
  }, [currentCurrency]);

  useEffect(() => {
    let active = true;
    const refreshRates = async () => {
      try {
        const targets = currencyConfig.supportedCurrencies.filter((currency) => currency !== currencyConfig.baseCurrency).join(',');
        const data = await apiRequest(`/currency/rates?targets=${encodeURIComponent(targets)}`, {
          ignoreMockOnly: true,
          timeoutMs: 6000,
        });
        if (!active || !data?.rates) return;
        localStorage.setItem(storageKeys.currencyRates, JSON.stringify(data));
        localStorage.setItem(storageKeys.currencyLastUpdated, data.lastUpdated || new Date().toISOString());
        setRatesVersion((value) => value + 1);
      } catch {
        // Guest prices still render with conservative fallback rates when the backend is unavailable.
      }
    };

    refreshRates();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      currentCurrency,
      ratesVersion,
      supportedCurrencies: currencyConfig.supportedCurrencies,
      changeCurrency: (currency) => {
        if (currencyConfig.supportedCurrencies.includes(currency)) setCurrentCurrency(currency);
      },
    }),
    [currentCurrency, ratesVersion],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
