import { z } from 'zod';

export const OrderSchema = z.object({
	orderId: z.string().min(1, "L'ID de commande est requis"),
	addressId: z.string().min(1, "L'adresse est requise"),
	shippingOption: z.string().min(1, 'Veuillez choisir une option de livraison'),
	shippingCost: z.string().min(1, 'Le coût de la livraison est requis')
});

export type PaymentSchema = z.infer<typeof OrderSchema>;
