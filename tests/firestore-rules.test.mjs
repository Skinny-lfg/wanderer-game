import {before,after,test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
let env,alice,bob;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-wanderer',firestore:{host:'127.0.0.1',port:8085,rules:readFileSync('firestore.rules','utf8')}});alice=env.authenticatedContext('alice').firestore();bob=env.authenticatedContext('bob').firestore();});
after(async()=>env?.cleanup());
async function profile(db,uid,name){const batch=writeBatch(db);batch.set(doc(db,'nicknames',name),{uid});batch.set(doc(db,'publicProfiles',uid),{nickname:name,characterId:'wanderer',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return batch.commit();}
const save=rev=>({payload:'{"gold":123}',revision:rev,schemaVersion:1,updatedAt:serverTimestamp()});
test('nickname + profile are atomic, immutable, unique; no impersonation',async()=>{
 await assertFails(setDoc(doc(alice,'publicProfiles/alice'),{nickname:'alice',characterId:'wanderer',createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await assertSucceeds(profile(alice,'alice','alice'));
 await assertFails(profile(bob,'bob','alice'));
 await assertSucceeds(profile(bob,'bob','bob'));
 await assertFails(updateDoc(doc(bob,'publicProfiles/alice'),{characterId:'ranger',updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(doc(alice,'publicProfiles/alice'),{nickname:'other',updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(doc(alice,'publicProfiles/alice'),{characterId:'admin',updatedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(doc(alice,'publicProfiles/alice'),{characterId:'ranger',updatedAt:serverTimestamp()}));
});
test('private saves require owner + profile, monotonic revision and bounded payload',async()=>{
 const path='players/alice/saves/current';await assertSucceeds(setDoc(doc(alice,path),save(1)));
 await assertFails(getDoc(doc(bob,path)));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),path)));
 await assertSucceeds(getDoc(doc(alice,path)));await assertFails(setDoc(doc(alice,path),save(1)));await assertFails(setDoc(doc(alice,path),save(3)));
 await assertSucceeds(setDoc(doc(alice,path),save(2)));await assertFails(setDoc(doc(alice,path),{...save(3),payload:'x'.repeat(700001)}));
 await assertFails(deleteDoc(doc(alice,path)));await assertFails(setDoc(doc(bob,path),save(3)));
});
test('rankings reject verified claims, forged timestamps, arbitrary values and other users',async()=>{
 const ref=doc(alice,'testSeasons/test-open-1/deepest/alice');const claim={deepest:20,verified:false,updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(ref,claim));await assertFails(setDoc(ref,{...claim,verified:true}));await assertFails(setDoc(ref,{...claim,deepest:101}));
 await assertFails(setDoc(doc(bob,'testSeasons/test-open-1/deepest/alice'),claim));
 await assertFails(setDoc(doc(alice,'verifiedSeasons/test-open-1/entries/alice'),{score:100}));
 const milestone=doc(alice,'testSeasons/test-open-1/milestones/20/entries/alice');const data={milestone:20,activeMs:60000,verified:false,receivedAt:serverTimestamp()};
 await assertSucceeds(setDoc(milestone,data));await assertFails(setDoc(milestone,{...data,activeMs:0}));
 await assertFails(setDoc(doc(alice,'testSeasons/test-open-1/milestones/30/entries/alice'),{...data,milestone:30,receivedAt:new Date(0)}));
 await assertFails(setDoc(doc(alice,'testSeasons/test-open-1/milestones/40/entries/alice'),{...data,milestone:40,activeMs:-1}));
 await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'testSeasons/test-open-1/deepest/alice')));
 assert.equal((await getDoc(ref)).data().verified,false);
});
