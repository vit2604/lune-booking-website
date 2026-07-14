import { PayOS } from '@payos/node';
import QRCode from 'qrcode';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { isAllowedPaymentMethod } from '../../constants/paymentMethods.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { syncBookingToBluejay } from '../bookings/booking.service.js';

const DEFAULT_TRANSFER_CONTENT = 'Dang Trung Vuong chuyen tien';

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
    transferContentTemplate: DEFAULT_TRANSFER_CONTENT,
    qrImageUrl: '',
  },
  vietQr: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'QR payment',
    description: 'Pay securely by QR code.',
    sortOrder: 4,
    statusAfterConfirm: 'PENDING',
    provider: 'payOS',
  },
  creditCard: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Credit/Debit Card',
    description: 'International card at property. A 5% card fee applies.',
    sortOrder: 5,
    statusAfterConfirm: 'PAY_AT_PROPERTY',
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

let payosClient;

export function getDefaultPaymentMethods() {
  return defaultPaymentMethods;
}

function normalizeSetting(setting) {
  const config = stripSensitiveFields(setting.configJson || {}) || {};
  const shouldExposePayos = setting.key === 'vietQr' && payosIsConfigured();
  const shouldExposeCreditCard = setting.key === 'creditCard';
  const shouldPayAtProperty = ['payAtProperty', 'cashAtProperty', 'creditCard'].includes(setting.key);
  const enabled = setting.key === 'vietQr' ? shouldExposePayos : shouldExposeCreditCard ? true : setting.enabled;
  const visibleForGuests =
    setting.key === 'vietQr' ? shouldExposePayos && setting.visibleForGuests : shouldExposeCreditCard ? true : setting.visibleForGuests;
  return {
    key: setting.key,
    ...config,
    displayName: shouldExposePayos ? 'QR payment' : shouldExposeCreditCard ? 'International card' : setting.displayName,
    description: shouldExposePayos
      ? 'Pay securely by QR code.'
      : shouldExposeCreditCard
        ? 'International card at property. A 5% card fee applies.'
        : setting.description,
    statusAfterConfirm: shouldPayAtProperty
      ? 'PAY_AT_PROPERTY'
      : normalizePaymentStatus(config.statusAfterConfirm || defaultPaymentMethods[setting.key]?.statusAfterConfirm),
    enabled,
    visibleForGuests,
    sortOrder: setting.sortOrder,
    payosConfigured: setting.key === 'vietQr' ? payosIsConfigured() : undefined,
  };
}

const sensitiveFieldPattern = /(secret|password|token|privatekey|private_key|apikey|api_key|clientsecret|client_secret|webhooksecret|webhook_secret)/i;
const urlFieldPattern = /(url|endpoint)$/i;

function cleanString(value, maxLength = 1000) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function sanitizeUrl(value, key) {
  const url = cleanString(value, key === 'qrImageUrl' ? 250000 : 500);
  if (!url) return '';
  if (key === 'qrImageUrl' && (url.startsWith('/images/') || url.startsWith('data:image/'))) return url;
  if (url.startsWith('/api/')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return parsed.toString();
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return parsed.toString();
  } catch {
    return '';
  }

  return '';
}

function stripSensitiveFields(value, key = '') {
  if (sensitiveFieldPattern.test(key)) return undefined;
  if (Array.isArray(value)) return value.map((item) => stripSensitiveFields(item)).filter((item) => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([itemKey, itemValue]) => [itemKey, stripSensitiveFields(itemValue, itemKey)])
        .filter(([, itemValue]) => itemValue !== undefined),
    );
  }
  if (typeof value === 'string') return urlFieldPattern.test(key) ? sanitizeUrl(value, key) : cleanString(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value;
  return value ?? null;
}

function normalizePaymentStatus(status) {
  const value = String(status || 'PENDING').toUpperCase();
  if (value === 'PAY_AT_PROPERTY' || value === 'PAYATPROPERTY') return 'PAY_AT_PROPERTY';
  if (['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(value)) return value;
  return 'PENDING';
}

function payosIsConfigured() {
  return Boolean(env.PAYOS_ENABLED && env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && env.PAYOS_CHECKSUM_KEY);
}

function getPayosClient() {
  if (!payosIsConfigured()) return null;
  if (!payosClient) {
    payosClient = new PayOS({
      clientId: env.PAYOS_CLIENT_ID,
      apiKey: env.PAYOS_API_KEY,
      checksumKey: env.PAYOS_CHECKSUM_KEY,
      timeout: env.PAYOS_TIMEOUT_MS,
      logLevel: env.NODE_ENV === 'production' ? 'off' : 'warn',
    });
  }
  return payosClient;
}

function buildPayosOrderCode(bookingCode, amount) {
  const digits = String(bookingCode || '').replace(/\D/g, '');
  const amountSuffix = String(Math.max(0, Math.round(Number(amount) || 0)) % 10000).padStart(4, '0');
  const timeSuffix = String(Date.now() % 1000).padStart(3, '0');
  const value = Number(`${digits.slice(-6)}${amountSuffix}${timeSuffix}`);
  if (Number.isSafeInteger(value) && value > 0) return value;
  return Date.now();
}

function buildPayosDescription() {
  return DEFAULT_TRANSFER_CONTENT.slice(0, 25);
}

function getFrontendUrl(path = '/') {
  const firstOrigin = String(env.CORS_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);
  return `${firstOrigin || 'http://localhost:5173'}${path}`;
}

async function createPayosPaymentLink(booking, paymentContext = {}) {
  const payos = getPayosClient();
  if (!payos) {
    return {
      provider: 'payOS',
      configured: false,
      message: 'Online QR payment is not configured. Please contact Lune support.',
    };
  }

  const paymentAmount = Math.max(1, Math.round(Number(paymentContext.amount || booking.totalPrice || 0)));
  const orderCode = buildPayosOrderCode(booking.bookingCode, paymentAmount);
  const description = buildPayosDescription();
  const returnUrl = env.PAYOS_RETURN_URL || getFrontendUrl(`/success?bookingCode=${encodeURIComponent(booking.bookingCode)}`);
  const cancelUrl = env.PAYOS_CANCEL_URL || getFrontendUrl('/payment');

  let paymentLink;
  try {
    paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: paymentAmount,
      description,
      returnUrl,
      cancelUrl,
      buyerName: booking.guest?.fullName || undefined,
      buyerEmail: booking.guest?.email || undefined,
      buyerPhone: booking.guest?.phoneNumber ? `${booking.guest.phoneCode || ''}${booking.guest.phoneNumber}` : undefined,
      items: [
        {
          name: String(
            paymentContext.paymentPurpose === 'deposit'
              ? `Deposit ${booking.room?.name || booking.bookingCode}`
              : booking.room?.name || booking.bookingCode,
          ).slice(0, 80),
          quantity: 1,
          price: paymentAmount,
        },
      ],
    });
  } catch (error) {
    throw createHttpError(502, 'Could not create QR payment. Please try bank transfer or contact Lune support.', {
      provider: 'payOS',
      code: error.code,
      desc: error.desc,
    });
  }

  return {
    provider: 'payOS',
    configured: true,
    orderCode,
    amount: paymentAmount,
    description,
    paymentPurpose: paymentContext.paymentPurpose || 'full',
    depositPercent: paymentContext.depositPercent ?? null,
    balanceAmount: paymentContext.balanceAmount ?? null,
    bookingTotal: booking.totalPrice,
    paymentLinkId: paymentLink.paymentLinkId,
    checkoutUrl: paymentLink.checkoutUrl,
    qrCode: paymentLink.qrCode,
    qrImage: paymentLink.qrCode
      ? await QRCode.toDataURL(paymentLink.qrCode, { width: 320, margin: 1, errorCorrectionLevel: 'M' })
      : '',
    accountNumber: paymentLink.accountNumber,
    accountName: paymentLink.accountName,
    bin: paymentLink.bin,
    status: paymentLink.status,
  };
}

function sanitizePaymentMethodConfig(key, rawConfig = {}) {
  const defaults = defaultPaymentMethods[key] || {};
  const config = stripSensitiveFields(rawConfig) || {};
  const sortOrder = Math.max(1, Math.min(99, Number(config.sortOrder || defaults.sortOrder || 99)));

  return {
    ...config,
    displayName: cleanString(config.displayName || defaults.displayName || key, 80),
    description: cleanString(config.description || defaults.description || '', 240),
    paymentNote: cleanString(config.paymentNote || defaults.paymentNote || '', 300),
    enabled: Boolean(config.enabled),
    visibleForGuests: config.visibleForGuests !== false,
    sortOrder,
    statusAfterConfirm: normalizePaymentStatus(config.statusAfterConfirm || defaults.statusAfterConfirm),
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
    Object.entries(updates)
      .filter(([key]) => isAllowedPaymentMethod(key))
      .map(([key, rawConfig]) => {
        const config = sanitizePaymentMethodConfig(key, rawConfig);
        return prisma.paymentMethodSetting.upsert({
          where: { key },
          update: {
            displayName: config.displayName,
            description: config.description || null,
            enabled: config.enabled,
            visibleForGuests: config.visibleForGuests,
            sortOrder: config.sortOrder,
            // Production secret keys must live in backend .env, never in DB settings returned to clients.
            configJson: config,
          },
          create: {
            key,
            displayName: config.displayName,
            description: config.description || null,
            enabled: config.enabled,
            visibleForGuests: config.visibleForGuests,
            sortOrder: config.sortOrder,
            configJson: config,
          },
        });
      }),
  );
  return getPaymentSettings();
}

export function generateTransferContent(booking, template) {
  return (template || DEFAULT_TRANSFER_CONTENT)
    .replace('{bookingCode}', booking.bookingCode)
    .replace('{guestName}', booking.guest?.fullName || 'GUEST')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9_.{}-]/g, '')
    .toUpperCase()
    .slice(0, 120);
}

function normalizeRequestedPaymentAmount({ booking, amount, grandTotal }) {
  const bookingTotal = Math.max(1, Math.round(Number(booking.totalPrice || 0)));
  const requestedAmount = amount === undefined ? bookingTotal : Math.round(Number(amount));
  const maxAmount = Math.max(bookingTotal, Math.round(Number(grandTotal || bookingTotal)));
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw createHttpError(400, 'Invalid payment amount');
  }
  if (requestedAmount > maxAmount) {
    throw createHttpError(400, 'Payment amount cannot exceed booking total');
  }
  return requestedAmount;
}

export async function createPaymentRequest({
  bookingCode,
  method,
  amount,
  paymentPurpose = 'full',
  depositPercent,
  balanceAmount,
  grandTotal,
}) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: { guest: true, payments: true, room: true },
  });
  if (!booking) throw createHttpError(404, 'Booking not found');
  if (booking.bookingStatus === 'CANCELLED') throw createHttpError(409, 'Cancelled bookings cannot be paid');
  if (!isAllowedPaymentMethod(method)) throw createHttpError(400, 'Payment method is not supported');
  if (!booking.totalPrice || booking.totalPrice <= 0) throw createHttpError(400, 'Invalid booking amount');
  const paymentAmount = normalizeRequestedPaymentAmount({ booking, amount, grandTotal });
  const normalizedPurpose = paymentPurpose === 'deposit' && paymentAmount < booking.totalPrice ? 'deposit' : 'full';
  const normalizedDepositPercent =
    normalizedPurpose === 'deposit' && Number.isFinite(Number(depositPercent)) ? Number(depositPercent) : null;
  const normalizedBalanceAmount =
    normalizedPurpose === 'deposit' && Number.isFinite(Number(balanceAmount))
      ? Math.max(0, Math.round(Number(balanceAmount)))
      : null;

  const settings = await getPaymentSettings();
  const selected = settings.find((item) => item.key === method);
  if (!selected || !selected.enabled || !selected.visibleForGuests) {
    throw createHttpError(400, 'Payment method is not available');
  }

  const statusAfterConfirm = normalizePaymentStatus(selected.statusAfterConfirm);
  const transferContent = null;

  const reusablePayment = await prisma.payment.findFirst({
    where: {
      bookingId: booking.id,
      method,
      status: { not: 'PAID' },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (
    method === 'vietQr' &&
    reusablePayment?.rawPayloadJson?.configured &&
    Number(reusablePayment.amount) === paymentAmount &&
    reusablePayment.rawPayloadJson.description === buildPayosDescription()
  ) {
    if (reusablePayment.transferContent) {
      await prisma.payment.update({ where: { id: reusablePayment.id }, data: { transferContent: null } });
    }
    const providerPayload = reusablePayment.rawPayloadJson;
    return {
      bookingCode,
      method,
      paymentStatus: reusablePayment.status,
      amountDueNow: reusablePayment.amount,
      paymentPurpose: providerPayload.paymentPurpose || normalizedPurpose,
      depositPercent: providerPayload.depositPercent ?? normalizedDepositPercent,
      balanceAmount: providerPayload.balanceAmount ?? normalizedBalanceAmount,
      bookingTotal: providerPayload.bookingTotal || booking.totalPrice,
      payment: {
        id: reusablePayment.id,
        method: reusablePayment.method,
        amount: reusablePayment.amount,
        currency: reusablePayment.currency,
        status: reusablePayment.status,
        transferContent: null,
        provider: reusablePayment.provider,
        transactionRef: reusablePayment.transactionRef,
        checkoutUrl: providerPayload.checkoutUrl,
        qrCode: providerPayload.qrCode,
        payos: providerPayload,
        createdAt: reusablePayment.createdAt,
        updatedAt: reusablePayment.updatedAt,
      },
      bankInfo: null,
      message: 'Existing QR payment link returned.',
    };
  }

  const paymentContext = {
    amount: paymentAmount,
    paymentPurpose: normalizedPurpose,
    depositPercent: normalizedDepositPercent,
    balanceAmount: normalizedBalanceAmount,
    grandTotal: grandTotal ? Math.round(Number(grandTotal)) : booking.totalPrice,
    bookingTotal: booking.totalPrice,
  };

  const providerPayload = method === 'vietQr' ? await createPayosPaymentLink(booking, paymentContext) : null;

  const payment = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { bookingCode },
      data: {
        paymentMethod: method,
        paymentStatus: statusAfterConfirm,
      },
    });

    const paymentData = {
      provider: cleanString(selected.provider || selected.providerName || '', 80) || null,
      amount: paymentAmount,
      currency: booking.currency,
      status: statusAfterConfirm,
      transferContent,
      transactionRef: providerPayload?.paymentLinkId || null,
      rawPayloadJson: providerPayload || {
        note: 'Mock payment request. Production must call backend provider integration.',
        ...paymentContext,
      },
    };

    const existingPayment = await tx.payment.findFirst({
      where: {
        bookingId: booking.id,
        method,
        status: { not: 'PAID' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment) {
      return tx.payment.update({ where: { id: existingPayment.id }, data: paymentData });
    }

    return tx.payment.create({
      data: {
        bookingId: booking.id,
        method,
        ...paymentData,
      },
    });
  });

  const updatedBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      room: { include: { images: true, ratePeriods: true } },
      roomItems: { include: { room: { include: { images: true, ratePeriods: true } } } },
      guest: true,
      payments: true,
    },
  });
  const syncedBooking = await syncBookingToBluejay(updatedBooking);

  return {
    bookingCode,
    method,
    paymentStatus: statusAfterConfirm,
    bookingStatus: syncedBooking.bookingStatus,
    amountDueNow: paymentAmount,
    paymentPurpose: normalizedPurpose,
    depositPercent: normalizedDepositPercent,
    balanceAmount: normalizedBalanceAmount,
    bookingTotal: booking.totalPrice,
    payment: {
      id: payment.id,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transferContent: payment.transferContent,
      provider: payment.provider,
      transactionRef: payment.transactionRef,
      checkoutUrl: providerPayload?.checkoutUrl,
      qrCode: providerPayload?.qrCode,
      payos: providerPayload,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    },
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
        : method === 'vietQr' && providerPayload?.configured
          ? 'QR payment link created.'
          : method === 'vietQr'
            ? providerPayload?.message || 'Online QR payment is not configured.'
        : 'Payment request created as a placeholder.',
  };
}

export async function verifyPaymentStatus(bookingCode) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      room: { include: { images: true, ratePeriods: true } },
      roomItems: { include: { room: { include: { images: true, ratePeriods: true } } } },
      guest: true,
      payments: true,
    },
  });
  if (!booking) throw createHttpError(404, 'Booking not found');
  const payment = [...booking.payments]
    .filter((item) => item.method === 'vietQr')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  const providerReference = payment?.rawPayloadJson?.paymentLinkId || payment?.rawPayloadJson?.orderCode;
  if (!payment || !providerReference || !payosIsConfigured()) {
    return { bookingCode, paymentStatus: booking.paymentStatus, amountPaid: payment?.status === 'PAID' ? payment.amount : 0 };
  }
  const providerPayment = await getPayosClient().paymentRequests.get(providerReference);
  const nextStatus = mapPayosStatus(providerPayment.status);
  const providerAmountPaid = Math.max(0, Math.round(Number(providerPayment.amountPaid || 0)));
  const amountPaid = nextStatus === 'PAID' ? Math.max(providerAmountPaid, Number(payment.amount)) : providerAmountPaid;
  const paidAt = nextStatus === 'PAID' ? payment.paidAt || new Date() : payment.paidAt;
  const updatedBooking = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        paidAt,
        transferContent: null,
        rawPayloadJson: { ...(payment.rawPayloadJson || {}), providerVerification: providerPayment },
      },
    });
    return tx.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: nextStatus },
      include: {
        room: { include: { images: true, ratePeriods: true } },
        roomItems: { include: { room: { include: { images: true, ratePeriods: true } } } },
        guest: true,
        payments: true,
      },
    });
  });
  const syncedBooking = nextStatus === 'PAID' ? await syncBookingToBluejay(updatedBooking) : updatedBooking;
  return {
    bookingCode,
    paymentStatus: nextStatus,
    bookingStatus: syncedBooking.bookingStatus,
    amountPaid,
    paymentPurpose: payment.rawPayloadJson?.paymentPurpose || 'full',
    depositPercent: payment.rawPayloadJson?.depositPercent ?? null,
    balanceAmount: payment.rawPayloadJson?.balanceAmount ?? null,
  };
}

function mapPayosStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'PAID') return 'PAID';
  if (value === 'CANCELLED' || value === 'FAILED' || value === 'EXPIRED') return 'FAILED';
  return 'PENDING';
}

export async function handlePayosWebhook(payload) {
  const payos = getPayosClient();
  if (!payos) throw createHttpError(503, 'Online QR payment is not configured');

  const verified = await payos.webhooks.verify(payload);
  const paymentLinkId = verified.paymentLinkId || verified.data?.paymentLinkId;
  const orderCode = verified.orderCode || verified.data?.orderCode;
  const status = mapPayosStatus(verified.status || (verified.data?.code === '00' ? 'PAID' : 'PENDING'));

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        paymentLinkId ? { transactionRef: paymentLinkId } : undefined,
        orderCode ? { rawPayloadJson: { path: ['orderCode'], equals: Number(orderCode) } } : undefined,
      ].filter(Boolean),
    },
    include: { booking: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!payment) {
    return { received: true, matched: false, orderCode, paymentLinkId };
  }

  const nextStatus = payment.status === 'PAID' && status !== 'PAID' ? 'PAID' : status;
  const paidAt = nextStatus === 'PAID' ? payment.paidAt || new Date() : payment.paidAt;

  const updatedBooking = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        paidAt,
        transferContent: null,
        rawPayloadJson: { ...(payment.rawPayloadJson || {}), lastWebhook: verified },
      },
    });

    return tx.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: nextStatus },
      include: {
        room: { include: { images: true, ratePeriods: true } },
        roomItems: { include: { room: { include: { images: true, ratePeriods: true } } } },
        guest: true,
        payments: true,
      },
    });
  });

  if (nextStatus === 'PAID') {
    await syncBookingToBluejay(updatedBooking);
  }

  return { received: true, matched: true, bookingCode: payment.booking.bookingCode, paymentStatus: nextStatus };
}
