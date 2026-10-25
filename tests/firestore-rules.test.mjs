import {before,after,test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
let env,alice,bob;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-wanderer',firestore:{host:'127.0.0.1',port:8085,rules:readFileSync('firestore.rules','utf8')}});alice=env.authenticatedContext('alice',{firebase:{sign_in_provider:'google.com'}}).firestore();bob=env.authenticatedContext('bob',{firebase:{sign_in_provider:'google.com'}}).firestore();});
after(async()=>env?.cleanup());
async function profile(db,uid,name){const batch=writeBatch(db);batch.set(doc(db,'nicknames',name),{uid});batch.set(doc(db,'publicProfiles',uid),{nickname:name,characterId:'wanderer',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return batch.commit();}
const save=rev=>({payload:'{"gold":123}',revision:rev,schemaVersion:1,updatedAt:serverTimestamp()});

test('v0.10.1 refuses Guest, unverified email and unknown providers, accepts verified registered accounts',async()=>{
 const anonymous=env.authenticatedContext('anon',{firebase:{sign_in_provider:'anonymous'}}).firestore();
 const unverified=env.authenticatedContext('email_bad',{firebase:{sign_in_provider:'password'},email_verified:false}).firestore();
 const verified=env.authenticatedContext('email_ok',{firebase:{sign_in_provider:'password'},email_verified:true}).firestore();
 const missingProvider=env.authenticatedContext('no_provider').firestore();
 const custom=env.authenticatedContext('custom',{firebase:{sign_in_provider:'custom'}}).firestore();
 await assertFails(profile(anonymous,'anon','anonymous'));
 await assertFails(profile(unverified,'email_bad','unverified'));
 await assertFails(profile(missingProvider,'no_provider','missingprovider'));
 await assertFails(profile(custom,'custom','custom'));
 await assertSucceeds(profile(verified,'email_ok','verified_email'));
 await assertSucceeds(setDoc(doc(verified,'players/email_ok/saves/v092'),save(1)));
 await assertFails(setDoc(doc(anonymous,'players/email_ok/saves/v092'),save(2)));
 await assertFails(setDoc(doc(unverified,'players/email_ok/saves/v092'),save(2)));
 await assertFails(getDoc(doc(anonymous,'nicknames/verified_email')));
 await assertSucceeds(getDoc(doc(verified,'nicknames/verified_email')));
});


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
 const path='players/alice/saves/v092';await assertSucceeds(setDoc(doc(alice,path),save(1)));
 await assertFails(getDoc(doc(bob,path)));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),path)));
 await assertSucceeds(getDoc(doc(alice,path)));await assertFails(setDoc(doc(alice,path),save(1)));await assertFails(setDoc(doc(alice,path),save(3)));
 await assertSucceeds(setDoc(doc(alice,path),save(2)));await assertFails(setDoc(doc(alice,path),{...save(3),payload:'x'.repeat(700001)}));
 await assertFails(deleteDoc(doc(alice,path)));await assertFails(setDoc(doc(bob,path),save(3)));
 await assertFails(getDoc(doc(alice,'players/alice/saves/current')));
 await assertFails(setDoc(doc(alice,'players/alice/saves/current'),save(1)));
});
test('v0.12 cloud saves are private, owner-bound, versioned, monotonic and never deletable',async()=>{
 const guest=alice; // registered owner; anonymous users no longer have v0.12 saves
 const other=bob;
 const path='players/alice/saves/v012';
 let createdAt=serverTimestamp();
 const record=rev=>({payload:'{"format":"wanderer-expedition"}',revision:rev,schemaVersion:13,format:'wanderer-expedition',createdAt,updatedAt:serverTimestamp()});
 await assertSucceeds(setDoc(doc(guest,path),record(1)));
 createdAt=(await getDoc(doc(guest,path))).data().createdAt;
 await assertSucceeds(getDoc(doc(guest,path)));
 await assertFails(getDoc(doc(other,path)));
 await assertFails(setDoc(doc(other,path),record(2)));
 await assertFails(setDoc(doc(guest,path),record(1)));
 await assertSucceeds(setDoc(doc(guest,path),record(2)));
 await assertFails(setDoc(doc(guest,path),{...record(3),schemaVersion:1}));
 await assertFails(setDoc(doc(guest,path),{...record(3),payload:'x'.repeat(700001)}));
 await assertFails(deleteDoc(doc(guest,path)));
 const unverified=env.authenticatedContext('email_unverified',{firebase:{sign_in_provider:'password'},email_verified:false}).firestore();
 await assertFails(setDoc(doc(unverified,'players/email_unverified/saves/v012'),{...record(1),createdAt:serverTimestamp()}));
});
test('v0.12 public community results are owner-bound, monotonic and explicitly unverified',async()=>{
 const ref=doc(alice,'communityV012Leaderboard/alice');
 const entry={uid:'alice',nickname:'alice',best:4,verified:false,updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(ref,entry));
 await assertSucceeds(getDoc(doc(bob,'communityV012Leaderboard/alice')));
 await assertFails(setDoc(doc(bob,'communityV012Leaderboard/alice'),{...entry,best:5}));
 await assertFails(setDoc(ref,{...entry,best:3}));
 await assertFails(setDoc(ref,{...entry,verified:true}));
 await assertFails(setDoc(ref,{...entry,nickname:'someone_else'}));
 await assertSucceeds(setDoc(ref,{...entry,best:5}));
 await assertFails(deleteDoc(ref));
});
test('current depth resets per attempt, D200 personal best never increases, client claims stay unverified',async()=>{
 const ref=doc(alice,'testSeasons/v092-launch-1/deepest/alice');
 const claim={deepest:20,attemptId:'run-1',verified:false,updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(ref,claim));
 await assertFails(setDoc(ref,{...claim,verified:true}));
 await assertSucceeds(setDoc(ref,{...claim,deepest:200}));
 await assertFails(setDoc(ref,{...claim,deepest:0}));
 await assertSucceeds(setDoc(ref,{...claim,attemptId:'run-2',deepest:0}));
 await assertSucceeds(setDoc(ref,{...claim,attemptId:'run-2',deepest:17}));
 await assertFails(setDoc(ref,{...claim,attemptId:'run-2',deepest:1}));
 await assertFails(setDoc(ref,{...claim,deepest:201}));
 await assertFails(setDoc(doc(bob,'testSeasons/v092-launch-1/deepest/alice'),claim));
 const record=doc(alice,'testSeasons/v092-launch-1/combatSpeedruns/alice');
 const best={bestMs:500000,verified:false,updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(record,best));
 await assertSucceeds(setDoc(record,{...best,bestMs:450000}));
 await assertFails(setDoc(record,{...best,bestMs:999999}));
 await assertFails(setDoc(record,{...best,verified:true}));
 await assertFails(setDoc(record,{...best,bestMs:-1}));
 await assertFails(setDoc(doc(bob,'testSeasons/v092-launch-1/combatSpeedruns/alice'),best));
 await assertFails(getDoc(doc(alice,'testSeasons/v092-launch-1/speedruns/alice')));
 await assertFails(setDoc(doc(alice,'testSeasons/v092-launch-1/speedruns/alice'),best));
 await assertFails(setDoc(doc(alice,'verifiedSeasons/test-open-1/entries/alice'),{score:100}));
 const milestone=doc(alice,'testSeasons/v092-launch-1/milestones/20/entries/alice');
 await assertFails(setDoc(milestone,{milestone:20,activeMs:60000,verified:false,receivedAt:serverTimestamp()}));
 await assertFails(getDoc(milestone));
 await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'testSeasons/v092-launch-1/deepest/alice')));
 await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'testSeasons/v092-launch-1/combatSpeedruns/alice')));
 await assertFails(getDoc(doc(alice,'testSeasons/test-open-1/deepest/alice')));
 await assertFails(setDoc(doc(alice,'testSeasons/test-open-1/deepest/alice'),claim));
 assert.equal((await getDoc(ref)).data().deepest,17);
});

test('public equipment is readable by signed-in players but never writable by opponents',async()=>{
 const data={equipment:'{}',maxDungeon:10,updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(alice,'publicLoadoutsV092/alice'),data));
 await assertSucceeds(getDoc(doc(bob,'publicLoadoutsV092/alice')));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'publicLoadoutsV092/alice')));
 await assertFails(getDoc(doc(alice,'publicLoadouts/alice')));
 await assertFails(setDoc(doc(alice,'publicLoadouts/alice'),data));
 await assertFails(setDoc(doc(bob,'publicLoadoutsV092/alice'),data));
 await assertFails(setDoc(doc(alice,'publicLoadoutsV092/alice'),{...data,gold:999}));
 await assertFails(setDoc(doc(alice,'publicLoadoutsV092/alice'),{...data,equipment:'x'.repeat(30001)}));
 await assertFails(setDoc(doc(alice,'pvpTransfers/fake'),{attacker:'alice',defender:'bob',gold:20}));
});

test('feedback inbox accepts a bounded playtest report and forbids reading or spoofing',async()=>{
 const good={uid:'alice',category:'bug',rating:4,combat:'repetitive',difficulty:'balanced',
   likes:'',problems:'Repeated dungeon clicks are tedious.',ideas:'',maxDungeon:22,
   characterId:'wanderer',appVersion:'0.11.0',createdAt:serverTimestamp()};
 const item=doc(alice,'feedbackInbox/alice_bug_report_1');
 await assertSucceeds(setDoc(item,good));
 await assertFails(getDoc(item));
 await assertFails(getDoc(doc(bob,'feedbackInbox/alice_bug_report_1')));
 await assertFails(setDoc(doc(bob,'feedbackInbox/bob_fake'),{...good,uid:'alice'}));
 await assertFails(setDoc(doc(alice,'feedbackInbox/alice_fake_time'),{...good,createdAt:new Date(0)}));
 await assertFails(setDoc(doc(alice,'feedbackInbox/alice_extra'),{...good,isAdmin:true}));
 await assertFails(setDoc(doc(alice,'feedbackInbox/alice_huge'),{...good,problems:'x'.repeat(1501)}));
 await assertFails(setDoc(doc(alice,'feedbackInbox/alice_empty'),{...good,problems:'no'}));
 await assertFails(setDoc(item,good));
 await assertFails(deleteDoc(item));
 await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(),'feedbackInbox/anon_1'),good));
});
test('v0.12 feedback is private, create-only, bounded and rate-limited through an atomic lock',async()=>{
 const guest=alice,other=bob;
 const feedback=doc(guest,'feedbackInboxV012/alice_report1'),limit=doc(guest,'feedbackRateLimits/alice');
 const report={uid:'alice',category:'bug',description:'The reward panel did not open.',steps:'Complete a Realm then click reward.',appVersion:'0.12.0',commit:'af5e0d9',screen:'camp',viewport:'390x844',browser:'',technical:'',createdAt:serverTimestamp()};
 await assertFails(setDoc(feedback,report));
 const batch=writeBatch(guest);batch.set(feedback,report);batch.set(limit,{uid:'alice',updatedAt:serverTimestamp()});await assertSucceeds(batch.commit());
 await assertFails(getDoc(feedback));await assertFails(getDoc(doc(other,'feedbackInboxV012/alice_report1')));
 await assertFails(setDoc(feedback,report));
 const early=writeBatch(guest);early.set(doc(guest,'feedbackInboxV012/alice_report2'),{...report,createdAt:serverTimestamp()});early.update(limit,{updatedAt:serverTimestamp()});await assertFails(early.commit());
});
