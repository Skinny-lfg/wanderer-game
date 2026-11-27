'use strict';
// B3.2D.8: earned checkpoints, actual owned alternatives and separate native
// same-tier/rarity reference hands. Read-only natural account; detached fights.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),AI=require('./v013-b32c-equipment-policy.cjs'),create=require('../tests/v012-economy-harness.cjs');
const BASE='04b28f2112e3af500120973ec870765721a20816',OUT='reports/b32d8',SEED=114300001,COUNT=8,LEVELS=[3,10],TWO=new Set(['Bow','Two-Handed','Staff']);
const IDS=['smart-blood-sword','smart-arcane-lightning-pure','smart-fury-daggers','smart-fury-bow','pure-aegis','smart-radiance-pure','smart-decay-cycle-daggers','smart-decay-cycle-wand','smart-arcane-arcane-pure','smart-arcane-fire-pure','arcane-frost','hybrid-decay-blood'];
const HANDS=[['Sword/Shield','Sword','Shield'],['Sword/Dagger','Sword','Daggers'],['Sword/None','Sword',null],['Mace/Shield','Mace','Shield'],['Daggers/Dagger','Daggers','Daggers'],['Two-Handed','Two-Handed',null],['Bow','Bow',null],['Wand/Tome','Wand','Tome'],['Wand/Orb','Wand','Orb'],['Wand/Charm','Wand','Charm'],['Staff','Staff',null]];
const SC=[{id:'solo',kind:'normal',size:1},{id:'small',kind:'normal',size:4},{id:'large',kind:'normal',size:12},{id:'elite-tank',kind:'elite',elite:'tank'},{id:'boss',kind:'boss'}];
const FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const clone=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),mean=(a,f)=>a.length?sum(a,f)/a.length:null,n=x=>Number(x)||0;
const offType=x=>x?.subtype==='Off-Hand Dagger'?'Daggers':x?.subtype||null;
const pkg=eq=>TWO.has(eq.weapon.subtype)?eq.weapon.subtype:eq.weapon.subtype+'/'+(offType(eq.offhand)==='Daggers'?'Dagger':offType(eq.offhand)||'None');
const itemKey=eq=>[eq.weapon?.id,eq.offhand?.id||null].join('|');
const strip=x=>{if(!x)return null;const {id,...rest}=x;return rest;};
function profile(id){return {...D.approvedProfile(id),offhandPolicy:'b23',equipmentIntelligence:'b32d7-combat-aware'};}
function legal(eq){const items=Object.values(eq).filter(Boolean);return !!eq.weapon&&eq.weapon.slot==='weapon'&&(!eq.offhand||eq.offhand.slot==='offhand')&&!(TWO.has(eq.weapon.subtype)&&eq.offhand)&&new Set(items.map(x=>x.id)).size===items.length&&items.filter(x=>x.rarity==='Legendary').length<=2;}
function score(a,p,eq,level){const value=AI.utility(a,p,eq,level);assert(Number.isFinite(value));return value;}
function ownedPackages(a,p,level){
 const current=a.state().equip,stash=a.state().stash,all=[...Object.values(current).filter(x=>x&&['weapon','offhand'].includes(x.slot)),...stash.filter(x=>x&&['weapon','offhand'].includes(x.slot))];
 const main=all.filter(x=>AI.targets(x).includes('weapon')&&x.subtype!=='Off-Hand Dagger'),off=all.filter(x=>AI.targets(x).includes('offhand'));
 const out=new Map(),capacity=a.storage.capacity(),occupied=a.storage.occupied();
 function add(eq){
  if(!legal(eq))return;
  const old=[current.weapon,current.offhand].filter(Boolean),next=[eq.weapon,eq.offhand].filter(Boolean);
  // Conservative final capacity condition; no claim that a particular
  // sequential equip order was executed or that an unavailable item is owned.
  const finalOccupied=occupied+old.filter(x=>!next.some(y=>y.id===x.id)).length-next.filter(x=>!old.some(y=>y.id===x.id)).length;
  if(finalOccupied>capacity||finalOccupied<0)return;
  const key=pkg(eq),value=score(a,p,eq,level),prev=out.get(key);
  if(!prev||value>prev.utility||value===prev.utility&&itemKey(eq)<itemKey(prev.eq))out.set(key,{eq,utility:value});
 }
 add(current);
 for(const weapon of main){
  const first=AI.projectGear(current,weapon,'weapon');if(!first)continue;
  if(TWO.has(weapon.subtype)){add(first);continue;}
  add({...first,offhand:null});
  for(const item of off){if(item.id===weapon.id)continue;const next=AI.projectGear(first,item,'offhand');if(next)add(next);}
 }
 return [...out.values()].map(({eq,utility})=>({origin:'owned',package:pkg(eq),weapon:clone(eq.weapon),offhand:eq.offhand?clone(eq.offhand):null,utility}));
}
function referencePackages(a,p,level,seed){
 // All rolls are in a completely separate native harness. Never grant them
 // to the earned account or modify its RNG. Reuse same rolled main/off item
 // across packages, so Sword/Shield, Sword/Dagger, Sword/None isolate offhand.
 const lab=create(seed,undefined,{}, {skipPersistence:true,now:1720000000000+seed});
 const rarity=level===3?'Uncommon':'Rare',current=a.state().equip,main=new Map(),off=new Map();
 for(const [,w,o] of HANDS){
  if(!main.has(w)){const item=lab.makeItem(level,'weapon',null,'loot',w,rarity);assert.equal(item.subtype,w);assert.equal(item.tier,level);assert.equal(item.rarity,rarity);main.set(w,item);}
  if(o&&!off.has(o)){const item=lab.makeItem(level,'offhand',null,'loot',o==='Daggers'?'Off-Hand Dagger':o,rarity);assert.equal(offType(item),o);assert.equal(item.tier,level);assert.equal(item.rarity,rarity);off.set(o,item);}
 }
 return HANDS.flatMap(([label,w,o])=>{
  const weapon=main.get(w),secondary=o?off.get(o):null,eq={...current,weapon,offhand:secondary};
  if(!legal(eq))return [];
  assert.equal(pkg(eq),label);
  return [{origin:'reference',package:label,weapon:clone(weapon),offhand:secondary?clone(secondary):null,utility:score(a,p,eq,level)}];
 });
}
function capture({a,level,attempt,seed,profile:p},id){
 if(!LEVELS.includes(level)||attempt!==1)return null;
 const s=a.state(),g=a.controller().state;
 assert.equal(g.unlocked,level);assert(a.talents.valid(s.automaticTalents));assert(legal(s.equip));
 const state=clone({level,unlocked:g.unlocked,equip:s.equip,automaticTalents:s.automaticTalents,runes:s.runes||[],runeSlots:s.runeSlots||[],ownedStash:s.stash});
 const before=hash(state),current={origin:'current',package:pkg(s.equip),weapon:clone(s.equip.weapon),offhand:s.equip.offhand?clone(s.equip.offhand):null,utility:score(a,p,s.equip,level)};
 const owned=ownedPackages(a,p,level),reference=referencePackages(a,p,level,seed+level*1009+830000);
 const after=hash({level,unlocked:g.unlocked,equip:s.equip,automaticTalents:s.automaticTalents,runes:s.runes||[],runeSlots:s.runeSlots||[],ownedStash:s.stash});
 assert.equal(after,before,'Capture changed account');
 assert(owned.some(x=>x.package===current.package&&x.utility>=current.utility-1e-8));assert.equal(reference.length,HANDS.length,'Reference coverage');
 return {id,seed,level,preferred:[...p.weapons],points:a.talents.earned(s.automaticTalents),spent:s.automaticTalents.nodes.length,state,before,current,owned,reference};
}
function collect(id,i,count=COUNT){
 const seed=SEED+i*131,p=profile(id),snapshots=[];
 const acc=N.simulateAccount(seed,id,{...N.DEFAULTS,...D.CONFIG,tickLimit:13000},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:probe=>{
  const cp=capture(probe,id);if(cp)snapshots.push(cp);return null;
 }});
 assert.equal(acc.startXp,0);assert(acc.initialGear.items.every(x=>x.startingGear));
 const audit=A.audit(id,[acc]),issues=[...audit.issues];for(const t of acc.attempts)issues.push(...D.compatibilityIssues(t,p));
 assert.deepEqual(acc.attempts.filter(x=>x.error).map(x=>({level:x.level,attempt:x.attempt,error:x.error,diagnostic:x.diagnostic})),[]);assert.deepEqual(audit.errors,[]);assert.deepEqual(issues,[]);
 for(const cp of snapshots){const first=acc.attempts.find(t=>t.level===cp.level&&t.attempt===1);assert(first?.before);assert.equal(first.before.xp,cp.state.automaticTalents.xp);assert.equal(first.before.earned,cp.points);assert.deepEqual(first.before.talentNodes,cp.state.automaticTalents.nodes);}
 assert.equal(new Set(snapshots.map(x=>x.level)).size,snapshots.length);
 return {id,seed,endLevel:acc.endLevel,clearedE10:acc.endLevel>=11,snapshots};
}
function cell(cp,h,sc,si){
 const st=cp.state,t=st.automaticTalents,families=t.nodes.filter(x=>x.startsWith('affinity_')).map(x=>x.slice(9));
 const build={id:cp.id,weapon:st.equip.weapon.subtype,families:families.length?families:['blood'],skills:[]};
 const seed=cp.seed+cp.level*100003+si*1009+1900000,family=FAMILIES[(Math.floor((cp.seed-SEED)/131)+si)%FAMILIES.length];
 const opts={mode:'encounter',points:cp.points,gear:'current',rarity:cp.level===3?'Uncommon':'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:t,earnedCheckpoint:st,stageB31EquipmentAudit:true,...(sc.elite?{stage619EliteType:sc.elite}:{}),...(h.origin==='current'?{}:{stageB32D8Hands:{origin:h.origin,weapon:h.weapon,offhand:h.offhand}})};
 const x=S.encounter(cp.level,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,cp.level);assert.equal(x.pointsSpent,cp.spent);assert.equal(x.talentXp,t.xp);assert.deepEqual(x.controlledTalentNodes,t.nodes);assert.equal(x.weaponType,h.weapon.subtype);assert.equal(offType({subtype:x.offhandType}),offType(h.offhand));
 assert.equal(x.affinity,family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.kind==='boss')assert.equal(x.bossAffinity,family);
 assert.equal(Number(x.won)+Number(x.died)+Number(x.timedOut),1);
 const eq=x.equipmentAudit,m=x.affinityMetrics||{};
 const nonhands=hash(Object.keys(eq).sort().filter(k=>!['weapon','offhand'].includes(k)).map(k=>[k,strip(eq[k])]));
 const expected=hash(Object.keys(st.equip).sort().filter(k=>!['weapon','offhand'].includes(k)).map(k=>[k,strip(st.equip[k])]));
 assert.equal(nonhands,expected);assert.deepEqual(strip(eq.weapon),strip(h.weapon));assert.deepEqual(strip(eq.offhand),strip(h.offhand));
 const scenarioHash=hash([x.resolvedSeed,x.affinity,x.risk,x.roster,x.initialRoles,x.traitId,x.conditionId,x.conditionMarked,x.bossModifierIds,x.eliteType,x.bossId]);
 return {origin:h.origin,package:h.package,utility:h.utility,weaponId:h.weapon.id,offhandId:h.offhand?.id||null,weaponRarity:h.weapon.rarity,weaponTier:h.weapon.tier,offhandRarity:h.offhand?.rarity||null,offhandTier:h.offhand?.tier||null,weaponBudget:h.weapon.v013Budget,offhandBudget:h.offhand?.v013Budget||0,scenario:sc.id,kind:sc.kind,seed,scenarioHash,nonhands,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,dot:m.dotDamageActual,taken:x.damageTaken,healed:m.healingActual,absorbed:x.absorbed,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds,infusion:x.infusionDamage,stats:x.heroBaseStats,activations:m.passiveActivations,defense:m.defensiveAudit,offhandProcs:m.offhandProcs,weaponStatus:x.weaponStatusMetrics,decay:x.decayTalentMetrics,magic:x.magicAdaptiveMetrics};
}
function studyAccount(id,i){
 const acc=collect(id,i),results=[];
 for(const cp of acc.snapshots){
  const rows=[];
  for(const [si,sc] of SC.entries()){
   const rs=[cp.current,...cp.owned,...cp.reference].map(h=>cell(cp,h,sc,si));
   assert.equal(new Set(rs.map(r=>r.nonhands)).size,1);assert.equal(new Set(rs.map(r=>r.scenarioHash)).size,1,'Encounter mismatch');
   rows.push(...rs);
  }
  results.push({...cp,rows});
 }
 return {...acc,snapshots:results};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x));}
function run(pi){const id=IDS[pi];assert(id);const accounts=Array.from({length:COUNT},(_,i)=>studyAccount(id,i));write('study-'+pi,{pi,id,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,accounts});console.log('B32D8_SHARD='+JSON.stringify({id,accounts:accounts.length,checkpoints:sum(accounts,a=>a.snapshots.length),fights:sum(accounts,a=>sum(a.snapshots,c=>c.rows.length))}));}
function stats(rows){
 const wins=rows.filter(r=>r.won),mana=rows.filter(r=>r.mpMax>0),funded=sum(rows,r=>n(r.funded)),unfunded=sum(rows,r=>n(r.unfunded));
 return {n:rows.length,wins:wins.length,winPct:rows.length?100*wins.length/rows.length:null,timeouts:rows.filter(r=>r.timeout).length,utility:mean(rows,r=>r.utility),winSeconds:mean(wins,r=>r.seconds),dps:mean(rows,r=>r.seconds?r.damage/r.seconds:0),aoeDps:mean(rows,r=>r.seconds?n(r.secondary)/r.seconds:0),dotDps:mean(rows,r=>r.seconds?n(r.dot)/r.seconds:0),hpEndPct:mean(rows,r=>100*r.hpEnd/Math.max(1,r.hpMax)),manaEndPct:mean(mana,r=>100*r.mpEnd/r.mpMax),funded,unfunded,paidFraction:funded+unfunded?funded/(funded+unfunded):null,parries:sum(rows,r=>n(r.defense?.parries)),blocks:sum(rows,r=>n(r.defense?.shield)),healed:mean(rows,r=>n(r.healed)),absorbed:mean(rows,r=>n(r.absorbed))};
}
function pairs(a,b){const key=r=>r.cpKey+'/'+r.scenario,map=new Map(b.map(r=>[key(r),r])),matched=a.flatMap(x=>map.has(key(x))?[[x,map.get(key(x))]]:[]);let aOnly=0,bOnly=0,unresolved=0,correct=0,incorrect=0;for(const [x,y] of matched){if(x.timeout||y.timeout){unresolved++;continue;}if(x.won===y.won)continue;if(x.won)aOnly++;else bOnly++;if(x.utility===y.utility)continue;if((x.utility>y.utility)===x.won)correct++;else incorrect++;}return {n:matched.length,aOnly,bOnly,unresolved,correct,incorrect,bothWinTimeDelta:mean(matched.filter(([x,y])=>x.won&&y.won),([x,y])=>x.seconds-y.seconds)};}
function summarize(cps){
 const rows=cps.flatMap(c=>c.rows.map(r=>({...r,cpKey:c.id+'/'+c.seed+'/'+c.level,preferred:c.preferred})));
 const current=rows.filter(r=>r.origin==='current'),owned=rows.filter(r=>r.origin==='owned'),reference=rows.filter(r=>r.origin==='reference');
 const preferred=(r)=>r.preferred.includes(r.package.split('/')[0]);
 const group=(a)=>Object.fromEntries([...new Set(a.map(r=>r.package))].sort().map(k=>[k,stats(a.filter(r=>r.package===k))]));
 const selected=[],avail=[];
 for(const cp of cps){
  const best=[...cp.owned].sort((a,b)=>b.utility-a.utility||a.package.localeCompare(b.package))[0],ref=[...cp.reference].sort((a,b)=>b.utility-a.utility||a.package.localeCompare(b.package))[0];
  const id=cp.id+'/'+cp.seed+'/'+cp.level,rs=rows.filter(r=>r.cpKey===id);
  selected.push(...rs.filter(r=>r.origin==='owned'&&r.package===best.package),...rs.filter(r=>r.origin==='reference'&&r.package===ref.package));
  avail.push({id:cp.id,seed:cp.seed,level:cp.level,current:cp.current.package,ownedBest:best.package,referenceBest:ref.package,preferred:cp.preferred,preferredOwned:cp.owned.some(h=>cp.preferred.includes(h.weapon.subtype)),ownedPackages:cp.owned.map(h=>h.package)});
 }
 const chosenOwned=selected.filter(r=>r.origin==='owned'),chosenRef=selected.filter(r=>r.origin==='reference');
 const referencePairs=[];for(let i=0;i<HANDS.length;i++)for(let j=i+1;j<HANDS.length;j++){const a=HANDS[i][0],b=HANDS[j][0];referencePairs.push({a,b,...pairs(reference.filter(r=>r.package===a),reference.filter(r=>r.package===b))});}
 return {checkpoints:cps.length,fights:rows.length,timeouts:rows.filter(r=>r.timeout).length,preferredOwned:avail.filter(x=>x.preferredOwned).length,currentPreferred:cps.filter(c=>c.preferred.includes(c.current.weapon.subtype)).length,ownedSelectedPreferred:chosenOwned.filter(preferred).length/SC.length,referenceSelectedPreferred:chosenRef.filter(preferred).length/SC.length,current:stats(current),ownedSelected:stats(chosenOwned),referenceSelected:stats(chosenRef),currentVsOwned:pairs(current,chosenOwned),ownedPackages:group(owned),referencePackages:group(reference),referenceByScenario:Object.fromEntries(SC.map(sc=>[sc.id,group(reference.filter(r=>r.scenario===sc.id))])),referencePairs,referenceSelection:group(chosenRef),ownedSelection:group(chosenOwned),availability:avail};
}
function aggregate(){
 const xs=IDS.map((id,pi)=>JSON.parse(fs.readFileSync(OUT+'/study-'+pi+'.json','utf8')));assert.equal(new Set(xs.map(x=>x.native)).size,1);
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.accounts.length,COUNT);}
 const accounts=xs.flatMap(x=>x.accounts),cps=accounts.flatMap(a=>a.snapshots);assert.equal(new Set(cps.map(c=>c.id+'/'+c.seed+'/'+c.level)).size,cps.length);
 const profiles=xs.flatMap(x=>LEVELS.map(level=>({id:x.id,level,accounts:x.accounts.length,...summarize(x.accounts.flatMap(a=>a.snapshots).filter(c=>c.level===level))})));
 const levels=LEVELS.map(level=>({level,...summarize(cps.filter(c=>c.level===level))}));
 const report={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,accounts:accounts.length,reachedE10:accounts.filter(a=>a.endLevel>=10).length,clearedE10:accounts.filter(a=>a.clearedE10).length,checkpoints:cps.length,fights:sum(cps,c=>c.rows.length),levels,profiles,scope:'Conditional on natural reach. Current and best visible owned package per subtype by unchanged Combat-Aware score. Reference hands independently rolled at same E/rarity, not earned, with same actual nonhand equipment, talents and runes. One roll per checkpoint, not equal realized affixes or total hand budget. Native staged fights with full HP/MP, no natural preparation; five equally weighted scenarios. No causal claim for standalone main weapon across different offhands. Eight independent starting cohorts per profile, repeated encounters correlated.'};
 write('summary',report);
 for(const x of profiles)console.log('B32D8_PROFILE='+JSON.stringify({id:x.id,level:x.level,checkpoints:x.checkpoints,fights:x.fights,timeouts:x.timeouts,preferredOwned:x.preferredOwned,currentPreferred:x.currentPreferred,ownedSelectedPreferred:x.ownedSelectedPreferred,referenceSelectedPreferred:x.referenceSelectedPreferred,current:x.current,ownedSelected:x.ownedSelected,currentVsOwned:x.currentVsOwned,referencePackages:x.referencePackages,referenceSelection:x.referenceSelection}));
 console.log('B32D8_OVERVIEW='+JSON.stringify({...report,profiles:undefined,levels:levels.map(({referencePairs,referenceByScenario,availability,...l})=>l)}));
 if(levels.some(l=>l.timeouts))console.log('::warning::Native controlled timeouts are unresolved, not hidden or reclassified as deaths.');
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-b32d7-combat-aware-policy.cjs','scripts/v013-natural-progression.cjs'],{encoding:'utf8'}).trim(),'');
 // Native generated fixture only for quick structural smoke; actual study
 // exclusively calls capture after progression from E1.
 const id=IDS[0],p=profile(id),a=create(SEED,undefined,{}, {skipPersistence:true,now:1720000000000+SEED});a.setup(3,'Sword','Uncommon');a.setUnlocked(3);
 const cp=capture({a,level:3,attempt:1,seed:SEED,profile:p},id);assert(cp);const rs=[cp.current,...cp.owned,...cp.reference].map(h=>cell(cp,h,SC[0],0));assert.equal(new Set(rs.map(r=>r.scenarioHash)).size,1);assert.equal(new Set(rs.map(r=>r.nonhands)).size,1);
 console.log('B32D8_SMOKE='+JSON.stringify({packages:cp.reference.length,owned:cp.owned.length,matched:true,policyDrift:false}));
}
const [cmd,pi]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(pi));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
