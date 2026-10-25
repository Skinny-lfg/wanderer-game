import {after,test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeApp,deleteApp} from 'firebase/app';
import {initializeAuth,connectAuthEmulator,signInAnonymously,createUserWithEmailAndPassword,signInWithEmailAndPassword,linkWithCredential,EmailAuthProvider,signOut} from 'firebase/auth';

const app=initializeApp({apiKey:'demo-key',authDomain:'localhost',projectId:'demo-wanderer'},'v012-auth-emulator');
const auth=initializeAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
after(async()=>{await signOut(auth).catch(()=>{});await deleteApp(app);});

test('Guest identity links to email without changing UID and can sign in again',async()=>{
 const guest=(await signInAnonymously(auth)).user,uid=guest.uid;
 const linked=await linkWithCredential(guest,EmailAuthProvider.credential('wanderer-link@example.test','valid-pass-123'));
 assert.equal(linked.user.uid,uid);assert.equal(linked.user.isAnonymous,false);
 await signOut(auth);
 const restored=await signInWithEmailAndPassword(auth,'wanderer-link@example.test','valid-pass-123');assert.equal(restored.user.uid,uid);
});

test('link conflict preserves Guest UID and reports existing credential',async()=>{
 await createUserWithEmailAndPassword(auth,'wanderer-existing@example.test','valid-pass-456');
 await signOut(auth);
 const guest=(await signInAnonymously(auth)).user,uid=guest.uid;
 await assert.rejects(linkWithCredential(guest,EmailAuthProvider.credential('wanderer-existing@example.test','valid-pass-456')),error=>error.code==='auth/email-already-in-use'||error.code==='auth/credential-already-in-use');
 assert.equal(auth.currentUser.uid,uid);assert.equal(auth.currentUser.isAnonymous,true);
});
