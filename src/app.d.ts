// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: import('$lib/lucia/session').Session | null;
			user: import('$lib/lucia/user').User | null;
			role: string | null;
			isMfaEnabled: boolean;
			registered2FA: boolean;
			pendingOrder: import('@prisma/client').Order | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
