import { prisma } from '$lib/server';

export const createTransactionInvalidated = async (
	transactionInvalidated: any,
	userId: string,
	orderId: string
) => {
	// console.log(transactionInvalidated, 'drsgdgdxrgxdr');
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			user: true,
			address: true,
			items: {
				include: {
					product: true
				}
			}
		}
	});

	if (!order) {
		throw new Error(`Order ${orderId} not found`);
	}

	if (!order.address) {
		throw new Error(`Order ${orderId} has no associated address`);
	}

	const createdAt = new Date(transactionInvalidated.createdAt);
	if (isNaN(createdAt.getTime())) {
		throw new Error(
			`Invalid date for payment creation timestamp: ${transactionInvalidated.createdAt}`
		);
	}

	const transactionData = {
		stripePaymentId: transactionInvalidated.stripePaymentId,
		amount: transactionInvalidated.amount,
		currency: transactionInvalidated.currency,
		customer_details_email: transactionInvalidated.customer_details_email,
		customer_details_name: transactionInvalidated.customer_details_name,
		customer_details_phone: transactionInvalidated.customer_details_phone,
		status: transactionInvalidated.status,
		orderId: orderId,
		userId: userId,
		createdAt: createdAt,
		app_user_name: order.user.name,
		app_user_email: order.user.email,
		app_user_recipient: order.address.recipient,
		app_user_street: order.address.street,
		app_user_city: order.address.city,
		app_user_state: order.address.state,
		app_user_zip: order.address.zip,
		app_user_country: order.address.country,
		products: order.items.map((item) => ({
			id: item.productId,
			name: item.product.name,
			price: item.product.price,
			quantity: item.quantity
		}))
	};

	try {
		await prisma.transaction.create({ data: transactionData });
		// console.log(`✅ Transaction ${transactionInvalidated.stripePaymentId} recorded successfully.`);
	} catch (error) {
		console.error(
			`⚠️ Failed to record transaction ${transactionInvalidated.stripePaymentId}:`,
			error
		);
	}
};
