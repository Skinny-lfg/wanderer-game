import {publicLoadout,cleanEquipment} from './public-loadout.mjs';
import * as sdk from './vendor/firebase-sdk.mjs';
import {firebaseConfig} from './firebase-config.mjs';
import {nicknameKey,character,cloudRecord,compareRevision,validateSave,recoverInterruptedSave,SEASON,MILESTONES,safeProgress} from './model.mjs';
export async function createBackend(){
 const app=sdk.initializeApp(firebaseConfig),auth=sdk.getAuth(app),db=sdk.getFirestore(app);
 await sdk.setPersistence(auth,sdk.browserLocalPersistence);
 const user=()=>{if(!auth.currentUser)throw new Error('Sign in first.');return auth.currentUser.uid;};
 const profileRef=uid=>sdk.doc(db,'publicProfiles',uid);
 const saveRef=()=>sdk.doc(db,'players',user(),'saves','current');
 return {
  watchAuth:callback=>sdk.onAuthStateChanged(auth,callback),
  signIn:()=>sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider()),
  signInGuest:()=>sdk.signInAnonymously(auth),
  signOut:()=>sdk.signOut(auth),
  async profile(){const snap=await sdk.getDoc(profileRef(user()));if(!snap.exists()&&snap.metadata.fromCache)throw new Error('network-profile-unconfirmed');return snap.exists()?snap.data():null;},
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
  async readSave(){const snap=await sdk.getDoc(saveRef());if(!snap.exists())return null;const data=snap.data();recoverInterruptedSave(data.payload);return data;},
  async writeSave(payload,expectedRevision){
   const ref=saveRef(),record=cloudRecord(payload,expectedRevision);
   await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);compareRevision(snap.exists()?snap.data():null,expectedRevision);tx.set(ref,{...record,updatedAt:sdk.serverTimestamp()});});
   return record;
  },
  async publishTestResults(snapshot){
   const uid=user(),progress=safeProgress(validateSave(snapshot));
   const entry=sdk.doc(db,'testSeasons',SEASON,'deepest',uid);
   await sdk.runTransaction(db,async tx=>{const old=await tx.get(entry);tx.set(entry,{deepest:Math.max(old.data()?.deepest||0,progress.deepestCleared),verified:false,updatedAt:sdk.serverTimestamp()});});
   for(const milestone of MILESTONES){
    const clear=progress.milestones[milestone];if(!clear)continue;
    const ref=sdk.doc(db,'testSeasons',SEASON,'milestones',String(milestone),'entries',uid);
    await sdk.runTransaction(db,async tx=>{const old=await tx.get(ref);if(old.exists())return;tx.set(ref,{milestone,activeMs:progress.timingEligible&&Number.isFinite(clear.activeMs)?Math.floor(clear.activeMs):null,verified:false,receivedAt:sdk.serverTimestamp()});});
   }
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
    !Number.isInteger(maxDungeon)||maxDungeon<1||maxDungeon>100||
    character(characterId).id!==characterId)throw Error('Please review your feedback before sending.');
   const id=uid+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
   const record={uid,category,rating,combat,difficulty,likes,problems,ideas,maxDungeon,characterId,appVersion:'0.8.1',createdAt:sdk.serverTimestamp()};
   await sdk.runTransaction(db,async tx=>{tx.set(sdk.doc(db,'feedbackInbox',id),record);});
   return id;
  },
  async publishLoadout(save){
   const loadout=publicLoadout(save),payload=JSON.stringify(loadout.equipment),ref=sdk.doc(db,'publicLoadouts',user());
   await sdk.runTransaction(db,async tx=>{const old=await tx.get(ref);if(old.exists()&&old.data().equipment===payload&&old.data().maxDungeon===loadout.maxDungeon)return;tx.set(ref,{equipment:payload,maxDungeon:loadout.maxDungeon,updatedAt:sdk.serverTimestamp()});});
  },
  async player(uid){
   if(typeof uid!=='string'||!uid||uid.includes('/')||uid.length>128)throw Error('Invalid player.');
   const p=await sdk.getDoc(profileRef(uid));if(!p.exists())throw Error('Player not found.');
   const snapshot=await sdk.getDoc(sdk.doc(db,'publicLoadouts',uid));
   return {uid,profile:p.data(),loadout:snapshot.exists()?{equipment:cleanEquipment(JSON.parse(snapshot.data().equipment)),maxDungeon:snapshot.data().maxDungeon}:null};
  },
  async findPlayer(name){
   const key=nicknameKey(name),claim=await sdk.getDoc(sdk.doc(db,'nicknames',key));
   if(!claim.exists())throw Error('Player not found. Enter their full nickname.');
   return this.player(claim.data().uid);
  },
  async leaderboard(metric,milestone=10){
   const col=metric==='deepest'?sdk.collection(db,'testSeasons',SEASON,'deepest'):sdk.collection(db,'testSeasons',SEASON,'milestones',String(milestone),'entries');
   const field=metric==='deepest'?'deepest':metric==='first'?'receivedAt':'activeMs';
   const constraints=[sdk.orderBy(field,metric==='deepest'?'desc':'asc'),sdk.limit(50)];if(metric==='fastest')constraints.unshift(sdk.where('activeMs','>=',0));
   const rows=await sdk.getDocs(sdk.query(col,...constraints));
   const result=await Promise.all(rows.docs.map(async row=>{const p=await sdk.getDoc(profileRef(row.id));return p.exists()?{uid:row.id,...row.data(),profile:p.data()}:null;}));
   return result.filter(row=>row&&(metric!=='fastest'||row.activeMs!==null));
  }
 };
}
