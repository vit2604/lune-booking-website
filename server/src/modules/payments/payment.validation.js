import { z } from 'zod';
import { paymentMethodKeys } from '../../constants/paymentMethods.js';

export const createPaymentSchema = {
  safeParse: (payload) =>
    z
      .object({
        body: z.object({
          bookingCode: z.string().regex(/^LUNE-\d{8}-\d{4}$/),
          method: z.enum(paymentMethodKeys),
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
          bookingCode: z.string().regex(/^LUNE-\d{8}-\d{4}$/),
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
