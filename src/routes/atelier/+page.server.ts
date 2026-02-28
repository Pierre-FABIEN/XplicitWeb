import { getAllProducts } from '$lib/prisma/products/products';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { createCustomSchema } from '$lib/schema/products/customSchema';
import cloudinary from '$lib/server/cloudinary';

export const load = (async () => {
	const IcreateCustomSchema = await superValidate(zod(createCustomSchema));

	const products = await getAllProducts();

	return {
		IcreateCustomSchema,
		products
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	createCustom: async ({ request, locals }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(createCustomSchema));

		if (!form.valid) {
			return fail(400, { form, error: 'Données invalides' });
		}

		// console.log('Form data:', form.data);

		const { productId, quantity, userMessage } = form.data;
		const images = formData.getAll('image') as File[];
		const uploadedImageUrls: string[] = [];

		// Upload images to Cloudinary
		for (const image of images) {
			if (image instanceof File) {
				try {
					const buffer = await image.arrayBuffer();
					const base64String = Buffer.from(buffer).toString('base64');

					const uploadResponse = await cloudinary.uploader.upload(
						`data:${image.type};base64,${base64String}`,
						{
							folder: 'client',
							public_id: `product_${productId}_${image.name.split('.')[0]}`,
							tags: [`user_${locals.userId}`],
							type: 'upload', // Assure que l'image est accessible publiquement
							access_mode: 'public' // Définit le mode d'accès comme public
						}
					);

					uploadedImageUrls.push(uploadResponse.secure_url);
				} catch (error) {
					return fail(500, { message: 'Image upload failed' });
				}
			}
		}

		// Serialize images for database
		const serializedImages = uploadedImageUrls[0];

		const products = await getAllProducts();

		const returnData = {
			id: crypto.randomUUID(),
			quantity,
			price: products.find((product) => product.id === productId)?.price,
			product: {
				id: productId,
				name: `${products.find((product) => product.id === productId)?.name}`,
				price: products.find((product) => product.id === productId)?.price,
				images: products.find((product) => product.id === productId)?.images[0],
				stock: products.find((product) => product.id === productId)?.stock
			},
			custom: [
				{
					id: crypto.randomUUID(),
					image: serializedImages,
					userMessage
				}
			]
		};
		return message(form, {
			message: 'Personnalisation ajoutée avec succès',
			data: returnData
		});
	}
};
