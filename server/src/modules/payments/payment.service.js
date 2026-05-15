import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../utils/responseUtils.js';

const defaultPaymentMethods = {
  payAtProperty: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Pay at property',
    description: 'Pay directly when you arrive at Lune Boutique Hotel & Apartment.',
    sortOrder: 1,
    statusAfterConfirm: 'PAY_AT_PROPERTY',
  },
  cashAtProperty: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Cash at property',
    description: 'Pay by cash at the property.',
    sortOrder: 2,
    statusAfterConfirm: 'PAY_AT_PROPERTY',
  },
  bankTransfer: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Bank transfer Vietnam',
    description: 'Transfer to the official Lune bank account.',
    sortOrder: 3,
    statusAfterConfirm: 'PENDING',
    bankName: 'PLACEHOLDER_BANK_NAME',
    accountNumber: 'PLACEHOLDER_ACCOUNT_NUMBER',
    accountHolder: 'LUNE BOUTIQUE HOTEL',
    transferContentTemplate: 'LUNE-{bookingCode}-{guestName}',
    qrImageUrl: '',
  },
  vietQr: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'VietQR',
    description: 'VietQR payment placeholder.',
    sortOrder: 4,
    statusAfterConfirm: 'PENDING',
  },
  creditCard: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'Credit/Debit Card',
    description: 'Card payment placeholder. Never process card data directly in frontend.',
    sortOrder: 5,
    statusAfterConfirm: 'PENDING',
  },
  stripe: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'Stripe',
    description: 'Stripe backend integration placeholder.',
    sortOrder: 6,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/stripe/create',
  },
  paypal: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'PayPal',
    description: 'PayPal backend integration placeholder.',
    sortOrder: 7,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/paypal/create',
  },
  vnpay: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'VNPay',
    description: 'VNPay backend integration placeholder.',
    sortOrder: 8,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/vnpay/create',
  },
  momo: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'MoMo',
    description: 'MoMo backend integration placeholder.',
    sortOrder: 9,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/momo/create',
  },
  zaloPay: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'ZaloPay',
    description: 'ZaloPay backend integration placeholder.',
    sortOrder: 10,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/zalopay/create',
  },
  internationalTransfer: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'International transfer',
    description: 'SWIFT/Wise transfer placeholder for international guests.',
    sortOrder: 11,
    statusAfterConfirm: 'PENDING',
  },
};

export function getDefaultPaymentMethods() {
  return defaultPaymentMethods;
}

function normalizeSetting(setting) {
  const config = setting.configJson || {};
  return {
    key: setting.key,
    displayName: setting.displayName,
    description: setting.description,
    enabled: setting.enabled,
    visibleForGuests: setting.visibleForGuests,
    sortOrder: setting.sortOrder,
    ...config,
  };
}

export async function ensurePaymentMethodSettings() {
  await Promise.all(
    Object.entries(defaultPaymentMethods).map(([key, config]) =>
      prisma.paymentMethodSetting.upsert({
        where: { key },
        update: {},
        create: {
          key,
          displayName: config.displayName,
          description: config.description || null,
          enabled: config.enabled,
          visibleForGuests: config.visibleForGuests,
          sortOrder: config.sortOrder,
          configJson: config,
        },
      }),
    ),
  );
}

export async function getPaymentSettings() {
  await ensurePaymentMethodSettings();
  const settings = await prisma.paymentMethodSetting.findMany({ orderBy: { sortOrder: 'asc' } });
  return settings.map(normalizeSetting);
}

export async function getEnabledPaymentMethods() {
  const settings = await getPaymentSettings();
  return settings.filter((method) => method.enabled && method.visibleForGuests);
}

export async function savePaymentSettings(input) {
  const updates = input.paymentMethods || {};
  await Promise.all(
    Object.entries(updates).map(([key, config]) =>
      prisma.paymentMethodSetting.upsert({
        where: { key },
        update: {
          displayName: config.displayName || defaultPaymentMethods[key]?.displayName || key,
          description: config.description || null,
          enabled: Boolean(config.enabled),
          visibleForGuests: config.visibleForGuests !== false,
          sortOrder: Number(config.sortOrder || defaultPaymentMethods[key]?.sortOrder || 99),
          // Secret API keys must live in backend .env in production, never in frontend or public settings.
          configJson: { ...config, secretKey: undefined, apiSecret: undefined },
        },
        create: {
          key,
          displayName: config.displayName || defaultPaymentMethods[key]?.displayName || key,
          description: config.description || null,
          enabled: Boolean(config.enabled),
          visibleForGuests: config.visibleForGuests !== false,
          sortOrder: Number(config.sortOrder || defaultPaymentMethods[key]?.sortOrder || 99),
          configJson: { ...config, secretKey: undefined, apiSecret: undefined },
        },
      }),
    ),
  );
  return getPaymentSettings();
}

export function generateTransferContent(booking, template) {
  return (template || 'LUNE-{bookingCode}-{guestName}')
    .replace('{bookingCode}', booking.bookingCode)
    .replace('{guestName}', booking.guest?.fullName || 'GUEST')
    .replace(/\s+/g, '-')
    .toUpperCase();
}

function normalizePaymentStatus(status) {
  const value = String(status || 'PENDING').toUpperCase();
  if (value === 'PAY_AT_PROPERTY' || value === 'PAYATPROPERTY') return 'PAY_AT_PROPERTY';
  if (['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(value)) return value;
  return 'PENDING';
}

export async function createPaymentRequest({ bookingCode, method }) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: { guest: true, payments: true },
  });
  if (!booking) throw createHttpError(404, 'Booking not found');

  const settings = await getPaymentSettings();
  const selected = settings.find((item) => item.key === method);
  if (!selected || !selected.enabled) throw createHttpError(400, 'Payment method is not available');

  const statusAfterConfirm = normalizePaymentStatus(selected.statusAfterConfirm);
  await prisma.booking.update({
    where: { bookingCode },
    data: {
      paymentMethod: method,
      paymentStatus: statusAfterConfirm,
    },
  });

  const transferContent =
    method === 'bankTransfer' ? generateTransferContent(booking, selected.transferContentTemplate) : null;

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      method,
      provider: selected.provider || null,
      amount: booking.totalPrice,
      currency: booking.currency,
      status: statusAfterConfirm,
      transferContent,
      rawPayloadJson: { note: 'Mock payment request. Production must call backend provider integration.' },
    },
  });

  return {
    bookingCode,
    method,
    paymentStatus: statusAfterConfirm,
    payment,
    bankInfo:
      method === 'bankTransfer'
        ? {
            bankName: selected.bankName || 'PLACEHOLDER_BANK_NAME',
            accountNumber: selected.accountNumber || 'PLACEHOLDER_ACCOUNT_NUMBER',
            accountHolder: selected.accountHolder || 'LUNE BOUTIQUE HOTEL',
            transferContent,
            qrImageUrl: selected.qrImageUrl || '',
          }
        : null,
    message:
      method === 'payAtProperty' || method === 'cashAtProperty'
        ? 'You can pay directly at the property.'
        : 'Payment request created as a placeholder.',
  };
}

export async function verifyPaymentMock(bookingCode) {
  const booking = await prisma.booking.findUnique({ where: { bookingCode } });
  if (!booking) throw createHttpError(404, 'Booking not found');
  return {
    bookingCode,
    paymentStatus: booking.paymentStatus,
    message: 'Payment verification is pending. Production should rely on bank/provider webhooks.',
  };
}
