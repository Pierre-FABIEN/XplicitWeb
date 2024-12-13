import lucia from 'lucia-auth';
import { prisma } from '$lib/server';
import { sveltekit } from 'lucia/middleware';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';

export const auth = lucia({
	adapter: PrismaAdapter(prisma),
	env: import.meta.env.DEV ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	providers: {
		google: {
			clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
			clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
			redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
			scope: ['profile', 'email']
		}
	},
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			email: userData.email,
			username: userData.username,
			googleId: userData.googleId,
			emailVerified: userData.emailVerified
		};
	}
});

export type Auth = typeof auth;
