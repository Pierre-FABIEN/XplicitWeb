import { google } from '$lib/lucia/oauth';
import { ObjectParser } from '@pilcrowjs/object-parser';
import { createUserOAuth, getUserFromGoogleId, getUserFromEmail } from '$lib/lucia/user';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/lucia/session';
import { decodeIdToken } from 'arctic';

import type { RequestEvent } from './$types';
import type { OAuth2Tokens } from 'arctic';

export async function GET(event: RequestEvent): Promise<Response> {
	const storedState = event.cookies.get('google_oauth_state') ?? null;
	const codeVerifier = event.cookies.get('google_code_verifier') ?? null;
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');

	if (!storedState || !codeVerifier || !code || !state || storedState !== state) {
		return new Response('Invalid request. Please restart the process.', { status: 400 });
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
	} catch (e) {
		return new Response('Authorization failed. Please try again.', { status: 400 });
	}

	const claims = decodeIdToken(tokens.idToken());
	const claimsParser = new ObjectParser(claims);

	const googleId = claimsParser.getString('sub');
	const name = claimsParser.getString('name');
	const picture = claimsParser.getString('picture');
	const email = claimsParser.getString('email');

	// Vérifier si l'utilisateur existe déjà par Google ID
	let user = await getUserFromGoogleId(googleId);
	if (!user) {
		// Vérifier si l'utilisateur existe déjà par email
		user = await getUserFromEmail(email);
		if (!user) {
			// Créer un nouvel utilisateur OAuth
			user = await createUserOAuth(googleId, email, name, picture);
		}
	}

	// Créer une session pour l'utilisateur
	const sessionToken = generateSessionToken();
	const session = await createSession(
		sessionToken,
		user.id,
		{ twoFactorVerified: false },
		'google'
	);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	// Rediriger vers la page d'accueil
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
