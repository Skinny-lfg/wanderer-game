// Browser test double only: never imported by the production entry point.
export async function createBackend(){
 const f=globalThis.__firebaseTest={user:null,profile:null,cloud:null,writes:0,offline:false,shared:0};let callback;
 const copy=x=>x==null?x:structuredClone(x);
 return {
  watchAuth(cb){callback=cb;f.restore=()=>callback(f.user);cb(null);},
  async signIn(){f.user={uid:'alice'};await callback(f.user);},
  async signOut(){f.user=null;await callback(null);},
  async profile(){return copy(f.profile);},
  async createProfile(nickname,characterId){if(nickname==='taken')throw Error('That nickname is already taken.');f.profile={nickname:nickname.trim().toLowerCase(),characterId};return copy(f.profile);},
  async updateCharacter(characterId){f.profile.characterId=characterId;return copy(f.profile);},
  async readSave(){if(f.offline)throw Error('offline');return copy(f.cloud);},
  async writeSave(payload,expected){if(f.offline)throw Error('offline');if((f.cloud?.revision||0)!==expected)throw Error('cloud-conflict');f.cloud={payload:JSON.stringify(payload),revision:expected+1};f.writes++;return copy(f.cloud);},
  async publishTestResults(){f.shared++;},
  async leaderboard(metric,milestone){if(f.offline)throw Error('offline');return [{uid:'test',deepest:30,activeMs:60000,receivedAt:{toDate:()=>new Date('2026-10-15T00:00:00Z')},profile:{nickname:'test_player',characterId:'duelist'}}];}
 };
}
