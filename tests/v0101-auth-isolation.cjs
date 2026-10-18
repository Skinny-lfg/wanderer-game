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
assert(config.includes('assertDevFirebaseConfig')&&config.includes('Refusing to connect development'));
assert(!/apiKey:\s*'AIza/.test(config),'Development config may not contain the production key');
assert(rules.includes("request.auth.token.firebase.sign_in_provider != 'anonymous'"),'Anonymous account must be denied by dev rules');
assert(rules.includes("request.auth.token.email_verified == true"),'Email verification must be enforced');
assert(html.includes('v0101-email-auth-1'),'Main HTML must load updated login module');
console.log('PASS v0.10.1 development auth/guest removal, isolation, verified-email rules and privacy guards');
