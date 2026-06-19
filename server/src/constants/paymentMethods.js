export const paymentMethodKeys = [
  'payAtProperty',
  'cashAtProperty',
  'bankTransfer',
  'vietQr',
  'creditCard',
  'stripe',
  'paypal',
  'vnpay',
  'momo',
  'zaloPay',
  'internationalTransfer',
];

export const activeMvpPaymentMethodKeys = ['payAtProperty', 'cashAtProperty', 'bankTransfer', 'vietQr'];

export function isAllowedPaymentMethod(method) {
  return paymentMethodKeys.includes(method);
}
