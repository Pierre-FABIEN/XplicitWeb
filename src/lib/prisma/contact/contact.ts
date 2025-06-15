import { prisma } from '$lib/server';
import type { ContactSubmission } from '@prisma/client';

type CreateContactSubmissionData = Omit<ContactSubmission, 'id' | 'createdAt' | 'updatedAt'>;

export const createContactSubmission = async (data: CreateContactSubmissionData) => {
	try {
		const submission = await prisma.contactSubmission.create({
			data: {
				...data
			}
		});
		return submission;
	} catch (error) {
		console.error('Error creating contact submission:', error);
		throw new Error('Could not create contact submission.');
	}
};
