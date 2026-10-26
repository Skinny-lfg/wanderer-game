import {after,test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeApp,deleteApp} from 'firebase/app';
import {initializeAuth,connectAuthEmulator,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'firebase/auth';

const app=initializeApp({apiKey:'demo-key',authDomain:'localhost',projectId:'demo-wanderer'},'v013-auth-emulator');
const auth=initializeAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
after(async()=>{await signOut(auth).catch(()=>{});await deleteApp(app);});

test('registered email account can sign in again and request password recovery',async()=>{
 const email='v013-registered@example.test',password='wanderer-test-pass-123';
 const created=await createUserWithEmailAndPassword(auth,email,password);
 assert.equal(created.user.email,email);
 assert.equal(created.user.emailVerified,false,'email account stays gated until verified');
 const uid=created.user.uid;
 await signOut(auth);
 const restored=await signInWithEmailAndPassword(auth,email,password);
 assert.equal(restored.user.uid,uid,'login restores the same account');
 await sendPasswordResetEmail(auth,email);
 await assert.rejects(signInWithEmailAndPassword(auth,email,'wrong-password'),error=>['auth/invalid-credential','auth/wrong-password'].includes(error.code));
});
