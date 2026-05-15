import { z } from 'zod';

export const createPaymentSchema = {
  safeParse: (payload) =>
    z
      .object({
        body: z.object({
          bookingCode: z.string().min(1),
          method: z.string().min(1),
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
          bookingCode: z.string().min(1),
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
          paymentMethods: z.record(z.string(), z.any()).optional(),
          bankSettings: z.record(z.string(), z.any()).optional(),
        }),
        params: z.object({}).passthrough(),
        query: z.object({}).passthrough(),
      })
      .safeParse(payload),
};
