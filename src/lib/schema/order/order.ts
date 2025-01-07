import { z } from 'zod';

export const OrderSchema = z.object({
	orderId: z.string(),
	addressId: z.string()
});

export type PaymentSchema = z.infer<typeof OrderSchema>;
