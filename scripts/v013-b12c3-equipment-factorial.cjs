'use strict';
// Four pure cells on matched, previously selected earned seeds. Separate historical full-bundle comparison.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const B=require('./v013-b1-e10-rebaseline.cjs'),N=require('./v013-natural-progression.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),S=require('./simulate-progression.cjs');
const selection=require('../reports/v013-b12c1-selection.json');
const C=globalThis.WandererV013Crafting,recipes=new Map(C.RECIPES.map(r=>[r.id,r]));
const two=new Set(['Two-Handed','Bow','Staff']),out='reports/b12c3';
const ARMS=Object.freeze({A:{compat:false,strict:false},B:{compat:true,strict:false},C:{compat:false,strict:true},D:{compat:true,strict:true},E:{compat:true,strict:true,dual:true}});
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),mean=(a,f)=>a.length?sum(a,f)/a.length:null,round=n=>Number.isFinite(n)?+n.toFixed(3):null;
const norm=x=>x==='Off-Hand Dagger'?'Daggers':x;
function profile(id,arm){
 const flags=ARMS[arm];assert(flags);
 if(flags.dual)assert.equal(id,'smart-fury-daggers');
 const p=B.naturalProfile(id);
 // Pure factors: no full B1.2C.2 bundle, displacement, refresh or extra
 // target enumeration; E separately adds its historical dual-dagger preference.
 return {...p,strictResearchIdentity:flags.strict,agentCompatibilityOnly:flags.compat,agentDecisionQuality:null,...(flags.dual?{offhands:['Daggers']}:{})};
}
function observe(ctx){
 const p=A.campObservation(ctx),s=ctx.a.state(),v=ctx.a.vitals(),gear=s.equip,raw=(item,slot)=>N.gearScore(item,ctx.profile,slot);
 const pool=[...(s.stash||[]).map(item=>({item,location:'stash'})),...(s.merchant?.stock||[]).filter(i=>i.goldPrice<=s.gold).map(item=>({item,location:'merchant'}))];
 const alternatives=[];
 for(const slot of ['weapon','offhand','helm','armor','gloves','boots','belt']){
  const current=gear[slot];
  const wanted=slot==='weapon'?ctx.profile.weapons:slot==='offhand'?ctx.profile.offhands:[ctx.profile.armor];
  if(!wanted?.length)continue;
  const type=i=>slot==='offhand'?norm(i?.subtype):slot==='weapon'?i?.subtype:i?.armorType||i?.subtype;
  for(const {item,location} of pool){
   if(!(item.slot===slot||slot==='offhand'&&item.subtype==='Daggers')||item.locked)continue;
   const compatible=slot!=='offhand'||!two.has(gear.weapon?.subtype);
   const itemMatches=wanted.includes(type(item)),currentMatches=wanted.includes(type(current)),gain=raw(item,slot)-raw(current,slot);
   if(!compatible||itemMatches===currentMatches||gain<5)continue;
   alternatives.push({slot,location,item:item.name,type:type(item),current:current?.name||null,currentType:type(current)||null,itemMatches,currentMatches,rawGain:round(gain),policyGain:round(N.identityGain(item,current,ctx.profile,slot)),price:item.goldPrice??null});
  }
 }
 return {...p,mp:v.mp,maxmp:v.maxmp,manaPotionOwned:s.consumables?.mana||0,alternativesTradeoff:alternatives};
}
function trace(t,p){
 const before=t.before||{},g=before.gear?.items||[],weapon=g.find(x=>x.slot==='weapon'),off=g.find(x=>x.slot==='offhand');
 const armor=g.filter(x=>['helm','armor','gloves','boots','belt'].includes(x.slot));
 const camp=t.camp||{},probe=t.earnedProbe||{},rooms=t.rooms||[];
 // Exclude heuristic score changes from state signature. First divergence is
 // first observed difference, not a claim that the first decision caused it.
 const gear=g.map(i=>({slot:i.slot,subtype:i.subtype,armorType:i.armorType,name:i.name,tier:i.tier,rarity:i.rarity,stats:i.stats}));
 const investments={crafted:(camp.crafted||[]).map(x=>({recipe:x.recipe,slot:x.slot,subtype:x.subtype??null,weaponAtDecision:x.weaponAtDecision??null,fragments:x.fragmentsSpent,essence:x.essenceSpent,equipped:x.equipped})),bought:(camp.bought||[]).map(x=>({name:x.name,cost:x.cost,slot:x.slot??null,weaponAtDecision:x.weaponAtDecision??null})),equipped:(camp.equipped||[]).map(x=>({slot:x.slot,item:x.item,previous:x.previous})),refined:(camp.refined||[]).map(x=>({recipe:x.recipe,family:x.family}))};
 const state={gear,talents:before.talentNodes||[],element:before.element||null,potions:before.potionSelection||[],runes:before.runeSlots||[],gold:before.gold,fragments:before.fragments,essence:before.essence,xp:before.xp};
 const signature=crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
 const invalid=[];
 for(const x of investments.crafted)if((x.slot==='offhand'||recipes.get(x.recipe)?.slot==='offhand')&&(two.has(x.weaponAtDecision)||p.weapons.every(w=>two.has(w))))invalid.push({type:'forge',...x});
 for(const x of investments.bought)if(x.slot==='offhand'&&(two.has(x.weaponAtDecision)||p.weapons.every(w=>two.has(w))))invalid.push({type:'merchant',...x});
 if(two.has(weapon?.subtype)&&off)invalid.push({type:'native-loadout',weapon:weapon.subtype,offhand:off.subtype});
 return {level:t.level,attempt:t.attempt,error:t.error||null,status:t.status,bossWon:!!t.bossWon,surrendered:!!t.surrendered,signature,state,stats:probe.stats||{},gearIdentity:{weapon:weapon?.subtype||null,weaponMatch:!!weapon&&p.weapons.includes(weapon.subtype),armorMatched:armor.filter(x=>x.armorType===p.armor).length,armorObserved:armor.length,offhand:norm(off?.subtype)||null,offhandMatch:p.offhands?.length?!!off&&p.offhands.includes(norm(off.subtype)):null},investments,invalid,tradeoffs:probe.alternativesTradeoff||[],mana:{funded:sum(rooms,x=>x.fundedCasts||0),unfunded:sum(rooms,x=>x.unfundedCasterAttacks||0)},rooms:{n:rooms.length,wins:rooms.filter(x=>x.won).length,timeouts:rooms.filter(x=>x.timedOut).length}};
}
function replay(id,pick,arm){
 const p=profile(id,arm),a=N.simulateAccount(pick.seed,id,{...N.DEFAULTS,...A.config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:observe});
 assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));
 const audit=A.audit(id,[a]),ts=a.attempts.map(t=>trace(t,p));
 return {id,seed:pick.seed,arm,flags:ARMS[arm],intent:{weapons:p.weapons,armor:p.armor,offhands:p.offhands||[]},endLevel:a.endLevel,stopReason:a.stopReason,errors:audit.errors,issues:audit.issues,coverage:audit.coverage,trace:ts,invalid:ts.flatMap(t=>t.invalid.map(x=>({level:t.level,attempt:t.attempt,...x})))};
}
function write(file,obj){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/'+file,JSON.stringify(obj,null,2));}
function run(shard){
 assert(Number.isInteger(shard)&&shard>=0&&shard<7);
 assert.deepEqual(selection.profiles.map(x=>x.id),B.NATURAL);
 const rows=[];
 for(const p of selection.profiles.slice(shard*4,shard*4+4))for(const pick of p.picks){
  for(const arm of ['A','B','C','D',...(p.id==='smart-fury-daggers'?['E']:[])]){
   const r=replay(p.id,pick,arm);rows.push(r);
   console.log('B12C3_CELL='+JSON.stringify({id:r.id,seed:r.seed,arm:r.arm,endLevel:r.endLevel,errors:r.errors.length,issues:r.issues.length,invalid:r.invalid.length,developed:r.coverage.developed.fights,weapon:r.coverage.developed.weapon,offhand:r.coverage.developed.offhand}));
  }
 }
 write('shard-'+shard+'.json',{shard,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,config:A.config,arms:ARMS,rows});
}
function firstDifference(a,b){
 const map=new Map(b.trace.map(t=>[t.level+':'+t.attempt,t]));
 for(const t of a.trace){
  const u=map.get(t.level+':'+t.attempt);
  if(!u)return {level:t.level,attempt:t.attempt,kind:'missing-attempt'};
  if(t.signature!==u.signature||t.status!==u.status||t.bossWon!==u.bossWon)return {level:t.level,attempt:t.attempt,kind:t.signature!==u.signature?'camp-state':'encounter-outcome',before:{state:t.state,stats:t.stats,status:t.status,investments:t.investments,tradeoffs:t.tradeoffs},after:{state:u.state,stats:u.stats,status:u.status,investments:u.investments,tradeoffs:u.tradeoffs}};
 }
 return a.trace.length===b.trace.length?null:{kind:'extra-attempts'};
}
function summarize(rows){
 const d=rows.map(r=>r.coverage.developed),early=rows.flatMap(r=>r.trace.filter(t=>t.level<=4));
 const denom=(key)=>sum(d,x=>x[key]||0);
 return {accounts:rows.length,endLevelMean:round(mean(rows,r=>r.endLevel)),stuckE1:rows.filter(r=>r.endLevel===1).length,reachedE2:rows.filter(r=>r.endLevel>=2).length,reachedE5:rows.filter(r=>r.endLevel>=5).length,reachedE10:rows.filter(r=>r.endLevel>=10).length,clearedE10:rows.filter(r=>r.endLevel>=11).length,developed:rows.filter(r=>r.coverage.developed.fights>0).length,errors:sum(rows,r=>r.errors.length),issues:sum(rows,r=>r.issues.length),invalidInvestments:sum(rows,r=>r.invalid.length),weaponMatched:denom('weaponMatched'),weaponObserved:denom('weaponObserved'),armorMatched:denom('armorMatched'),armorObserved:denom('armorObserved'),earlyAttempts:early.length,earlyBossWins:early.filter(t=>t.bossWon).length,earlyTimeouts:sum(early,t=>t.rooms.timeouts),earlyTradeoffs:sum(early,t=>t.tradeoffs.length),unfunded:sum(d,x=>x.mana.unfundedCasterAttacks),funded:sum(d,x=>x.mana.fundedCasts)};
}
function contrast(v){return {compat:round(((v.B-v.A)+(v.D-v.C))/2),identity:round(((v.C-v.A)+(v.D-v.B))/2),interaction:round(v.D-v.C-v.B+v.A)};}
function aggregate(){
 const shards=Array.from({length:7},(_,i)=>JSON.parse(fs.readFileSync(out+'/shard-'+i+'.json','utf8')));
 assert(shards.every((s,i)=>s.shard===i&&s.commit===shards[0].commit&&s.native===shards[0].native&&JSON.stringify(s.config)===JSON.stringify(A.config)&&JSON.stringify(s.arms)===JSON.stringify(ARMS)));
 const rows=shards.flatMap(s=>s.rows),lookup=new Map(rows.map(r=>[r.id+'/'+r.seed+'/'+r.arm,r]));assert.equal(lookup.size,226);assert.equal(rows.length,226);
 const baseline=JSON.parse(fs.readFileSync('baseline/summary.json','utf8')),full=JSON.parse(fs.readFileSync('previous/summary.json','utf8'));
 assert.deepEqual(baseline.selection,selection);assert.deepEqual(full.selection,selection);assert.deepEqual(baseline.config,A.config);assert.deepEqual(full.config,A.config);
 assert.equal(full.commit,'7e21b10afe8d74beae99214707a5098afadb924b');
 const oldMap=new Map(baseline.results.flatMap(r=>r.accounts.map(a=>[r.id+'/'+a.seed,a.endLevel])));
 const fullMap=new Map(full.results.flatMap(r=>r.accounts.map(a=>[r.id+'/'+a.seed,a.endLevel])));
 const pairs=[],replayMismatches=[];
 for(const p of selection.profiles)for(const pick of p.picks){
  const key=p.id+'/'+pick.seed,cells=Object.fromEntries(['A','B','C','D'].map(arm=>[arm,lookup.get(key+'/'+arm)]));assert(Object.values(cells).every(Boolean));
  const levels=Object.fromEntries(Object.entries(cells).map(([k,r])=>[k,r.endLevel]));
  if(levels.A!==oldMap.get(key))replayMismatches.push({id:p.id,seed:pick.seed,old:oldMap.get(key),replayed:levels.A});
  const e=lookup.get(key+'/E');
  pairs.push({id:p.id,seed:pick.seed,levels,previousFull:fullMap.get(key),effects:contrast(levels),reachedE2:contrast(Object.fromEntries(Object.entries(levels).map(([k,v])=>[k,Number(v>=2)]))),reachedE10:contrast(Object.fromEntries(Object.entries(levels).map(([k,v])=>[k,Number(v>=10)]))),firstDifferences:{B:firstDifference(cells.A,cells.B),C:firstDifference(cells.A,cells.C),D:firstDifference(cells.A,cells.D)},...(e?{dualDaggers:{endLevel:e.endLevel,delta:e.endLevel-levels.D,firstDifference:firstDifference(cells.D,e)}}:{})});
 }
 const arms=Object.fromEntries(['A','B','C','D','E'].map(arm=>[arm,summarize(rows.filter(r=>r.arm===arm))]));
 const effects=Object.fromEntries(['effects','reachedE2','reachedE10'].map(metric=>[metric,Object.fromEntries(['compat','identity','interaction'].map(k=>[k,round(mean(pairs,p=>p[metric][k]))]))]));
 const gate={errors:sum(rows,r=>r.errors.length),issues:sum(rows,r=>r.issues.length),compatViolations:sum(rows.filter(r=>ARMS[r.arm].compat),r=>r.invalid.length),nativeIllegal:sum(rows,r=>r.invalid.filter(x=>x.type==='native-loadout').length),replayMismatches:replayMismatches.length};
 const summary={arms,effects,gate,pairedAccounts:pairs.length,fullCandidateE10:baseline.results.length?Array.from(fullMap.values()).filter(v=>v>=10).length:null,replayMismatches};
 write('summary.json',{commit:shards[0].commit,native:shards[0].native,config:A.config,selection,baselineRun:45900893818,previousRun:45904782473,scope:'matched selected-seed diagnostic factorial; natural trajectories diverge; no representative win-rate estimate',summary,pairs});
 console.log('B12C3_OVERVIEW='+JSON.stringify(summary));
 for(const p of pairs)console.log('B12C3_PAIR='+JSON.stringify({id:p.id,seed:p.seed,levels:p.levels,previousFull:p.previousFull,effects:p.effects,firstDifferences:Object.fromEntries(Object.entries(p.firstDifferences).map(([k,v])=>[k,v?{level:v.level,attempt:v.attempt,kind:v.kind}:null])),...(p.dualDaggers?{dualDaggers:{endLevel:p.dualDaggers.endLevel,delta:p.dualDaggers.delta}}:{})}));
 if(Object.values(gate).some(n=>n>0))process.exitCode=1;
}
if(require.main===module){if(process.argv[2]==='aggregate')aggregate();else run(Number(process.argv[2]));}
module.exports={ARMS,profile,contrast,firstDifference,observe,trace,summarize};
