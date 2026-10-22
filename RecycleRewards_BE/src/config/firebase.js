import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function getCredential() {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		return cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
	}
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
		const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8');
		return cert(parseServiceAccount(json));
	}
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		const filePath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
		return cert(parseServiceAccount(readFileSync(filePath, 'utf8')));
	}
	return applicationDefault();
}

function parseServiceAccount(value) {
	try {
		return JSON.parse(value);
	} catch {
		const error = new Error('FIREBASE_SERVICE_ACCOUNT_JSON phải là JSON hợp lệ.');
		error.code = 'app/invalid-credential';
		throw error;
	}
}

const firebaseApp = getApps().length ? getApps()[0] : initializeApp({
		credential: getCredential(),
		projectId: process.env.FIREBASE_PROJECT_ID || 'recycle-rewards-2026',
});
const firebaseAuth = getAuth(firebaseApp);

export function verifyIdToken(idToken) {
	return firebaseAuth.verifyIdToken(idToken);
}

export function createFirebaseUser(data) {
	return firebaseAuth.createUser(data);
}

export function updateFirebaseUser(uid, data) {
	return firebaseAuth.updateUser(uid, data);
}

export function deleteFirebaseUser(uid) {
	return firebaseAuth.deleteUser(uid);
}

export function generatePasswordResetLink(email) {
	return firebaseAuth.generatePasswordResetLink(email);
}
