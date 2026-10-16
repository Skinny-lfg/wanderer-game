// Browser test double only: never imported by the production entry point.
export async function createBackend(){
 const f=globalThis.__firebaseTest={user:null,profile:null,cloud:null,writes:0,offline:false,shared:0,feedback:[],...JSON.parse(sessionStorage.getItem('firebaseRefreshSeed')||'{}')};let callback;
 const copy=x=>x==null?x:structuredClone(x);
 return {
  watchAuth(cb){callback=cb;f.restore=()=>callback(f.user);cb(f.user);},
  async signIn(){f.user={uid:'alice'};await callback(f.user);},
  async signInGuest(){f.user={uid:'guest-1',isAnonymous:true};f.profile=null;f.cloud=null;await callback(f.user);},
  async signOut(){f.user=null;await callback(null);},
  async profile(){if(f.profileError)throw Error(f.profileError);return copy(f.profile);},
  async createProfile(nickname,characterId){if(nickname==='taken')throw Error('That nickname is already taken.');f.profile={nickname:nickname.trim().toLowerCase(),characterId};return copy(f.profile);},
  async updateCharacter(characterId){f.profile.characterId=characterId;return copy(f.profile);},
  async readSave(){if(f.offline)throw Error('offline');return copy(f.cloud);},
  async writeSave(payload,expected){if(f.offline)throw Error('offline');if((f.cloud?.revision||0)!==expected)throw Error('cloud-conflict');f.cloud={payload:JSON.stringify(payload),revision:expected+1};f.writes++;return copy(f.cloud);},
  async submitFeedback(data){if(f.offline)throw Error('offline');f.feedback.push(copy(data));return 'feedback-test-'+f.feedback.length;},
  async publishLoadout(snapshot){f.loadout={equipment:copy(snapshot.equip),maxDungeon:snapshot.maxDungeon};},
  async player(uid){return {uid,profile:uid==='alice'?copy(f.profile):{nickname:uid==='outsider'?'outsider':'test_player',characterId:'knight'},loadout:uid==='missing'?null:{equipment:{weapon:{id:'opponent-sword',slot:'weapon',subtype:'Sword',name:'Opponent Sword',tier:10,rarity:'Rare',atk:30,str:5,effect:'poison'},ring1:{id:'ring',slot:'ring1',subtype:'Ring',name:'Poison Ring',tier:10,rarity:'Rare',effect:'poison'}},maxDungeon:20}};},
  async findPlayer(name){if(name.trim().toLowerCase()==='outsider')return this.player('outsider');if(name.trim().toLowerCase()==='alice_1')return this.player('alice');throw Error('Player not found. Enter their full nickname.');},
  async publishTestResults(){f.shared++;},
  async leaderboard(metric){
   if(f.offline)throw Error('offline');
   const first={uid:'test',deepest:30,bestMs:7200000,profile:{nickname:'test_player',characterId:'duelist'}};
   const own=f.user?.isAnonymous&&f.profile?[{uid:f.user.uid,deepest:5,bestMs:6600000,profile:copy(f.profile)}]:[];
   return [first,...own].map(row=>metric==='fastest'?row:{...row,bestMs:undefined});
  }
 };
}
