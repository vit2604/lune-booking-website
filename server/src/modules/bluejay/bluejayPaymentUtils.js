export function getBluejayPaymentSummary(payments = [], totalPrice = 0) {
  const paidAmount = Math.round(
    payments
      .filter((payment) => payment.status === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );
  return {
    paidAmount,
    remainingAmount: Math.max(0, Math.round(Number(totalPrice) || 0) - paidAmount),
  };
}
