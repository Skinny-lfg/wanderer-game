// Anchor campaign foundation. Pure, serializable progression; not yet wired to live loot, saves or combat.
// No drop RNG, tuning, Boss definitions or final art. Consumers must call transitions only on authoritative events.
(function(root){'use strict';
const VERSION=1;
const rows=[
 ['blood','Bloodhallow','The Crimson Basilica','Bloodtithe'],
 ['decay','Noxfen','The Hollow Brood','Broodheart'],
 ['radiance','Verdant Maw','The Devouring Canopy','Thornroot'],
 ['aegis','Tideward','The Crushing Deep','Abyssward'],
 ['fury','Rustlands','The Iron Scar','Ironbound'],
 ['arcane','Sigilfall','The Unwritten Vault','Voidglyph']
];
const CATALOG=Object.freeze(rows.map(([id,realm,anchor,stone])=>Object.freeze({id,realm,anchor,stone:stone+' Anchorstone',identityPending:id==='radiance',art:'placeholder',shards:Object.freeze(['I','II','III'].map((part,i)=>Object.freeze({id:id+'_shard_'+(i+1),family:id,part:i+1,name:stone+' Shard '+part,kind:'runestone_shard',art:'placeholder'})))})));
const ids=CATALOG.map(x=>x.id),get=id=>CATALOG.find(x=>x.id===id)||null;
const exact=(obj,keys)=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).length===keys.length&&keys.every(k=>Object.hasOwn(obj,k));
const number=x=>Number.isSafeInteger(x)&&x>=0;
function create(){return {version:VERSION,realms:Object.fromEntries(ids.map(id=>[id,{portal:'locked',shards:[]}])),nextAttempt:1,active:null};}
function valid(s){
 if(!exact(s,['version','realms','nextAttempt','active'])||s.version!==VERSION||!exact(s.realms,ids)||!number(s.nextAttempt)||s.nextAttempt<1)return false;
 for(const id of ids){
  const r=s.realms[id],allowed=get(id).shards.map(x=>x.id);
  if(!exact(r,['portal','shards'])||!['locked','open','conquered'].includes(r.portal)||!Array.isArray(r.shards)||new Set(r.shards).size!==r.shards.length||r.shards.some(x=>!allowed.includes(x))||r.portal!=='locked'&&r.shards.length!==0)return false;
 }
 if(s.active!==null){
  const a=s.active;
  if(!exact(a,['realm','token','difficultyStep'])||!get(a.realm)||s.realms[a.realm].portal!=='open'||!number(a.token)||a.token!==s.nextAttempt-1||a.token<1||a.difficultyStep!==conqueredCount(s))return false;
 }
 return true;
}
function requireValid(s){if(!valid(s))throw Error('Invalid Anchor campaign state');}
function conqueredCount(s){return ids.filter(id=>s.realms[id].portal==='conquered').length;}
function status(s,id){requireValid(s);const r=s.realms[id];if(!r)return null;return r.portal==='locked'&&r.shards.length===3?'ready_to_unlock':r.portal;}
function missingShards(s,id){requireValid(s);const realm=get(id);return !realm||s.realms[id].portal!=='locked'?[]:realm.shards.filter(x=>!s.realms[id].shards.includes(x.id));}
function replaceRealm(s,id,r){return {...s,realms:{...s.realms,[id]:r}};}
// Accept only a distinct, already-secured shard. Acquisition/Bag and death policy belong to the integration layer.
function grantSecuredShard(s,shardId){
 requireValid(s);if(s.active)return null;
 const realm=CATALOG.find(x=>x.shards.some(y=>y.id===shardId));if(!realm)return null;
 const r=s.realms[realm.id];if(r.portal!=='locked'||r.shards.includes(shardId))return null;
 return replaceRealm(s,realm.id,{...r,shards:[...r.shards,shardId].sort()});
}
// Shrine assembly is a single transaction: all three complementary parts -> persistent portal.
function openPortal(s,id){
 requireValid(s);if(s.active||status(s,id)!=='ready_to_unlock')return null;
 return replaceRealm(s,id,{portal:'open',shards:[]});
}
// Difficulty is an uncalibrated step (0..5), not a damage/HP multiplier.
function difficultyStep(s,id){requireValid(s);return get(id)&&s.realms[id].portal!=='conquered'?conqueredCount(s):null;}
function startAttempt(s,id){
 requireValid(s);if(s.active||!get(id)||s.realms[id].portal!=='open'||s.nextAttempt>=Number.MAX_SAFE_INTEGER)return null;
 return {...s,nextAttempt:s.nextAttempt+1,active:{realm:id,token:s.nextAttempt,difficultyStep:conqueredCount(s)}};
}
function settleAttempt(s,token,outcome){
 requireValid(s);if(!s.active||s.active.token!==token||!['victory','defeat'].includes(outcome))return null;
 const id=s.active.realm;
 const next={...s,active:null};
 return outcome==='victory'?replaceRealm(next,id,{portal:'conquered',shards:[]}):next;
}
function finalUnlocked(s){requireValid(s);return conqueredCount(s)===ids.length;}
function summary(s){requireValid(s);return {conquered:conqueredCount(s),total:ids.length,finalUnlocked:finalUnlocked(s),realms:CATALOG.map(x=>({id:x.id,status:status(s,x.id),owned:s.realms[x.id].shards.length,missing:missingShards(s,x.id).map(y=>y.id),difficultyStep:difficultyStep(s,x.id)}))};}
root.WandererV013AnchorCampaign=Object.freeze({VERSION,CATALOG,get,create,valid,status,missingShards,grantSecuredShard,openPortal,difficultyStep,startAttempt,settleAttempt,finalUnlocked,summary});
})(globalThis);
