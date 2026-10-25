import {publicLoadout,cleanEquipment,cleanPublicRunes,cleanPublicRuneSlots} from './public-loadout.mjs';
import * as bundledSdk from './vendor/firebase-sdk.mjs';
import * as configModule from './firebase-config.mjs?v=v012-production-config-4';
const {firebaseConfig,firebaseEnvironment,assertDevFirebaseConfig,assertProductionFirebaseConfig}=configModule;
import {nicknameKey,character,cloudRecord,compareRevision,validateSave,recoverInterruptedSave,SEASON,SAVE_NAMESPACE,PUBLIC_LOADOUTS,SPEEDRUN_BOARD,safeProgress,completedD200Time} from './model.mjs?v=v092-combat-hotfix-1';
let backendPromise;
export async function createBackend(){
 if(backendPromise)return backendPromise;
 backendPromise=(async()=>{
 const assertFirebaseConfig=firebaseEnvironment==='production'?assertProductionFirebaseConfig:assertDevFirebaseConfig;
 if(typeof assertFirebaseConfig!=='function')throw new Error('Firebase config validator is unavailable. Refresh the page and try again.');
 assertFirebaseConfig(firebaseConfig);
 // A rebuilt local bundle is preferred; the version-pinned official CDN supplies
 // the complete modular SDK in development until that bundle is regenerated.
 const sdk=typeof bundledSdk.createUserWithEmailAndPassword==='function' &&
   typeof bundledSdk.sendPasswordResetEmail==='function'
   ?bundledSdk:await import('./firebase-sdk-cdn.mjs');
 const app=sdk.initializeApp(firebaseConfig),auth=sdk.getAuth(app),db=sdk.getFirestore(app);
 await sdk.setPersistence(auth,sdk.browserLocalPersistence);
 const user=()=>{if(!auth.currentUser)throw new Error('Sign in first.');return auth.currentUser.uid;};
 const profileRef=uid=>sdk.doc(db,'publicProfiles',uid);
 const saveRef=()=>sdk.doc(db,'players',user(),'saves',SAVE_NAMESPACE);
 const v012SaveRef=uid=>sdk.doc(db,'players',uid,'saves','v012');
 return {
  watchAuth:callback=>sdk.onAuthStateChanged(auth,callback),
  currentUser:()=>auth.currentUser,
  projectId:firebaseConfig.projectId,
  signInGuest:()=>sdk.signInAnonymously(auth),
  signIn:()=>sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider()),
  async linkGoogle(){if(!auth.currentUser?.isAnonymous)throw Error('Sign in as Guest first to link Google.');return sdk.linkWithPopup(auth.currentUser,new sdk.GoogleAuthProvider());},
  async linkEmail(email,password){if(!auth.currentUser?.isAnonymous)throw Error('Sign in as Guest first to link email.');return sdk.linkWithCredential(auth.currentUser,sdk.EmailAuthProvider.credential(String(email).trim(),String(password)));},
  signInWithEmail:(email,password)=>sdk.signInWithEmailAndPassword(auth,String(email).trim(),String(password)),
  async createEmailAccount(email,password){
   const credential=await sdk.createUserWithEmailAndPassword(auth,String(email).trim(),String(password));
   await sdk.sendEmailVerification(credential.user);
   return credential.user;
  },
  async sendPasswordReset(email){
   try{await sdk.sendPasswordResetEmail(auth,String(email).trim());}
   catch(error){if(error?.code==='auth/user-not-found')return;throw error;}
  },
  async resendVerification(){
   if(!auth.currentUser || auth.currentUser.isAnonymous)throw Error('Sign in with a registered account first.');
   await sdk.sendEmailVerification(auth.currentUser);
  },
  async refreshVerification(){
   if(!auth.currentUser)return null;
   await sdk.reload(auth.currentUser);
   // Force a fresh ID token so Firestore Rules receive email_verified=true.
   await sdk.getIdToken(auth.currentUser,true);
   return auth.currentUser;
  },
  signOut:()=>sdk.signOut(auth),
  async readV012Save(uid){if(!uid||uid!==user())throw Error('Save owner does not match signed-in account.');const snap=await sdk.getDocFromServer(v012SaveRef(uid));return snap.exists()?snap.data():null;},
  async createV012SaveIfMissing(uid,payload){if(!uid||uid!==user())throw Error('Save owner does not match signed-in account.');const ref=v012SaveRef(uid);let saved;await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(snap.exists()){saved=snap.data();return;}const record={payload:JSON.stringify(payload),revision:1,schemaVersion:payload.schemaVersion,format:payload.format,createdAt:sdk.serverTimestamp(),updatedAt:sdk.serverTimestamp()};tx.set(ref,record);saved={...record,createdAt:new Date(),updatedAt:new Date()};});return saved;},
  async writeV012Save(uid,payload,expectedRevision){if(!uid||uid!==user())throw Error('Save owner does not match signed-in account.');const ref=v012SaveRef(uid);let record;await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists()||snap.data().revision!==expectedRevision)throw Error('Cloud save changed in another session. Reload before saving.');record={payload:JSON.stringify(payload),revision:expectedRevision+1,schemaVersion:payload.schemaVersion,format:payload.format,createdAt:snap.data().createdAt,updatedAt:sdk.serverTimestamp()};tx.update(ref,record);});return record;},
  async profile(){const snap=await sdk.getDoc(profileRef(user()));if(!snap.exists()&&snap.metadata.fromCache)throw new Error('network-profile-unconfirmed');return snap.exists()?snap.data():null;},
  // Only the already-public identity fields are read; private /players saves are never accessed.
  async readV012PublicProfile(uid){
   if(typeof uid!=='string'||uid.length<1||uid.length>128||uid.includes('/'))throw Error('Invalid player.');
   const snap=await sdk.getDoc(profileRef(uid));
   if(!snap.exists())return null;
   const data=snap.data();
   const nickname=typeof data.nickname==='string'&&/^[a-z0-9_]{3,20}$/.test(data.nickname)?data.nickname:null;
   const characterId=['wanderer','ranger','knight','spellblade','duelist'].includes(data.characterId)?data.characterId:null;
   return {nickname,characterId};
  },

  async createProfile(name,characterId){
   const uid=user(),nickname=nicknameKey(name),nicknameRef=sdk.doc(db,'nicknames',nickname),ref=profileRef(uid);
   if(character(characterId).id!==characterId)throw new Error('Unknown character.');
   await sdk.runTransaction(db,async tx=>{
    const [claimed,existing]=await Promise.all([tx.get(nicknameRef),tx.get(ref)]);
    if(existing.exists())return; // Repeated setup must restore the original profile.
    if(claimed.exists()&&claimed.data().uid!==uid)throw new Error('That nickname is taken by another account. Choose a different nickname.');
    if(!claimed.exists())tx.set(nicknameRef,{uid});
    tx.set(ref,{nickname,characterId,createdAt:sdk.serverTimestamp(),updatedAt:sdk.serverTimestamp()});
   });
   return this.profile();
  },
  async updateCharacter(characterId){
   if(character(characterId).id!==characterId)throw new Error('Unknown character.');
   const ref=profileRef(user());await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error('Create a profile first.');tx.update(ref,{characterId,updatedAt:sdk.serverTimestamp()});});
   return this.profile();
  },
  async readSave(){const snap=await sdk.getDoc(saveRef());if(snap.metadata?.fromCache)throw new Error('network-save-unconfirmed');if(!snap.exists())return null;const data=snap.data();recoverInterruptedSave(data.payload);return data;},
  async writeSave(payload,expectedRevision){
   const ref=saveRef(),record=cloudRecord(payload,expectedRevision);
   await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);compareRevision(snap.exists()?snap.data():null,expectedRevision);tx.set(ref,{...record,updatedAt:sdk.serverTimestamp()});});
   return record;
  },
  // Client-submitted playtest records: current depth resets per attempt; personal best is permanent.
  async publishTestResults(snapshot){
   const uid=user(),valid=validateSave(snapshot),progress=safeProgress(valid);
   const entry=sdk.doc(db,'testSeasons',SEASON,'deepest',uid);
   await sdk.runTransaction(db,async tx=>{
    const old=await tx.get(entry),previous=old.exists()?old.data():null;
    const sameAttempt=(previous?.attemptId||'legacy')===progress.attemptId;
    const deepest=sameAttempt?Math.max(previous?.deepest||0,progress.deepestCleared):progress.deepestCleared;
    tx.set(entry,{deepest,attemptId:progress.attemptId,verified:false,updatedAt:sdk.serverTimestamp()});
   });
   const ms=completedD200Time(valid);
   if(ms===null)return;
   const record=sdk.doc(db,'testSeasons',SEASON,SPEEDRUN_BOARD,uid);
   await sdk.runTransaction(db,async tx=>{
    const old=await tx.get(record);
    if(old.exists()&&old.data().bestMs<=ms)return;
    tx.set(record,{bestMs:ms,verified:false,updatedAt:sdk.serverTimestamp()});
   });
  },

  async submitFeedback(form){
   const uid=user(),category=String(form.category||'general'),rating=Number(form.rating||0),
    combat=String(form.combat||'not-sure'),difficulty=String(form.difficulty||'not-sure'),
    likes=String(form.likes||'').trim(),problems=String(form.problems||'').trim(),ideas=String(form.ideas||'').trim(),
    maxDungeon=Number(form.maxDungeon),characterId=String(form.characterId||'wanderer');
   if(!['general','bug','idea','balance'].includes(category)||!Number.isInteger(rating)||rating<0||rating>5||
    !['not-sure','great','okay','repetitive','confusing'].includes(combat)||
    !['not-sure','easy','balanced','hard'].includes(difficulty)||
    likes.length>500||problems.length>1500||ideas.length>1200||
    [likes,problems,ideas].join(' ').trim().length<10||
    !Number.isInteger(maxDungeon)||maxDungeon<1||maxDungeon>200||
    character(characterId).id!==characterId)throw Error('Please review your feedback before sending.');
   const id=uid+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
   const record={uid,category,rating,combat,difficulty,likes,problems,ideas,maxDungeon,characterId,appVersion:'0.12.0',createdAt:sdk.serverTimestamp()};
   await sdk.runTransaction(db,async tx=>{tx.set(sdk.doc(db,'feedbackInbox',id),record);});
   return id;
  },
  async submitV012Feedback(form){
   if(!auth.currentUser||auth.currentUser.isAnonymous)throw Error("Sign in with Google or email before submitting feedback.");
   const uid=user(),description=String(form.description||'').trim(),steps=String(form.steps||'').trim(),category=String(form.category||'bug');
   const types=['bug','idea','balance','general'];
   if(!types.includes(category)||description.length<10||description.length>1400||steps.length>1150)throw Error('Please review the report fields.');
   const id=uid+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),report=sdk.doc(db,'feedbackInboxV012',id),limit=sdk.doc(db,'feedbackRateLimits',uid);
   const record={uid,category,description,steps,appVersion:'0.12.0',commit:String(form.commit||'unknown').slice(0,20),screen:String(form.screen||'unknown').slice(0,60),viewport:String(form.viewport||'unknown').slice(0,40),browser:String(form.browser||'').slice(0,260),technical:String(form.technical||'').slice(0,600),createdAt:sdk.serverTimestamp()};
   await sdk.runTransaction(db,async tx=>{const [old,duplicate]=await Promise.all([tx.get(limit),tx.get(report)]);if(duplicate.exists())throw Error('duplicate-feedback');if(old.exists()&&Date.now()-old.data().updatedAt.toMillis()<60000)throw Error('feedback-rate-limited');tx.set(report,record);tx.set(limit,{uid,updatedAt:sdk.serverTimestamp()});});
   return id;
  },
  async publishV012CommunityScore(best,nickname){
   const uid=user(),score=Number(best),name=nicknameKey(nickname);
   if(auth.currentUser?.isAnonymous)throw Error('Registered account required.');
   if(!Number.isSafeInteger(score)||score<1||score>100000)throw Error('Invalid Expedition result.');
   const ref=sdk.doc(db,'communityV012Leaderboard',uid);
   await sdk.runTransaction(db,async tx=>{
    const previous=await tx.get(ref);
    if(previous.exists()&&previous.data().best>=score)return;
    tx.set(ref,{uid,nickname:name,best:score,verified:false,updatedAt:sdk.serverTimestamp()});
   });
  },
  async listV012CommunityScores(){
   if(!auth.currentUser||auth.currentUser.isAnonymous)throw Error('Sign in first.');
   const col=sdk.collection(db,'communityV012Leaderboard');
   const snap=await sdk.getDocs(sdk.query(col,sdk.orderBy('best','desc'),sdk.limit(50)));
   return snap.docs.map(d=>({uid:d.id,nickname:d.data().nickname,best:d.data().best,verified:false}));
  },
  async publishLoadout(save){
   const loadout=publicLoadout(save),payload=JSON.stringify({...loadout.equipment,__runes:loadout.runes,__runeSlots:loadout.runeSlots}),ref=sdk.doc(db,PUBLIC_LOADOUTS,user());
   await sdk.runTransaction(db,async tx=>{const old=await tx.get(ref);if(old.exists()&&old.data().equipment===payload&&old.data().maxDungeon===loadout.maxDungeon)return;tx.set(ref,{equipment:payload,maxDungeon:loadout.maxDungeon,updatedAt:sdk.serverTimestamp()});});
  },
  async player(uid){
   if(typeof uid!=='string'||!uid||uid.includes('/')||uid.length>128)throw Error('Invalid player.');
   const p=await sdk.getDoc(profileRef(uid));if(!p.exists())throw Error('Player not found.');
   const snapshot=await sdk.getDoc(sdk.doc(db,PUBLIC_LOADOUTS,uid));
   const published=snapshot.exists()?JSON.parse(snapshot.data().equipment):null;const runes=cleanPublicRunes(published?.__runes);return {uid,profile:p.data(),loadout:published?{equipment:cleanEquipment(published),runes,runeSlots:cleanPublicRuneSlots(published.__runeSlots,runes),maxDungeon:snapshot.data().maxDungeon}:null};
  },
  async findPlayer(name){
   const key=nicknameKey(name),claim=await sdk.getDoc(sdk.doc(db,'nicknames',key));
   if(!claim.exists())throw Error('Player not found. Enter their full nickname.');
   return this.player(claim.data().uid);
  },
  async leaderboard(metric){
   if(!['fastest','deepest'].includes(metric))throw new Error('Unknown leaderboard category.');
   const col=sdk.collection(db,'testSeasons',SEASON,metric==='fastest'?SPEEDRUN_BOARD:'deepest');
   const field=metric==='fastest'?'bestMs':'deepest';
   const rows=await sdk.getDocs(sdk.query(col,sdk.orderBy(field,metric==='fastest'?'asc':'desc'),sdk.limit(50)));
   const result=await Promise.all(rows.docs.map(async row=>{
    const p=await sdk.getDoc(profileRef(row.id));
    return p.exists()?{uid:row.id,...row.data(),profile:p.data()}:null;
   }));
   return result.filter(Boolean);
  }
 };
 })().catch(error=>{backendPromise=null;throw error;});
 return backendPromise;
}
