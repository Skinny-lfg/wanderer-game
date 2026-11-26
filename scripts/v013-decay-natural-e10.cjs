'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const N=require('./v013-natural-progression.cjs'),S=require('./simulate-progression.cjs');
const Balance=require('./v013-balance-criteria.cjs');
const IDS=[...['cycle','overflow','hybrid'].flatMap(r=>['twohand','staff','daggers','wand'].map(w=>'smart-decay-'+r+'-'+w)),'smart-decay-plagueheart','smart-decay-arcane-aegis','smart-blood-pure','smart-fury-pure','smart-radiance-pure','smart-aegis-radiance','smart-arcane-fire-pure','smart-arcane-lightning-pure','smart-arcane-arcane-pure','smart-arcane-frost-radiance'];
const OUT='reports/decay-natural-e10',COUNT=20,SEEDS=Array.from({length:COUNT},(_,i)=>65501001+i*101);
const mean=(a,f)=>a.length?a.reduce((n,x)=>n+f(x),0)/a.length:null;
const counts=(a,f)=>{const out={};for(const x of a){const k=f(x);out[k]=(out[k]||0)+1;}return out;};
function account(id,seed,maxLevel=10,maxAttempts=12,maxTotalAttempts=60){
 const opts={...N.DEFAULTS,seeds:[seed],profiles:[id],maxLevel,maxAttempts,maxTotalAttempts,tickLimit:6500,maxRooms:34};
 const profile={...N.PROFILES[id],synergyAudit:true,researchGearPreference:true,offhands:id.endsWith('-daggers')?['Daggers']:id.endsWith('-wand')?['Tome','Orb']:undefined};
 const acc=N.simulateAccount(seed,id,opts,{researchProfiles:{[id]:profile},equipEarnedRunes:true,decisionModel:'adaptive'});
 assert.equal(acc.startXp,0);
 for(const t of acc.attempts){
  assert(!t.error&&t.status!=='error',id+'/'+seed+' E'+t.level+' '+JSON.stringify(t.diagnostic||t.error));
  assert(t.before&&t.after);
  assert.equal(t.after.runeBag.length,t.before.runeBag.length+Number(!!t.bossWon),id+' native boss rune settlement');
  for(const st of [t.before,t.after]){
   const bag=new Map(st.runeBag.map(r=>[r.id,r])),slots=st.runeSlots.filter(Boolean);
   assert(slots.every(x=>bag.has(x)));assert.equal(new Set(slots.map(x=>bag.get(x).family)).size,slots.length);
  }
  assert(t.after.unlocked>=t.before.unlocked);
 }
 return acc;
}
function stats(accounts){
 const attempts=accounts.flatMap(a=>a.attempts),rooms=attempts.flatMap(a=>a.rooms||[]),runeActions=attempts.flatMap(a=>a.camp?.runes||[]);
 const fightStats=(rs,kind)=>({balance:Balance.classify(kind,mean(rs,x=>100*Number(x.won)),rs.length),n:rs.length,wins:rs.filter(x=>x.won).length,winPct:mean(rs,x=>100*Number(x.won)),damageTaken:mean(rs,x=>x.damageTaken||0),dps:mean(rs,x=>(x.damageDealt||0)/Math.max(.11,x.seconds)),secondaryDps:mean(rs,x=>(x.secondaryTargetDamage||0)/Math.max(.11,x.seconds)),manaEndPct:mean(rs.filter(x=>x.mpMax>0),x=>100*x.mpEnd/x.mpMax),decayMetrics:Object.fromEntries([...new Set(rs.flatMap(x=>Object.keys(x.decayMetrics||{})))].map(k=>[k,rs.reduce((n,x)=>n+(x.decayMetrics?.[k]||0),0)]))});
 const group=x=>x.roomType==='combat'?'normal-'+(x.initialEnemies<=1?'1':x.initialEnemies<=4?'2-4':x.initialEnemies<=8?'5-8':'9+'):x.roomType==='elite'?'elite':x.roomType==='boss'?'boss':'other';
 const byEncounter=Object.fromEntries(['normal-1','normal-2-4','normal-5-8','normal-9+','elite','boss'].map(k=>[k,fightStats(rooms.filter(x=>group(x)===k),k)]));
 return {accounts:accounts.length,meanUnlocked:mean(accounts,x=>x.endLevel),reachedE5:accounts.filter(x=>x.endLevel>=5).length,reachedE10:accounts.filter(x=>x.endLevel>=10).length,clearedE10:accounts.filter(x=>x.endLevel>=11).length,attempts:attempts.length,wins:attempts.filter(x=>x.bossWon).length,deaths:attempts.filter(x=>x.status==='defeat').length,extractions:attempts.filter(x=>x.status==='extracted').length,byLevel:Array.from({length:10},(_,i)=>{const E=i+1,ts=attempts.filter(t=>t.level===E);return {E,reached:accounts.filter(a=>a.reached.includes(E)).length,attempts:ts.length,bossWins:ts.filter(t=>t.bossWon).length,deaths:ts.filter(t=>t.status==='defeat').length,extractions:ts.filter(t=>t.status==='extracted').length,byEncounter:Object.fromEntries(['normal-1','normal-2-4','normal-5-8','normal-9+','elite','boss'].map(k=>[k,fightStats(ts.flatMap(t=>t.rooms||[]).filter(x=>group(x)===k),k)]))};}),byEncounter,runeDrops:attempts.filter(t=>t.bossWon).length,runeEquips:counts(runeActions.filter(x=>x.action==='equip'),x=>x.family),runeRarities:counts(runeActions.filter(x=>x.action==='equip'),x=>x.rarity),finalRuneFamilies:counts(accounts.flatMap(a=>a.runeSlots.filter(Boolean).map(id=>a.runeBag.find(r=>r.id===id))).filter(Boolean),x=>x.family),boons:counts(attempts.flatMap(t=>t.boons||[]),x=>x.id),actualWeapons:counts(rooms,x=>x.actualWeapon),talentUnlocks:Object.fromEntries(['corruption_cycle','corruption_nova','blight','contagious_touch','plagueheart'].map(id=>[id,accounts.filter(a=>a.talents.includes(id)).length])),stopReasons:counts(accounts,x=>x.stopReason||'cleared-horizon')};
}
function write(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj)+'\n');}
function run(id){assert(IDS.includes(id));const accounts=SEEDS.map(seed=>account(id,seed));const summary=stats(accounts);write(id+'.json',{id,source:S.sourceFingerprint().sha256,seeds:SEEDS,accounts,summary});console.log('NATURAL_ROT='+JSON.stringify({id,summary}));}
function smoke(){for(const id of IDS){assert(N.PROFILES[id]);account(id,SEEDS[0],1,1,1);}console.log('NATURAL_ROT_SMOKE_OK');}
function aggregate(){const reports=IDS.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));assert.equal(new Set(reports.map(x=>x.source)).size,1);for(const r of reports){assert.deepEqual(r.seeds,SEEDS);assert.equal(r.accounts.length,COUNT);assert(r.accounts.every(a=>a.profile===r.id));}const summary={source:reports[0].source,n:reports.length*COUNT,profiles:Object.fromEntries(reports.map(r=>[r.id,r.summary])),budget:{perLevel:12,total:60,horizon:10},notes:'Native earned accounts. No forced gear, rewards, levels, talents, or Rune fixtures. Preferred weapon is not guaranteed. No damage calibration applied. All earned rune decisions use native Camp actions.'};write('summary.json',summary);console.log('NATURAL_ROT_OVERVIEW='+JSON.stringify(summary));}
if(require.main===module){const arg=process.argv[2];if(arg==='smoke')smoke();else if(arg==='aggregate')aggregate();else run(arg);}
