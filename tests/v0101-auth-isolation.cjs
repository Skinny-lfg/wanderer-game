const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('online/app.mjs'),adapter=read('online/firebase-client.mjs'),config=read('online/firebase-config.mjs'),
 rules=read('firestore.rules'),source=read('online/firebase-sdk-source.mjs'),html=read('index.html');
for(const fragment of ["id=\"emailSignIn\"","id=\"emailRegister\"","id=\"passwordReset\"","id=\"refreshVerification\"","id=\"resendVerification\"",
 "function needsEmailVerification","await restoreProfile(token)","SIGNED_OUT_SLOT","firebaseConfig.projectId.replace","data-player-index"])
 assert(app.includes(fragment),'Missing login integration: '+fragment);
for(const fragment of ['id="guestSignIn"','signInGuest','Play as Guest','data-player="${esc(row.uid)}"'])
 assert(!app.includes(fragment),'Guest or raw public UID found: '+fragment);
for(const method of ['signInWithEmail','createEmailAccount','sendPasswordReset','resendVerification','refreshVerification','getIdToken'])
 assert(adapter.includes(method),'Firebase adapter missing: '+method);
for(const sdkExport of ['createUserWithEmailAndPassword','signInWithEmailAndPassword','sendPasswordResetEmail','sendEmailVerification','getIdToken'])
 assert(source.includes(sdkExport),'Firebase source missing: '+sdkExport);
assert(config.includes('assertProductionFirebaseConfig')&&config.includes('wanderer-play'));
const webAppBlock=config.split('export const firebaseConfig = {')[1]?.split('};')[0];
assert(webAppBlock,'A production Web App configuration must exist');
assert(webAppBlock.includes("projectId: 'wanderer-play'"),'Expected clean wanderer-play production Firebase project');
assert(!webAppBlock.includes('SET_DEVELOPMENT_'),'Production Web App cannot use placeholder identifiers');
assert(!webAppBlock.includes('wanderer-test-8f062'),'Do not use the old production Firebase project');
assert(rules.includes("provider == 'google.com'"),'Google sign-in must be permitted');
assert(rules.includes("provider == 'password'"),'Registered email/password must be permitted');
assert(!rules.includes("provider != 'anonymous'"),'Never accept unknown sign-in providers by default');
assert(rules.includes(".get('email_verified', false) == true"),'Email verification must be enforced');
for(const fragment of ['id="registerNickname"','id="registerEmail"','id="registerPassword"','id="registerPasswordConfirm"',
 'function showRegistrationForm()','Passwords do not match.','backend.createProfile(draft,selectedCharacter)',
 "nicknameDraftKey=uid"])
 assert(app.includes(fragment),'Registration modal or nickname restoration missing: '+fragment);
for(const fragment of ['function showPasswordResetForm(','id=\\"passwordResetForm\\"',
 'id=\\"resetPasswordEmail\\"','id=\\"sendPasswordReset\\"','id=\\"passwordResetSuccess\\"',
 'id=\\"resetBackToLogin\\"','await b.sendPasswordReset(input.value.trim())'])
 assert(app.includes(fragment),'Dedicated password reset dialog missing: '+fragment);
assert(!app.includes('id="passwordResetStatus"'),'Reset feedback should live in dedicated modal');
assert(app.includes('firebase-config.mjs?v=v0110-production-1'),'App must request versioned production config');
assert(adapter.includes('firebase-config.mjs?v=v0110-production-1'),'Backend must request versioned production config');
assert(html.includes('v0101-password-reset-3'),'Main HTML must load dedicated password reset UI');
console.log('PASS v0.11 production auth, clean-project isolation, verified-email rules and privacy guards');
