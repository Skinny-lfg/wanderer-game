import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Exercise the production adapter with an in-memory SDK transaction boundary.
test('profile reads and duplicate registration preserve account ownership',async()=>{
 const records=new Map(),writes=[];let fromCache=false,verificationMessages=0,passwordResetAddress='',forcedTokenRefreshes=0;
 const snapshot=ref=>({exists:()=>records.has(ref),data:()=>records.get(ref),metadata:{fromCache}});
 globalThis.__profileSdkTest={initializeApp:()=>({}),getAuth:()=>({currentUser:{uid:'alice',emailVerified:true}}),getFirestore:()=>({}),setPersistence:async()=>{},signInWithEmailAndPassword:async()=>({user:{uid:'alice'}}),createUserWithEmailAndPassword:async()=>({user:{uid:'alice'}}),sendPasswordResetEmail:async(_auth,email)=>{passwordResetAddress=email;},sendEmailVerification:async()=>{verificationMessages++;},reload:async()=>{},getIdToken:async(_account,force)=>{if(force)forcedTokenRefreshes++;return "mock-token";},doc:(_,...parts)=>parts.join('/'),getDoc:async ref=>snapshot(ref),serverTimestamp:()=>123,
  runTransaction:async(_,fn)=>{const staged=[];await fn({get:async ref=>snapshot(ref),set:(ref,value)=>staged.push([ref,value])});for(const [ref,value]of staged){records.set(ref,value);writes.push(ref);}}
 };
 let source=await readFile(new URL('../online/firebase-client.mjs',import.meta.url),'utf8');
 source=source.replace("import * as bundledSdk from './vendor/firebase-sdk.mjs';",'const bundledSdk=globalThis.__profileSdkTest;');
 source=source.replace("import * as configModule from './firebase-config.mjs?v=v0101-dev-config-2';", "const configModule={firebaseConfig:{projectId:'demo-test'},assertDevFirebaseConfig:()=>{}};");
 for(const name of ['firebase-config','model','public-loadout'])source=source.replace(new RegExp(`'\\./${name}\\.mjs(?:\\?v=[^']+)?'`),JSON.stringify(new URL(`../online/${name}.mjs`,import.meta.url).href));
 try{
 const {createBackend}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));const backend=await createBackend();
 assert.equal((await backend.signInWithEmail('example@example.com','password123')).user.uid,'alice');
 assert.equal((await backend.createEmailAccount(' example@example.com ','password123')).uid,'alice');
 await backend.resendVerification();
 assert.equal(verificationMessages,2,'registration and resend each send one verification email');
 await backend.sendPasswordReset('  example@example.com  ');
 assert.equal(passwordResetAddress,'example@example.com','password reset normalizes address');
 assert.equal((await backend.refreshVerification()).emailVerified,true);
 assert.equal(forcedTokenRefreshes,1,'email verification refreshes Firestore ID token');
 const interrupted={payload:JSON.stringify({gold:124,fragments:40,maxDungeon:10,stash:[],equip:{},run:{status:'fight',gold:500}}),revision:4};
 records.set('players/alice/saves/current',interrupted);
 assert.equal(await backend.readSave(),null,'old cloud save must NOT restore into a fresh season');
 records.set('players/alice/saves/v092',interrupted);
 assert.deepEqual(await backend.readSave(),interrupted,'in-season interrupted cloud run remains recoverable');
 await assert.rejects(backend.writeSave(JSON.parse(interrupted.payload),4),/Finish or extract/,'new active-run writes stay prohibited');

 const original={nickname:'skinny',characterId:'knight',createdAt:1,updatedAt:1};
 records.set('publicProfiles/alice',original);records.set('nicknames/skinny',{uid:'alice'});
 assert.deepEqual(await backend.createProfile('Skinny','ranger'),original);assert.equal(writes.length,0);
 assert.deepEqual(await backend.createProfile('different_name','ranger'),original);assert.equal(writes.length,0);
 records.delete('publicProfiles/alice');fromCache=true;await assert.rejects(backend.profile(),/unconfirmed/);
 fromCache=false;assert.equal(await backend.profile(),null);
 assert.equal((await backend.createProfile('Skinny','knight')).nickname,'skinny');assert.deepEqual(writes,['publicProfiles/alice']);
 records.delete('publicProfiles/alice');records.set('nicknames/skinny',{uid:'bob'});
 await assert.rejects(backend.createProfile('Skinny','ranger'),/taken by another account/);assert.equal(records.has('publicProfiles/alice'),false);
 }finally{delete globalThis.__profileSdkTest;}
});
