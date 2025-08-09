import prisma from '$server';

export const createTransactionValidated = async (transactionValidated, userId, orderId) => {
	// console.log(`✅ Processing transaction ${transactionValidated.id} for order ${orderId}`);

	// Fetch order and user details
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

	const transactionData = {
		stripePaymentId: transactionValidated.id,
		amount: transactionValidated.amount_total / 100,
		currency: transactionValidated.currency,
		customer_details_email: transactionValidated.customer_details.email,
		customer_details_name: transactionValidated.customer_details.name,
		customer_details_phone: transactionValidated.customer_details.phone,
		status: transactionValidated.payment_status,
		orderId: orderId,
		userId: userId,
		createdAt: new Date(transactionValidated.created * 1000),
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
		// Start a transaction to ensure atomicity
		await prisma.$transaction(async (prisma) => {
			// Create the transaction record
			await prisma.transaction.create({ data: transactionData });
			// console.log(`✅ Transaction ${transactionValidated.id} recorded successfully.`);

			// Deduct the quantities from the products in stock
			for (const item of order.items) {
				const newStock = item.product.stock - item.quantity;
				if (newStock < 0) {
					throw new Error(`Not enough stock for product ID ${item.productId}`);
				}

				await prisma.product.update({
					where: { id: item.productId },
					data: { stock: newStock }
				});
			}

			// Delete order items
			await prisma.orderItem.deleteMany({
				where: { orderId: orderId }
			});
			// console.log(`✅ Order items for order ${orderId} deleted successfully.`);

			// Delete the order
			await prisma.order.delete({
				where: { id: orderId }
			});
			// console.log(`✅ Order ${orderId} deleted successfully.`);
		});
	} catch (error) {
		console.error(`⚠️ Failed to process transaction ${transactionValidated.id}:`, error);
	}
};
