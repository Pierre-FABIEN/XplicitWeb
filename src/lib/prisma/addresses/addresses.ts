import { prisma } from '$lib/server';

interface UpdateAddressData {
	recipient: string;
	street: string;
	city: string;
	state: string;
	zip: string;
	country: string;
}

export const getUserAddresses = async (userId: string) => {
	return await prisma.address.findMany({
		where: {
			userId
		}
	});
};

export const deleteAddress = async (addressId: string) => {
	return await prisma.address.delete({
		where: {
			id: addressId
		}
	});
};

export const getAddressById = async (addressId: string) => {
	return await prisma.address.findUnique({
		where: {
			id: addressId
		}
	});
};

export const updateAddress = async (id: string, data: UpdateAddressData) => {
	try {
		const updatedAddress = await prisma.address.update({
			where: { id },
			data
		});
		return updatedAddress;
	} catch (error) {
		console.error('Error updating address:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
};

export const createAddress = async (data: {
	recipient: string;
	street: string;
	city: string;
	state: string;
	zip: string;
	country: string;
	userId: string;
}) => {
	return await prisma.address.create({
		data
	});
};
