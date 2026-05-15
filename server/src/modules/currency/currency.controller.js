import { sendSuccess } from '../../utils/responseUtils.js';
import { convertCurrency, getExchangeRates } from './currency.service.js';

export async function rates(req, res) {
  const targets = String(req.query.targets || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  sendSuccess(res, await getExchangeRates(targets));
}

export async function convert(req, res) {
  sendSuccess(
    res,
    await convertCurrency({
      amount: req.query.amount || 0,
      from: req.query.from || 'VND',
      to: req.query.to || 'USD',
    }),
  );
}
