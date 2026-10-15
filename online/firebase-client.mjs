import * as sdk from './vendor/firebase-sdk.mjs';
import {firebaseConfig} from './firebase-config.mjs';
import {nicknameKey,character,cloudRecord,compareRevision,validateSave,SEASON,MILESTONES,safeProgress} from './model.mjs';
export async function createBackend(){
 const app=sdk.initializeApp(firebaseConfig),auth=sdk.getAuth(app),db=sdk.getFirestore(app);
 await sdk.setPersistence(auth,sdk.browserLocalPersistence);
 const user=()=>{if(!auth.currentUser)throw new Error('Sign in first.');return auth.currentUser.uid;};
 const profileRef=uid=>sdk.doc(db,'publicProfiles',uid);
 const saveRef=()=>sdk.doc(db,'players',user(),'saves','current');
 return {
  watchAuth:callback=>sdk.onAuthStateChanged(auth,callback),
  signIn:()=>sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider()),
  signOut:()=>sdk.signOut(auth),
  async profile(){const snap=await sdk.getDoc(profileRef(user()));return snap.exists()?snap.data():null;},
  async createProfile(name,characterId){
   const uid=user(),nickname=nicknameKey(name),nicknameRef=sdk.doc(db,'nicknames',nickname),ref=profileRef(uid);
   if(character(characterId).id!==characterId)throw new Error('Unknown character.');
   await sdk.runTransaction(db,async tx=>{
    const [claimed,existing]=await Promise.all([tx.get(nicknameRef),tx.get(ref)]);
    if(existing.exists())throw new Error('This account already has a profile. Reopen Account.');
    if(claimed.exists())throw new Error('That nickname is already taken.');
    tx.set(nicknameRef,{uid});
    tx.set(ref,{nickname,characterId,createdAt:sdk.serverTimestamp(),updatedAt:sdk.serverTimestamp()});
   });
   return this.profile();
  },
  async updateCharacter(characterId){
   if(character(characterId).id!==characterId)throw new Error('Unknown character.');
   const ref=profileRef(user());await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error('Create a profile first.');tx.update(ref,{characterId,updatedAt:sdk.serverTimestamp()});});
   return this.profile();
  },
  async readSave(){const snap=await sdk.getDoc(saveRef());if(!snap.exists())return null;const data=snap.data();validateSave(data.payload);return data;},
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
