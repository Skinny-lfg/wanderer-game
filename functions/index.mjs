// Development-only callable. Never returns the email, password or Firebase refresh token.
// Firebase Authentication verifies passwords; Firestore stores only public nickname -> uid.
// IMPORTANT: Deployed Functions require Firebase Blaze, and the Web API key environment
// variable must be configured. This file does not authorize deployment to production.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { INVALID_LOGIN, parseNicknameCredentials, matchesFirebaseIdentity } from './nickname-identity.mjs';

initializeApp();
const DEVELOPMENT_PROJECT = 'wanderer-development-8e3ee';
const invalid = () => new HttpsError('unauthenticated', INVALID_LOGIN);

export const signInWithNickname = onCall({
  region: 'europe-west1',
  timeoutSeconds: 20,
  memory: '256MiB',
  maxInstances: 2,
}, async request => {
  // Fail closed if someone tries to deploy this development function elsewhere.
  const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (project !== DEVELOPMENT_PROJECT) {
    throw new HttpsError('failed-precondition', 'Nickname login is not configured for this project.');
  }
  const credentials = parseNicknameCredentials(request.data);
  if (!credentials) throw invalid();
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new HttpsError('failed-precondition', 'Nickname login has not been configured.');

  let uid, email;
  try {
    const claim = await getFirestore().doc('nicknames/' + credentials.nickname).get();
    uid = claim.exists ? claim.get('uid') : null;
    if (typeof uid !== 'string' || !uid || uid.includes('/') || uid.length > 128) throw invalid();
    const record = await getAuth().getUser(uid);
    if (record.disabled || !record.email || !record.emailVerified) throw invalid();
    email = record.email;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    // Missing nickname and missing user are deliberately indistinguishable.
    if (error?.code === 'auth/user-not-found') throw invalid();
    throw new HttpsError('unavailable', 'Sign-in service unavailable. Try again.');
  }

  // Never log credentials or return email to the caller.
  let result;
  try {
    result = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: credentials.password, returnSecureToken: true }),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new HttpsError('unavailable', 'Sign-in service unavailable. Try again.');
  }
  if (!result.ok) {
    // Firebase enforces its own bad-password throttling. Hide account existence,
    // verification state and provider details behind one generic error.
    if (result.status >= 500) throw new HttpsError('unavailable', 'Sign-in service unavailable. Try again.');
    throw invalid();
  }
  let verified;
  try { verified = await result.json(); } catch { throw invalid(); }
  if (!matchesFirebaseIdentity(verified, uid, email)) throw invalid();
  try {
    // A restricted claim allows Firestore Rules to distinguish this verified
    // nickname login from arbitrary custom-token authentication providers.
    const customToken = await getAuth().createCustomToken(uid, { wandererNicknameLogin: true });
    return { customToken };
  } catch {
    throw new HttpsError('internal', 'Sign-in could not be completed. Try again.');
  }
});
