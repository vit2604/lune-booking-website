import { z } from 'zod';
import { paymentMethodKeys } from '../../constants/paymentMethods.js';

const bookingCodePattern = /^LUNE-\d{8}-\d{4,8}$/;

export const createPaymentSchema = {
  safeParse: (payload) =>
    z
      .object({
        body: z.object({
          bookingCode: z.string().regex(bookingCodePattern),
          method: z.enum(paymentMethodKeys),
          amount: z.number().int().positive().optional(),
          paymentPurpose: z.enum(['deposit', 'full']).optional(),
          depositPercent: z.number().min(0).max(100).optional(),
          balanceAmount: z.number().int().min(0).optional(),
          grandTotal: z.number().int().positive().optional(),
        }),
        params: z.object({}).passthrough(),
        query: z.object({}).passthrough(),
      })
      .safeParse(payload),
};

export const verifyPaymentSchema = {
  safeParse: (payload) =>
    z
      .object({
        body: z.object({
          bookingCode: z.string().regex(bookingCodePattern),
        }),
        params: z.object({}).passthrough(),
        query: z.object({}).passthrough(),
      })
      .safeParse(payload),
};

export const paymentSettingsSchema = {
  safeParse: (payload) =>
    z
      .object({
        body: z.object({
          paymentMethods: z.record(z.string(), z.record(z.string(), z.any())).optional(),
          bankSettings: z.record(z.string(), z.any()).optional(),
        }),
        params: z.object({}).passthrough(),
        query: z.object({}).passthrough(),
      })
      .safeParse(payload),
};
