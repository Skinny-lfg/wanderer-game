// Pure nickname-login validation shared with Node tests; never store passwords.
export const INVALID_LOGIN = 'Incorrect nickname or password.';
export function parseNicknameCredentials(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const nickname = typeof value.nickname === 'string' ? value.nickname.trim().toLowerCase() : '';
  const password = value.password;
  if (!/^[a-z0-9_]{3,20}$/.test(nickname) ||
      typeof password !== 'string' || password.length < 1 || password.length > 128) return null;
  return { nickname, password };
}
export function matchesFirebaseIdentity(response, uid, email) {
  return Boolean(response && typeof response === 'object' &&
    typeof response.localId === 'string' && response.localId === uid &&
    typeof response.email === 'string' && response.email.toLowerCase() === email.toLowerCase());
}
