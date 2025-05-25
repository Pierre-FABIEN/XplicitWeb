// -----------------------------------------------------------------------------
// src/lib/server/lucia.ts  – Initialisation Lucia v3 + Prisma adapter
// -----------------------------------------------------------------------------

import { Lucia } from 'lucia';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma } from '$lib/server';
import { dev } from '$app/environment';

/* Le PrismaAdapter attend les *modèles* Prisma à utiliser */
const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const auth = new Lucia(adapter, {
	env: dev ? 'DEV' : 'PROD',

	/* Cookies de session “rolling” */
	sessionCookie: {
		attributes: {
			secure: !dev,
			httpOnly: true,
			sameSite: 'lax',
			path: '/'
		}
	},

	/* Mapping → données sérialisées côté client */
	getUserAttributes: (dbUser) => ({
		userId: dbUser.id,
		email: dbUser.email,
		username: dbUser.username,
		role: dbUser.role,
		isMfaEnabled: dbUser.isMfaEnabled
	})
});

/* ---------------------- Déclarations globales Lucia ------------------------ */
declare module 'lucia' {
	interface Register {
		Lucia: typeof auth;
		DatabaseUserAttributes: {
			id: number;
			email: string;
			username: string;
			role: string;
			isMfaEnabled: boolean;
		};
	}
}

export type Auth = typeof auth;
