'use strict';
// B1.2C.1: read-only instrumentation of earned natural accounts, never grants resources.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const B=require('./v013-b1-e10-rebaseline.cjs'),N=require('./v013-natural-progression.cjs');
const S=require('./simulate-progression.cjs'),P=globalThis.WandererV012Consumables,C=globalThis.WandererV013Crafting,R=globalThis.WandererV012Runes,T=globalThis.WandererAutomaticTalents;
const selection=require('../reports/v013-b12c1-selection.json');
const config={maxLevel:10,maxAttempts:12,maxTotalAttempts:60,tickLimit:6500,maxRooms:34,surrenderPolicy:'observed-stalemate-v1'};
const manifest=B.manifest(),profiles=new Map(manifest.natural.map(p=>[p.id,p]));
const nodes=new Map(T.NODES.map(n=>[n.id,n])),potionRecipes=new Map(P.RECIPES.map(p=>[p.id,p])),forgeRecipes=new Set(C.RECIPES.map(p=>p.id)),runeFamilies=new Set(R.FAMILIES.map(r=>r.id));
const base=id=>id.replace(/_rank\d+$/,'');
const clone=x=>JSON.parse(JSON.stringify(x));
const count=(rows,key)=>{const o={};for(const r of rows){const k=key(r);if(k!=null)o[k]=(o[k]||0)+1;}return o;};
const sum=(rows,key)=>rows.reduce((s,r)=>s+(Number(r[key])||0),0);
const merge=maps=>{const out={};for(const m of maps)for(const [k,v] of Object.entries(m||{}))if(Number.isFinite(v))out[k]=(out[k]||0)+v;return out;};
const norm=x=>x==='Off-Hand Dagger'?'Daggers':x;
const num=x=>Number.isFinite(x)?+x.toFixed(3):null;
const avg=(rows,f)=>{const a=rows.map(f).filter(Number.isFinite);return a.length?num(a.reduce((s,v)=>s+v,0)/a.length):null;};
const armorSlots=['helm','armor','gloves','boots','belt'];
function campObservation({a,profile,level,attempt}){
 const s=a.state(),v=a.vitals(),p=s.automaticTalents,stats=a.baseStats();
 const desc=i=>({id:i.id,slot:i.slot,subtype:i.subtype,armorType:i.armorType||null,tier:i.tier,rarity:i.rarity,price:i.goldPrice??null});
 const match=(i,slot)=>slot==='weapon'?profile.weapons.includes(i.subtype):slot==='offhand'?!!profile.offhands?.includes(norm(i.subtype)):armorSlots.includes(slot)&&i.armorType===profile.armor;
 const alternatives=[];
 for(const slot of ['weapon','offhand',...armorSlots]){
  const current=s.equip[slot];if(current&&match(current,slot))continue;
  const pool=[...(s.stash||[]).map(i=>[i,'stash']),...(s.merchant?.stock||[]).filter(i=>i.goldPrice<=s.gold).map(i=>[i,'merchant'])];
  for(const [item,location] of pool)if((item.slot===slot||slot==='offhand'&&item.subtype==='Daggers')&&match(item,slot)){
   alternatives.push({slot,current:current?desc(current):null,item:desc(item),location,heuristicGain:num(N.identityGain(item,current,profile,slot))});
  }
 }
 const ready=P.CATALOG.filter(x=>a.potions.progress(x.id)?.ready).map(x=>x.id);
 const potionScores=Object.fromEntries(P.CATALOG.map(x=>[x.id,N.potionScore(x.id,profile,v)]));
 return clone({level,attempt,legal:T.valid(p),stats:Object.fromEntries(['attack','spellPower','defense','maxhp','mana','manaRegen','attacksPerSec','crit','blockChance','evasionRating','healingPower','barrierPower'].map(k=>[k,stats[k]??null])),alternatives,readyPotionRecipes:ready,potionScores,merchantOffers:(s.merchant?.stock||[]).map(desc),potionOffers:s.apothecary?.stock||[],learnedRecipes:s.crafting?.learnedRecipes||[],gold:s.gold,stashRoom:a.storage.hasRoom()});
}
function simulate(id,pick){
 const p=B.naturalProfile(id);
 const acc=N.simulateAccount(pick.seed,id,{...N.DEFAULTS,...config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:campObservation});
 assert.equal(acc.startXp,0);assert(acc.initialGear.items.every(x=>x.startingGear));
 return {...acc,historicalEndLevel:pick.historicalEndLevel,index:pick.index};
}
function audit(id,accounts){
 const p=profiles.get(id),rows=accounts.flatMap(a=>a.attempts.map(t=>({...t,seed:a.seed}))),valid=rows.filter(t=>t.before&&t.after),issues=[];
 const issue=(t,message)=>issues.push({seed:t.seed,level:t.level,attempt:t.attempt,message});
 const checkState=(t,s)=>{
  const owned=(s.talentNodes||[]).map(base);
  if(s.spent>s.earned||s.attributeSpent>s.attributeEarned)issue(t,'budget overspend');
  for(const n of owned){const x=nodes.get(n);if(!x||x.pending||(x.family&&!p.families.includes(x.family))||(x.pair&&!x.pair.every(f=>p.families.includes(f))))issue(t,'invalid/foreign talent '+n);}
  if(s.prepared&&!owned.includes(base(s.prepared)))issue(t,'unowned prepared talent '+s.prepared);
  if(p.element&&owned.includes('element_choice')&&s.element!==p.element)issue(t,'wrong attunement '+s.element);
  try{P.selection(s.consumables,s.potionSelection);}catch(e){issue(t,'illegal potion selection: '+e.message);}
  const ids=s.runeSlots.filter(Boolean),byId=new Map(s.runeBag.map(x=>[x.id,x]));
  if(ids.length>3||new Set(ids).size!==ids.length||ids.some(x=>!byId.has(x)))issue(t,'invalid rune slots');
  if(s.runeBag.some(x=>!runeFamilies.has(x.family)))issue(t,'unknown rune family');
  const families=ids.map(x=>byId.get(x)?.family);
  if(new Set(families).size!==families.length)issue(t,'duplicate equipped rune family');
 };
 for(const t of valid){
  checkState(t,t.before);checkState(t,t.after);
  if(t.after.xp<t.before.xp||t.after.unlocked<t.before.unlocked||t.after.unlocked>t.before.unlocked&&!t.bossWon)issue(t,'invalid earned progression');
  if(t.earnedProbe?.legal!==true)issue(t,'native talent validity not confirmed');
  if(t.contractPaid&&!['victory','extracted'].includes(t.status))issue(t,'unsafe contract reward');
  if(t.surrendered&&(t.error||t.bossWon||t.status!=='defeat'))issue(t,'invalid surrender');
  for(const x of t.camp?.potions||[])if(x.action==='craft'){
   const r=potionRecipes.get(x.kind);
   if(!r||x.essenceSpent!==r.essence||JSON.stringify(x.reagentsSpent)!==JSON.stringify(r.reagents))issue(t,'potion craft cost mismatch '+x.kind);
  }
  for(const x of t.potions||[])if(!potionRecipes.has(x.kind))issue(t,'unknown used potion '+x.kind);
  for(const x of t.camp?.crafted||[])if(!forgeRecipes.has(x.recipe))issue(t,'unknown Forge recipe '+x.recipe);
  for(const r of t.rooms||[]){
   if([r.won,r.died,r.surrendered,r.timedOut].filter(Boolean).length!==1)issue(t,'ambiguous fight outcome');
   for(const n of r.actualTalentNodes||[])if(!nodes.has(base(n)))issue(t,'unknown combat talent '+n);
   if(r.preparedId&&!(r.actualTalentNodes||[]).map(base).includes(base(r.preparedId)))issue(t,'prepared ability missing in fight');
  }
 }
 function coverage(ts){
  const rs=ts.flatMap(t=>t.rooms||[]),gear=slot=>ts.map(t=>t.before.gear.items.find(i=>i.slot===slot)).filter(Boolean);
  const wp=gear('weapon'),off=gear('offhand'),armor=armorSlots.flatMap(gear),mp=rs.filter(r=>r.mpMax>0),casts=rs.filter(r=>['Wand','Staff'].includes(r.actualWeapon));
  const alternatives=ts.flatMap(t=>(t.earnedProbe?.alternatives||[]).map(a=>({...a,seed:t.seed,level:t.level,attempt:t.attempt})));
  const abilities=p.goals.map(g=>{
   const equipped=rs.filter(r=>(r.actualTalentNodes||[]).map(base).includes(g.id));
   return {...g,ownedAttempts:ts.filter(t=>t.before.talentNodes.map(base).includes(g.id)).length,ownedFights:equipped.length,preparedFights:rs.filter(r=>r.preparedId===g.id).length,preparedActivations:sum(rs.filter(r=>r.preparedId===g.id),'preparedActivations'),recordedPassiveActivations:equipped.reduce((s,r)=>s+(r.passiveActivations?.[g.id]||0),0)};
  });
  return {attempts:ts.length,accounts:new Set(ts.map(t=>t.seed)).size,fights:rs.length,points:avg(ts,t=>t.before.spent),pointsMax:Math.max(0,...ts.map(t=>t.before.spent)),unspentPoints:avg(ts,t=>t.before.earned-t.before.spent),weapon:count(wp,x=>x.subtype),weaponMatched:wp.filter(x=>p.weapons.includes(x.subtype)).length,weaponObserved:wp.length,offhand:count(off,x=>norm(x.subtype)),offhandPreferred:p.offhands.length?off.filter(x=>p.offhands.includes(norm(x.subtype))).length:null,offhandObserved:off.length,armor:count(armor,x=>x.armorType),armorMatched:armor.filter(x=>x.armorType===p.armor).length,armorObserved:armor.length,gearAlternatives:alternatives,stats:Object.fromEntries(['attack','spellPower','defense','maxhp','mana','manaRegen','attacksPerSec','crit','blockChance','evasionRating','healingPower','barrierPower'].map(k=>[k,avg(ts,t=>t.earnedProbe?.stats?.[k])])),abilities,passiveActivations:merge(rs.map(r=>r.passiveActivations)),abilityMetrics:merge(rs.map(r=>r.abilityMetrics)),mana:{fights:mp.length,casterWeaponFights:casts.length,spent:sum(mp,'manaSpent'),fundedCasts:sum(rs,'fundedCasts'),unfundedCasterAttacks:sum(rs,'unfundedCasterAttacks'),remainingPct:avg(mp,r=>100*r.mpEnd/r.mpMax)},economy:{potionsSelected:count(ts.flatMap(t=>t.before.potionSelection),x=>x),potionsUsed:count(ts.flatMap(t=>t.potions||[]),x=>x.kind),potionsCrafted:count(ts.flatMap(t=>t.camp?.potions||[]).filter(x=>x.action==='craft'),x=>x.kind),potionsBought:count(ts.flatMap(t=>t.camp?.potions||[]).filter(x=>x.action==='buy'),x=>x.kind),readyPotionRecipes:count(ts.flatMap(t=>t.earnedProbe?.readyPotionRecipes||[]),x=>x),forgeCrafts:count(ts.flatMap(t=>t.camp?.crafted||[]),x=>x.recipe),refinements:ts.flatMap(t=>t.camp?.refined||[]).length,runeEquips:ts.flatMap(t=>t.camp?.runes||[]).filter(x=>x.action==='equip').length,runesInSlots:count(ts.flatMap(t=>t.before.runeSlots.filter(Boolean).map(id=>t.before.runeBag.find(r=>r.id===id))),x=>x?.family),contractsPaid:ts.filter(t=>t.contractPaid).length},outcomes:{wins:rs.filter(r=>r.won).length,deaths:rs.filter(r=>r.died).length,surrenders:rs.filter(r=>r.surrendered).length,timeouts:rs.filter(r=>r.timedOut).length}};
 }
 return {id,intent:p,accounts:accounts.map(a=>({seed:a.seed,historicalEndLevel:a.historicalEndLevel,endLevel:a.endLevel,stopReason:a.stopReason})),errors:rows.filter(t=>t.error).map(t=>({seed:t.seed,level:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic})),issues,coverage:{all:coverage(valid),early:coverage(valid.filter(t=>t.level<5)),mid:coverage(valid.filter(t=>t.level>=5&&t.level<10)),e10:coverage(valid.filter(t=>t.level===10)),developed:coverage(valid.filter(t=>t.before.spent>=10))}};
}
function run(shard){
 assert(Number.isInteger(shard)&&shard>=0&&shard<7);
 assert.deepEqual(selection.profiles.map(x=>x.id),B.NATURAL);
 const results=selection.profiles.slice(shard*4,shard*4+4).map(p=>{const accounts=p.picks.map(x=>simulate(p.id,x));return audit(p.id,accounts);});
 const payload={shard,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,config,selectionSource:selection.sourceRun,results};
 fs.mkdirSync('reports/b12c1',{recursive:true});fs.writeFileSync('reports/b12c1/shard-'+shard+'.json',JSON.stringify(payload,null,2));
 for(const r of results){const d=r.coverage.developed,e=r.coverage.e10;console.log('B12C1_PROFILE='+JSON.stringify({id:r.id,accounts:r.accounts,errors:r.errors.map(({seed,level,attempt,error})=>({seed,level,attempt,error})),issues:r.issues,developed:{attempts:d.attempts,fights:d.fights,pointsMax:d.pointsMax,weapon:d.weapon,armor:d.armor,offhand:d.offhand,mana:d.mana,gearAlternatives:d.gearAlternatives.length,abilities:d.abilities.map(({id,ownedFights,preparedActivations,recordedPassiveActivations})=>({id,ownedFights,preparedActivations,recordedPassiveActivations})),economy:d.economy},e10:{attempts:e.attempts,accounts:e.accounts,fights:e.fights}}));}
}
function aggregate(){
 const shards=Array.from({length:7},(_,i)=>JSON.parse(fs.readFileSync('reports/b12c1/shard-'+i+'.json','utf8')));
 assert(shards.every((s,i)=>s.shard===i&&s.commit===shards[0].commit&&s.native===shards[0].native&&JSON.stringify(s.config)===JSON.stringify(config)));
 const results=shards.flatMap(s=>s.results);assert.deepEqual(results.map(r=>r.id),B.NATURAL);assert(results.every(r=>r.accounts.length===2));
 const accounts=results.flatMap(r=>r.accounts),d=results.map(r=>r.coverage.developed),e=results.map(r=>r.coverage.e10);
 const summary={profiles:results.length,accounts:accounts.length,profilesDeveloped:d.filter(x=>x.fights>0).length,developedAccounts:sum(d,'accounts'),developedFights:sum(d,'fights'),e10Accounts:sum(e,'accounts'),e10Fights:sum(e,'fights'),profilesE10:e.filter(x=>x.fights>0).length,errors:results.flatMap(r=>r.errors).length,issues:results.flatMap(r=>r.issues).length,developedWeaponMatched:sum(d,'weaponMatched'),developedWeaponObserved:sum(d,'weaponObserved'),developedArmorMatched:sum(d,'armorMatched'),developedArmorObserved:sum(d,'armorObserved'),manaFights:d.reduce((s,x)=>s+x.mana.fights,0),profilesWithoutDeveloped:results.filter(r=>!r.coverage.developed.fights).map(r=>r.id),profilesWithoutE10:results.filter(r=>!r.coverage.e10.fights).map(r=>r.id)};
 const report={scope:'selected historical replays; never a population win-rate estimate',config,selection,summary,results};
 fs.writeFileSync('reports/b12c1/summary.json',JSON.stringify(report,null,2));console.log('B12C1_OVERVIEW='+JSON.stringify(summary));
 if(summary.errors||summary.issues)process.exitCode=1;
}
if(require.main===module){if(process.argv[2]==='aggregate')aggregate();else run(Number(process.argv[2]));}
module.exports={audit,campObservation,config};
