import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { fallbackRates, normalizeCurrencyList } from '../../utils/currencyUtils.js';

const cacheDurationMs = 6 * 60 * 60 * 1000;
const provider = env.CURRENCY_PROVIDER === 'frankfurter' ? 'exchangerate-api' : env.CURRENCY_PROVIDER || 'exchangerate-api';

function buildFallbackRates(targets) {
  return targets.reduce((acc, currency) => {
    acc[currency] = fallbackRates[currency] || fallbackRates.USD;
    return acc;
  }, {});
}

async function getCachedRates(targets) {
  const rows = await prisma.currencyRateCache.findMany({
    where: {
      baseCurrency: 'VND',
      targetCurrency: { in: targets },
      provider,
      lastUpdated: { gte: new Date(Date.now() - cacheDurationMs) },
    },
  });
  return rows.reduce((acc, row) => {
    acc[row.targetCurrency] = Number(row.rate);
    return acc;
  }, {});
}

async function saveRates(rates) {
  await Promise.all(
    Object.entries(rates).map(([targetCurrency, rate]) =>
      prisma.currencyRateCache.upsert({
        where: {
          baseCurrency_targetCurrency_provider: {
            baseCurrency: 'VND',
            targetCurrency,
            provider,
          },
        },
        update: { rate, lastUpdated: new Date() },
        create: {
          baseCurrency: 'VND',
          targetCurrency,
          provider,
          rate,
          lastUpdated: new Date(),
        },
      }),
    ),
  );
}

export async function fetchLiveRates(targets) {
  const supportedByProvider = targets.filter((currency) => currency !== 'VND');
  if (!supportedByProvider.length) return {};

  const url = `${env.EXCHANGE_RATE_BASE_URL}/USD`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Currency provider failed with ${response.status}`);
  const payload = await response.json();
  const providerRates = payload.rates || {};
  const usdToVnd = Number(providerRates.VND) || fallbackRates.USD;
  const rates = {};

  supportedByProvider.forEach((currency) => {
    if (currency === 'VND') rates[currency] = 1;
    else if (currency === 'USD') rates[currency] = usdToVnd;
    else if (providerRates[currency]) rates[currency] = usdToVnd / Number(providerRates[currency]);
  });

  return rates;
}

export async function getExchangeRates(targetsInput = []) {
  const targets = normalizeCurrencyList(targetsInput.length ? targetsInput : Object.keys(fallbackRates));
  const cached = await getCachedRates(targets);
  const missing = targets.filter((currency) => cached[currency] === undefined);
  let liveRates = {};
  let isFallback = false;

  if (missing.length) {
    try {
      liveRates = await fetchLiveRates(missing);
      const stillMissing = missing.filter((currency) => liveRates[currency] === undefined);
      if (stillMissing.length) {
        liveRates = { ...liveRates, ...buildFallbackRates(stillMissing) };
        isFallback = true;
      }
      await saveRates(liveRates);
    } catch (_error) {
      liveRates = buildFallbackRates(missing);
      await saveRates(liveRates);
      isFallback = true;
    }
  }

  const rates = { ...cached, ...liveRates, VND: 1 };
  return {
    baseCurrency: 'VND',
    rates,
    provider,
    lastUpdated: new Date().toISOString(),
    isFallback,
  };
}

export async function convertCurrency({ amount, from = 'VND', to = 'USD' }) {
  const target = to.toUpperCase();
  const source = from.toUpperCase();
  const { rates, provider: rateProvider, lastUpdated, isFallback } = await getExchangeRates([target, source]);
  const amountVnd = source === 'VND' ? Number(amount) : Number(amount) * (rates[source] || fallbackRates[source] || 1);
  const rate = rates[target] || fallbackRates[target] || fallbackRates.USD;
  const convertedAmount = target === 'VND' ? amountVnd : amountVnd / rate;

  return {
    originalAmount: Number(amount),
    from: source,
    to: target,
    convertedAmount,
    rate,
    provider: rateProvider,
    lastUpdated,
    isFallback,
    note: 'Final booking payment is charged in VND. Other currencies are estimates.',
  };
}
