import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminFormInput from '../components/AdminFormInput.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { getPaymentSettings, savePaymentSettings } from '../services/adminSettingsService.js';
import { canUseMockFallback } from '../../config/apiConfig.js';
import { adminGetPaymentSettings, adminSavePaymentSettings } from '../../services/adminApiService.js';

const methodLabels = {
  payAtProperty: 'Pay at property',
  cashAtProperty: 'Cash at property',
  bankTransfer: 'Bank transfer Vietnam',
  vietQr: 'VietQR',
  creditCard: 'Credit/Debit Card mock',
  stripe: 'Stripe placeholder',
  paypal: 'PayPal placeholder',
  vnpay: 'VNPay placeholder',
  momo: 'MoMo placeholder',
  zaloPay: 'ZaloPay placeholder',
  internationalTransfer: 'International transfer',
};

const gatewayMethodIds = ['creditCard', 'stripe', 'paypal'];
const walletMethodIds = ['vnpay', 'momo', 'zaloPay'];

export default function AdminPaymentSettings() {
  const [settings, setSettings] = useState(getPaymentSettings());
  const [message, setMessage] = useState('');
  const [source, setSource] = useState(canUseMockFallback() ? 'local' : 'api');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadSettings() {
      setLoading(true);
      try {
        const methods = await adminGetPaymentSettings();
        if (ignore) return;
        const paymentMethods = Object.fromEntries((methods || []).map((method) => [method.key || method.id, method]));
        setSettings((current) => ({ ...current, paymentMethods }));
        setSource('api');
      } catch (error) {
        if (!canUseMockFallback() && !ignore) setMessage(error.message || 'Could not load payment settings from backend.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const update = (field, value) => setSettings((current) => ({ ...current, [field]: value }));

  const updateMethod = (methodId, field, value) => {
    setSettings((current) => ({
      ...current,
      paymentMethods: {
        ...current.paymentMethods,
        [methodId]: {
          ...(current.paymentMethods?.[methodId] || {}),
          [field]: value,
        },
      },
    }));
  };

  const bankTransfer = settings.paymentMethods?.bankTransfer || {};
  const warnings = [];
  if (bankTransfer.enabled && (!bankTransfer.bankName || !bankTransfer.accountNumber || !bankTransfer.accountHolder)) {
    warnings.push('Bank transfer is enabled. Bank name, account number, and account holder should be filled.');
  }

  const handleSave = async (event) => {
    event.preventDefault();
    const payload = {
      ...settings,
      enablePayAtProperty: settings.paymentMethods?.payAtProperty?.enabled,
      enableBankTransfer: settings.paymentMethods?.bankTransfer?.enabled,
      enableQrPayment: settings.paymentMethods?.vietQr?.enabled,
      bankName: bankTransfer.bankName,
      bankAccountNumber: bankTransfer.accountNumber,
      bankAccountName: bankTransfer.accountHolder,
      transferContentTemplate: bankTransfer.transferContentTemplate,
      qrImageUrl: bankTransfer.qrImageUrl || settings.paymentMethods?.vietQr?.qrImageUrl || '',
      payAtPropertyNote: settings.paymentMethods?.payAtProperty?.paymentNote,
    };
    try {
      if (source === 'api') {
        const methods = await adminSavePaymentSettings(payload.paymentMethods);
        const paymentMethods = Object.fromEntries((methods || []).map((method) => [method.key || method.id, method]));
        setSettings((current) => ({ ...current, paymentMethods }));
      } else {
        savePaymentSettings(payload);
      }
      setMessage('Payment settings saved. Guest Payment page now uses these enabled methods and placeholders.');
    } catch (error) {
      setMessage(error.message || 'Could not save payment settings.');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Payments</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Payment settings</h2>
          <p className="mt-2 text-sm text-stone-600">
            Enable customer-facing payment methods and prepare placeholders for future backend integrations.
          </p>
        </div>
        <button className="btn-gold" type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save payment settings
        </button>
      </div>

      {message ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{message}</div> : null}
      {loading ? <div className="rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-600">Loading payment settings...</div> : null}
      {warnings.map((warning) => (
        <div key={warning} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">{warning}</div>
      ))}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Visible payment methods</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Toggle methods guests can choose on the Payment page. All methods are mock placeholders until backend payment endpoints are connected.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {Object.entries(settings.paymentMethods || {}).map(([methodId, method]) => (
            <div key={methodId} className="rounded-lg border border-stone-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-lune-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(method.enabled)}
                    onChange={(event) => updateMethod(methodId, 'enabled', event.target.checked)}
                  />
                  {methodLabels[methodId] || method.displayName}
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500">
                  <input
                    type="checkbox"
                    checked={method.visibleForGuests !== false}
                    onChange={(event) => updateMethod(methodId, 'visibleForGuests', event.target.checked)}
                  />
                  Visible
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <AdminFormInput
                  label="Display name"
                  value={method.displayName || ''}
                  onChange={(event) => updateMethod(methodId, 'displayName', event.target.value)}
                />
                <AdminFormInput
                  label="Sort order"
                  type="number"
                  value={method.sortOrder || ''}
                  onChange={(event) => updateMethod(methodId, 'sortOrder', Number(event.target.value) || 0)}
                />
                <AdminFormInput
                  className="sm:col-span-2"
                  label="Description"
                  as="textarea"
                  value={method.description || ''}
                  onChange={(event) => updateMethod(methodId, 'description', event.target.value)}
                />
                <AdminFormInput
                  className="sm:col-span-2"
                  label="Payment note"
                  as="textarea"
                  value={method.paymentNote || ''}
                  onChange={(event) => updateMethod(methodId, 'paymentNote', event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Bank transfer and VietQR</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <AdminFormInput label="Bank name" value={bankTransfer.bankName || ''} onChange={(e) => updateMethod('bankTransfer', 'bankName', e.target.value)} placeholder="PLACEHOLDER_BANK_NAME" />
          <AdminFormInput label="Account number" value={bankTransfer.accountNumber || ''} onChange={(e) => updateMethod('bankTransfer', 'accountNumber', e.target.value)} placeholder="PLACEHOLDER_ACCOUNT_NUMBER" />
          <AdminFormInput label="Account holder" value={bankTransfer.accountHolder || ''} onChange={(e) => updateMethod('bankTransfer', 'accountHolder', e.target.value)} />
          <AdminFormInput label="Transfer content template" value={bankTransfer.transferContentTemplate || ''} onChange={(e) => updateMethod('bankTransfer', 'transferContentTemplate', e.target.value)} />
          <AdminFormInput label="Bank API provider placeholder" value={bankTransfer.bankApiProvider || ''} onChange={(e) => updateMethod('bankTransfer', 'bankApiProvider', e.target.value)} />
          <AdminFormInput label="Bank API base URL placeholder" value={bankTransfer.bankApiBaseUrl || ''} onChange={(e) => updateMethod('bankTransfer', 'bankApiBaseUrl', e.target.value)} />
          <AdminFormInput label="Webhook URL placeholder" value={bankTransfer.webhookUrl || ''} onChange={(e) => updateMethod('bankTransfer', 'webhookUrl', e.target.value)} />
          <AdminFormInput label="VietQR API base URL placeholder" value={settings.paymentMethods?.vietQr?.apiBaseUrl || ''} onChange={(e) => updateMethod('vietQr', 'apiBaseUrl', e.target.value)} />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ImageUploader label="Bank QR image mock" images={bankTransfer.qrImageUrl ? [bankTransfer.qrImageUrl] : []} multiple={false} onChange={(images) => updateMethod('bankTransfer', 'qrImageUrl', images[0] || '')} />
          <ImageUploader label="VietQR image mock" images={settings.paymentMethods?.vietQr?.qrImageUrl ? [settings.paymentMethods.vietQr.qrImageUrl] : []} multiple={false} onChange={(images) => updateMethod('vietQr', 'qrImageUrl', images[0] || '')} />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Gateway and wallet placeholders</h3>
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          Do not use real secret key here. Use backend environment variables in production. The frontend should only call backend endpoints.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {[...gatewayMethodIds, ...walletMethodIds].map((methodId) => {
            const method = settings.paymentMethods?.[methodId] || {};
            return (
              <div key={methodId} className="rounded-lg border border-stone-200 p-4">
                <h4 className="font-semibold text-lune-ink">{methodLabels[methodId]}</h4>
                <div className="mt-4 grid gap-4">
                  <AdminFormInput
                    label="Provider name"
                    value={method.providerName || method.provider || ''}
                    onChange={(event) => updateMethod(methodId, gatewayMethodIds.includes(methodId) ? 'providerName' : 'providerName', event.target.value)}
                  />
                  <AdminFormInput
                    label="Backend endpoint placeholder"
                    value={method.backendEndpoint || ''}
                    onChange={(event) => updateMethod(methodId, 'backendEndpoint', event.target.value)}
                  />
                  {gatewayMethodIds.includes(methodId) ? (
                    <AdminFormInput
                      label="Public key placeholder"
                      value={method.publicKey || ''}
                      onChange={(event) => updateMethod(methodId, 'publicKey', event.target.value)}
                    />
                  ) : (
                    <AdminFormInput
                      label="Merchant ID placeholder"
                      value={method.merchantId || ''}
                      onChange={(event) => updateMethod(methodId, 'merchantId', event.target.value)}
                    />
                  )}
                  <AdminFormInput
                    label="Webhook URL placeholder"
                    value={method.webhookUrl || ''}
                    onChange={(event) => updateMethod(methodId, 'webhookUrl', event.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </form>
  );
}
