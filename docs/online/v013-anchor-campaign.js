// Anchor campaign and experimental shard acquisition. Consumers call transitions only on authoritative events.
// Independent deterministic reward channel; no final art, Anchor bosses or stat multipliers.
(function(root){'use strict';
const VERSION=1;
const rows=[
 ['blood','Bloodhallow','The Crimson Basilica','Bloodtithe'],
 ['decay','Noxfen','The Hollow Brood','Broodheart'],
 ['radiance','The Last Dawn','The Undying Choir','Everlight'],
 ['aegis','Tideward','The Crushing Deep','Abyssward'],
 ['fury','Rustlands','The Iron Scar','Ironbound'],
 ['arcane','Sigilfall','The Unwritten Vault','Voidglyph']
];
const CATALOG=Object.freeze(rows.map(([id,realm,anchor,stone])=>Object.freeze({id,realm,anchor,stone:stone+' Anchorstone',identityPending:false,art:'placeholder',shards:Object.freeze(['I','II','III'].map((part,i)=>Object.freeze({id:id+'_shard_'+(i+1),family:id,part:i+1,name:stone+' Shard '+part,kind:'runestone_shard',art:'placeholder'})))})));
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
function status(s,id){requireValid(s);if(!get(id))return null;const r=s.realms[id];return r.portal==='locked'&&r.shards.length===3?'ready_to_unlock':r.portal;}
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

// A2 experimental policy. Separate physical collection, independent of wallet and Rune slots.
const DROP_RATES=Object.freeze({normal:.01,elite:.15,boss:.35}),PITY=5;
function collection(){return {campaign:create(),pity:Object.fromEntries(ids.map(id=>[id,0])),expedition:null};}
function validCollection(c){
 if(!exact(c,['campaign','pity','expedition'])||!valid(c.campaign)||!exact(c.pity,ids)||ids.some(id=>!number(c.pity[id])||c.pity[id]>=PITY||c.campaign.realms[id].portal!=='locked'&&c.pity[id]!==0))return false;
 const e=c.expedition;if(e===null)return true;
 if(c.campaign.active||!exact(e,['seed','family','seen','pending','bossWon'])||!number(e.seed)||e.seed>0xffffffff||!get(e.family)||!Array.isArray(e.seen)||!e.seen.length||new Set(e.seen).size!==e.seen.length||e.seen.some(n=>!number(n)||n>24)||typeof e.bossWon!=='boolean')return false;
 return e.pending===null||missingShards(c.campaign,e.family).some(x=>x.id===e.pending);
}
function requireCollection(c){if(!validCollection(c))throw Error('Invalid Runestone Shard collection');}
function random(seed,label){
 let n=(seed^0x9e3779b9)>>>0;for(const ch of label)n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;
 n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);n^=n>>>16;return (n>>>0)/4294967296;
}
function observeVictory(c,{seed,family,node,kind}){
 requireCollection(c);if(c.campaign.active||!number(seed)||seed>0xffffffff||!get(family)||!number(node)||node>24||!Object.hasOwn(DROP_RATES,kind))throw Error('Invalid shard encounter');
 const previous=c.expedition;if(previous&&(previous.seed!==seed||previous.family!==family))throw Error('Shard encounter belongs to another Expedition');
 if(previous?.seen.includes(node)||previous?.bossWon)return c;
 const e=previous?{...previous,seen:[...previous.seen,node]}:{seed,family,seen:[node],pending:null,bossWon:false};
 if(kind==='boss')e.bossWon=true;
 const missing=missingShards(c.campaign,family);
 if(!e.pending&&missing.length&&(kind==='boss'&&c.pity[family]===PITY-1||random(seed,family+':'+node+':'+kind+':drop')<DROP_RATES[kind])){
  e.pending=missing[Math.floor(random(seed,family+':'+node+':part')*missing.length)].id;
 }
 return {...c,expedition:e};
}
function settleCollection(c,outcome){
 requireCollection(c);if(!['victory','extracted','defeat','abandoned','cancelled'].includes(outcome))throw Error('Invalid shard settlement');
 const e=c.expedition;if(!e)return c;
 const secured=outcome==='victory'||outcome==='extracted';
 let campaign=c.campaign,pity=c.pity;
 if(secured&&e.pending){campaign=grantSecuredShard(campaign,e.pending);if(!campaign)throw Error('Cannot secure duplicate shard');pity={...pity,[e.family]:0};}
 else if(outcome==='victory'&&e.bossWon&&missingShards(campaign,e.family).length)pity={...pity,[e.family]:Math.min(PITY-1,pity[e.family]+1)};
 return {...c,campaign,pity,expedition:null};
}
function assembleCollection(c,id){requireCollection(c);if(c.expedition)return null;const campaign=openPortal(c.campaign,id);return campaign?{...c,campaign,pity:{...c.pity,[id]:0}}:null;}
function shardById(id){for(const r of CATALOG){const shard=r.shards.find(x=>x.id===id);if(shard)return shard;}return null;}
function bag(c){requireCollection(c);return {pending:c.expedition?.pending?shardById(c.expedition.pending):null,secured:CATALOG.flatMap(r=>c.campaign.realms[r.id].shards.map(shardById))};}

root.WandererV013AnchorCampaign=Object.freeze({DROP_RATES,PITY,collection,validCollection,observeVictory,settleCollection,assembleCollection,bag,shardById,VERSION,CATALOG,get,create,valid,status,missingShards,grantSecuredShard,openPortal,difficultyStep,startAttempt,settleAttempt,finalUnlocked,summary});
})(globalThis);
