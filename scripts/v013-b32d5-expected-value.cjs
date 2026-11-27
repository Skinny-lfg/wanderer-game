'use strict';
// B3.2C pilot: actual earned accounts, matched starting seeds and same native economy.
// Only hand equipment choice policy changes. Outcomes may change future earned inventory.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),AI=require('./v013-b32c-equipment-policy.cjs'),create=require('../tests/v012-economy-harness.cjs');
const TRANSITION=require('./v013-b32d2-transition-policy.cjs');
const ACQUISITION=require('./v013-b32d3-acquisition-policy.cjs');
const EV=require('./v013-b32d5-forge-ev.cjs');
const BASE='ad968534a9a5bdd16c2d025c4e59892681785497',OUT='reports/b32d5',SEED=107500001,COUNT=8;
const IDS=['smart-blood-sword','smart-arcane-lightning-pure','smart-fury-daggers','smart-fury-bow','pure-aegis','smart-radiance-pure','smart-decay-cycle-daggers','smart-decay-cycle-wand','smart-arcane-arcane-pure','smart-arcane-fire-pure','arcane-frost','hybrid-decay-blood'];
const arms=['transition','ev'],TWO=new Set(['Bow','Two-Handed','Staff']),mean=(a,f)=>a.length?a.reduce((n,x)=>n+f(x),0)/a.length:null,sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),clone=x=>JSON.parse(JSON.stringify(x));
function profile(id,arm,trace){return {...D.approvedProfile(id),offhandPolicy:'b23',equipmentTrace:trace,...(arm==='adaptiveSoft'?{equipmentIntelligence:'b32c-soft'}:arm==='stable'?{equipmentIntelligence:'b32c1-stable'}:arm==='full'?{equipmentIntelligence:'b32d-full'}:arm==='transition'?{equipmentIntelligence:'b32d2-transition'}:arm==='ev'?{equipmentIntelligence:'b32d5-ev'}:arm==='risk'?{equipmentIntelligence:'b32d3-risk'}:arm==='strategic'?{equipmentIntelligence:'b32d3-strategic'}:{})};}
function snapshot(a){const s=a.state();return JSON.stringify({equip:s.equip,stash:s.stash,overflow:s.expeditionOverflow,t:s.automaticTalents,gold:s.gold,fragments:s.fragments,crafting:s.crafting,runes:s.runes,runeSlots:s.runeSlots});}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy','scripts/v013-build-planner.cjs'],{encoding:'utf8'}).trim(),'');
 for(const [j,id] of IDS.entries()){
  const a=create(SEED+j,undefined,{}, {skipPersistence:true}),p=profile(id,'adaptiveSoft',()=>{});a.setup(5,'Sword','Rare');
  const item=a.makeItem(5,'weapon',null,'loot','Two-Handed','Rare'),off=a.makeItem(5,'offhand',null,'loot','Off-Hand Dagger','Rare'),before=snapshot(a);
  const x=AI.gain(a,p,item,'weapon');assert(Number.isFinite(x));assert.equal(AI.gain(a,p,item,'weapon'),x);assert.equal(snapshot(a),before,'Projection mutated native state');
  assert.equal(AI.projected(a.state().equip,item,'weapon').offhand,null);assert.equal(AI.projected(a.state().equip,off,'offhand').offhand.subtype,'Daggers');
  assert.equal(AI.projected({...a.state().equip,weapon:item},off,'offhand'),null);
  assert.equal(AI.gain(a,profile(id,'H23'),item,'weapon'),null);
  const st=profile(id,'stable'),eq=a.state().equip,pr=AI.projected(eq,item,'weapon'),forward=AI.stableGain(a,st,eq,pr),reverse=AI.stableGain(a,st,pr,eq);assert(Math.abs(forward+reverse)<1e-9);assert.equal(snapshot(a),before);
  const leg={...item,rarity:'Legendary'},legEq=AI.projected(eq,leg,'weapon');assert(Number.isFinite(AI.gain(a,st,leg,'weapon')));assert(Math.abs(AI.stableGain(a,st,eq,legEq)+AI.stableGain(a,st,legEq,eq))<1e-9);
  for(const plan of AI.plans(a,st,[item,off],false)){assert.equal(plan.steps.length<=2,true);assert(Math.abs(plan.scoreAfter-plan.scoreBefore-plan.gain)<1e-9);}
  const full=profile(id,'full'),armor=a.makeItem(5,'armor',null,'loot','Cloth','Rare'),ring=a.makeItem(5,'ring1',null,'loot',null,'Rare'),saved=snapshot(a);
  for(const [it,slot] of [[armor,'armor'],[ring,'ring1'],[ring,'ring2']]){const next=AI.projectGear(eq,it,slot);assert(next);const g=AI.gain(a,full,it,slot);assert(Number.isFinite(g));assert(Math.abs(g+AI.stableGain(a,full,next,eq))<1e-9);}
  assert.deepEqual(AI.gearTargets(ring),['ring1','ring2']);assert.equal(snapshot(a),saved);
  const t=profile(id,'transition',()=>{}),original=a.state().stash;
  a.state().stash=[...original,item,armor,off];const prior=snapshot(a),r=TRANSITION.search(a,t);
  assert.equal(snapshot(a),prior,'Transition search mutated state');if(r?.best){assert(t.weapons.includes(r.best.next.weapon.subtype));assert(r.best.steps.every(x=>a.state().stash.some(y=>y.id===x.item.id)));assert(Math.abs(r.best.gain-(AI.utility(a,t,r.best.next,Math.max(1,a.controller().state.unlocked||1))-r.baseline))<1e-6);}
  a.state().stash=original;
  const sp=profile(id,'strategic',()=>{}),c=ACQUISITION.context(a,sp),savedAcq=snapshot(a),raw=AI.gain(a,sp,ring,'ring1'),v=ACQUISITION.value(a,sp,ring,'ring1',raw,c,'forge');assert.equal(v.raw,raw);assert.equal(v.penalty,2);assert.equal(snapshot(a),savedAcq);ACQUISITION.learn(a,ring,'ring1',10,0);assert(ACQUISITION.penalty(a,ring,'ring1')>2);assert.equal(snapshot(a),savedAcq);
 }
 const a=create(SEED,undefined,{}, {skipPersistence:true}),p=profile(IDS[0],'ev',()=>{});a.setup(5,'Sword','Rare');
 const r=a.forge.recipes.find(x=>x.slot==='ring1'&&x.rarity==='Rare'),before=snapshot(a);
 const es=EV.samples(r,5,null);assert.equal(es.length,EV.N);assert.equal(es,EV.samples(r,5,null));
 const f=EV.forecast(a,p,r,5,null,()=>true);assert(f&&f.pUpgrade>=0&&f.pUpgrade<=1&&f.gain>=0&&f.samples===EV.N);assert.deepEqual(f,EV.forecast(a,p,r,5,null,()=>true));assert.equal(snapshot(a),before);
 const m=EV.statistics([{slot:'ring1',gain:4,upgrade:true},{slot:'ring2',gain:-2,upgrade:false}]);assert.equal(m.pUpgrade,.5);assert.equal(m.meanGain,1);assert.equal(m.gain,2);assert.equal(m.expectedAttempts,2);
 const z=EV.statistics([{slot:'ring1',gain:-2,upgrade:false}]);assert.equal(z.gain,0);assert.equal(z.expectedAttempts,null);
 assert.equal(AI.transition(p),true);assert.equal(EV.enabled(profile(IDS[0],'transition')),false);
 console.log('B32D5_SMOKE='+JSON.stringify({profiles:IDS.length,productionDrift:false,readOnlyProjection:true,compatibility:true}));
}
function account(id,arm,i,config=D.CONFIG,seedOverride=null){
 const seed=seedOverride??SEED+i*131,events=[],p=profile(id,arm,e=>events.push(e));
 const acc=N.simulateAccount(seed,id,{...N.DEFAULTS,...config,tickLimit:13000},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a})=>({legal:a.talents.valid(a.state().automaticTalents),stats:a.baseStats()})});
 const audit=A.audit(id,[acc]),issues=[...audit.issues];for(const t of acc.attempts)issues.push(...D.compatibilityIssues(t,p));
 const failures=acc.attempts.filter(x=>x.error).map(x=>({level:x.level,attempt:x.attempt,error:x.error,diagnostic:x.diagnostic}));
 assert.deepEqual(failures,[],'Native attempt failures '+id+'/'+arm+'/'+seed);assert.deepEqual(audit.errors,[]);assert.deepEqual(issues,[],'Native integrity issues '+id+'/'+arm+'/'+seed);
 const rs=acc.attempts.flatMap(t=>t.rooms||[]),crafts=acc.attempts.flatMap(t=>t.camp?.crafted||[]),buys=acc.attempts.flatMap(t=>t.camp?.bought||[]),equips=acc.attempts.flatMap(t=>[...(t.camp?.equipped||[]),...(t.equipped||[])]);
 const picked=events.filter(e=>['equip','buy','craft'].includes(e.kind)),offers=events.filter(e=>['offer','opportunities'].includes(e.kind));
 for(const e of picked){assert(Number.isFinite(e.gain));if(e.kind==='equip')assert(e.gain>=2.5);else if(e.kind==='buy')assert(e.gain>5);else assert(e.gain>=(arm==='ev'?1:5));}
 const rejected=picked.filter(e=>e.kind==='equip'&&!e.accepted).length;
 const plans=events.filter(e=>e.kind==='plan');
 const badPlans=plans.filter(e=>!e.projectionMatch||e.actualGain+1e-6<e.minimum);
 const nonhands=events.filter(e=>e.kind==='nonhandEquip'),attrs=events.filter(e=>e.kind==='attribute');
 const badNonhands=nonhands.filter(e=>e.accepted&&(!e.projectionMatch||e.actualGain+1e-6<2.5)).length,badAttributes=attrs.filter(e=>!e.projectionMatch).length;
 const hands=events.filter(e=>e.kind==='equip'&&e.accepted&&e.slot==='weapon');let repeated=0;for(let j=2;j<hands.length;j++)if(hands[j].id===hands[j-2].id)repeated++;
 const candidates=events.filter(e=>e.kind==='candidate'),transitions=events.filter(e=>e.kind==='transitionPlan'),reservedLost=events.filter(e=>e.kind==='pressureSalvage').reduce((n,e)=>n+e.reservedLost.length,0);
 const camps=events.filter(e=>e.kind==='afterCamp'),preferredCamps=camps.filter(e=>e.preferredWeapons.includes(e.weapon)),finalPreferred=p.weapons.includes(acc.finalGear.items.find(x=>x.slot==='weapon')?.subtype);
 const progression=Object.fromEntries([...new Set(camps.map(e=>e.level))].map(l=>{const es=camps.filter(e=>e.level===l),last=es.at(-1);return [l,{n:es.length,preferred:es.filter(e=>e.preferredWeapons.includes(e.weapon)).length,weapon:last.weapon,offhand:last.offhand,armor:counts(last.armor,x=>x.armorType||'Unknown'),mana:last.stats.mana,SP:last.stats.spellPower,AP:last.stats.attack}];}));
 const forecasts=events.filter(e=>e.kind==='forecast'),purchases=events.filter(e=>e.kind==='buy'||e.kind==='craft'),observedIds=new Set(camps.flatMap(e=>e.equippedIds||[]));for(const e of events)if(['equip','nonhandEquip','transitionEquip'].includes(e.kind)&&(e.accepted||e.kind==='transitionEquip'))observedIds.add(e.id);
 const usedPurchases=purchases.filter(e=>e.equipped||observedIds.has(e.id));
 const manaRooms=rs.filter(r=>r.mpMax>0),unfunded=sum(manaRooms,r=>Number(r.unfundedCasterAttacks)||0),funded=sum(manaRooms,r=>Number(r.fundedCasts)||0);
 const early=events.filter(e=>e.kind==='afterCamp'&&e.level===1).slice(0,4).map(e=>({weapon:e.weapon,offhand:e.offhand,hands:e.hands,nodes:e.nodes,stats:{attack:e.stats.attack,spellPower:e.stats.spellPower,mana:e.stats.mana,manaRegen:e.stats.manaRegen,defense:e.stats.defense,maxhp:e.stats.maxhp},crafts:e.crafts,buys:e.buys}));
 return {id,arm,seed,endLevel:acc.endLevel,reachedE10:acc.endLevel>=10,clearedE10:acc.endLevel>=11,xp:acc.xp,attempts:acc.attempts.length,stopReason:acc.stopReason,initialGear:acc.initialGear,finalGear:acc.finalGear,gold:acc.gold,fragments:acc.fragments,crafts,buys,equips,events,usedCrafts:usedPurchases.filter(e=>e.kind==='craft').length,usedBuys:usedPurchases.filter(e=>e.kind==='buy').length,forecastCrafts:forecasts.filter(e=>e.source==='forge').length,forecastErrors:forecasts.filter(e=>e.source==='forge'&&Number.isFinite(e.actual)).map(e=>e.predicted-e.actual),strategicBuys:forecasts.filter(e=>e.source==='merchant'&&e.strategicGain>0&&e.decisionGain>e.predicted).length,strategicCrafts:forecasts.filter(e=>e.source==='forge'&&e.strategicGain>0&&e.decisionGain>e.predicted-e.penalty).length,finalPreferred,preferredCamps:preferredCamps.length,camps:camps.length,firstPreferredLevel:preferredCamps[0]?.level??null,progression,transitionPlans:transitions.length,badTransitions:transitions.filter(e=>!e.projectionMatch||e.actualGain+1e-6<e.minimum).length,transitionCandidates:candidates.length,blockedCandidates:candidates.filter(e=>e.to&&e.steps.length&&e.gain<e.minimum).length,transitionMulti:transitions.filter(e=>e.steps>1).length,reservedLost,manaRooms:manaRooms.length,manaEndSum:sum(manaRooms,r=>100*r.mpEnd/r.mpMax),funded,unfunded,nonhandEquips:nonhands.filter(e=>e.accepted).length,badNonhands,badAttributes,attributes:attrs.map(e=>e.key),plans:plans.length,badPlans:badPlans.length,pairPlans:plans.filter(e=>e.steps===2).length,repeated,early,decisions:picked.length,offers:offers.length,rejected,fights:rs.length,wins:rs.filter(r=>r.won).length,losses:rs.filter(r=>r.died).length,surrenders:rs.filter(r=>r.surrendered).length,timeouts:rs.filter(r=>r.timedOut).length,errors:failures.length,issues:issues.length,coverage:audit.coverage.all};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function run(pi,ai){const id=IDS[pi],arm=arms[ai];assert(id&&arm);const rows=Array.from({length:COUNT},(_,i)=>account(id,arm,i));write('pilot-'+pi+'-'+ai,{pi,ai,id,arm,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,rows});}
const counts=(a,key)=>a.reduce((s,x)=>{const k=key(x);if(k!=null)s[k]=(s[k]||0)+1;return s},{});
function metrics(rows){
 const crafts=rows.flatMap(r=>r.crafts),buys=rows.flatMap(r=>r.buys),events=rows.flatMap(r=>r.events),fights=sum(rows,r=>r.fights);
 return {accounts:rows.length,reachedE10:sum(rows,r=>Number(r.reachedE10)),clearedE10:sum(rows,r=>Number(r.clearedE10)),meanEndLevel:mean(rows,r=>r.endLevel),meanXp:mean(rows,r=>r.xp),attempts:sum(rows,r=>r.attempts),fights,wins:sum(rows,r=>r.wins),winPct:fights?100*sum(rows,r=>r.wins)/fights:null,surrenders:sum(rows,r=>r.surrenders),timeouts:sum(rows,r=>r.timeouts),errors:sum(rows,r=>r.errors),issues:sum(rows,r=>r.issues),purchases:buys.length,goldSpent:sum(buys,x=>x.cost||0),crafts:crafts.length,fragmentsSpent:sum(crafts,x=>x.fragmentsSpent||0),essenceSpent:sum(crafts,x=>x.essenceSpent||0),craftEquipped:crafts.filter(x=>x.equipped).length,observedUsedCrafts:sum(rows,r=>r.usedCrafts),observedUsedBuys:sum(rows,r=>r.usedBuys),forecastCrafts:sum(rows,r=>r.forecastCrafts),forecastMeanError:mean(rows.flatMap(r=>r.forecastErrors),x=>x),forecastMAE:mean(rows.flatMap(r=>r.forecastErrors),x=>Math.abs(x)),strategicBuys:sum(rows,r=>r.strategicBuys),strategicCrafts:sum(rows,r=>r.strategicCrafts),craftPreviewMiss:events.filter(e=>e.kind==='craft'&&!(e.actualGain>=2.5)).length,decisions:sum(rows,r=>r.decisions),opportunities:sum(rows,r=>r.offers),rejected:sum(rows,r=>r.rejected),finalPreferred:sum(rows,r=>Number(r.finalPreferred)),preferredCamps:sum(rows,r=>r.preferredCamps),camps:sum(rows,r=>r.camps),firstPreferredLevel:mean(rows.filter(r=>r.firstPreferredLevel!=null),r=>r.firstPreferredLevel),neverPreferred:rows.filter(r=>r.firstPreferredLevel==null).length,transitionPlans:sum(rows,r=>r.transitionPlans),badTransitions:sum(rows,r=>r.badTransitions),transitionMulti:sum(rows,r=>r.transitionMulti),transitionCandidates:sum(rows,r=>r.transitionCandidates),blockedCandidates:sum(rows,r=>r.blockedCandidates),reservedLost:sum(rows,r=>r.reservedLost),manaRooms:sum(rows,r=>r.manaRooms),manaEndPct:sum(rows,r=>r.manaRooms)?sum(rows,r=>r.manaEndSum)/sum(rows,r=>r.manaRooms):null,funded:sum(rows,r=>r.funded),unfunded:sum(rows,r=>r.unfunded),byLevel:Object.fromEntries(Array.from({length:10},(_,i)=>{const level=i+1,es=rows.map(r=>r.progression[level]).filter(Boolean);return [level,{accounts:es.length,preferredAccounts:es.filter(e=>e.preferred>0).length,lastWeapons:counts(es,e=>e.weapon),armor:Object.fromEntries(['Cloth','Leather','Plate'].map(k=>[k,sum(es,e=>e.armor[k]||0)]))}];})),nonhandEquips:sum(rows,r=>r.nonhandEquips),badNonhands:sum(rows,r=>r.badNonhands),badAttributes:sum(rows,r=>r.badAttributes),attributes:counts(rows.flatMap(r=>r.attributes),x=>x),armor:counts(rows.flatMap(r=>r.finalGear.items.filter(i=>['helm','armor','gloves','boots','belt'].includes(i.slot))),i=>i.armorType||'Unknown'),armorBySlot:counts(rows.flatMap(r=>r.finalGear.items.filter(i=>['helm','armor','gloves','boots','belt'].includes(i.slot))),i=>i.slot+':'+(i.armorType||'Unknown')),investmentSlots:counts([...crafts,...buys],i=>i.slot),plans:sum(rows,r=>r.plans),badPlans:sum(rows,r=>r.badPlans),pairPlans:sum(rows,r=>r.pairPlans),repeated:sum(rows,r=>r.repeated),finalWeapons:counts(rows,r=>r.finalGear.items.find(x=>x.slot==='weapon')?.subtype),finalOffhands:counts(rows,r=>r.finalGear.items.find(x=>x.slot==='offhand')?.subtype||'None'),acceptedHandEquip:counts(events.filter(e=>e.kind==='equip'&&e.accepted),e=>e.subtype),forgeOffers:events.filter(e=>e.phase==='forge'&&e.kind==='offer').length,merchantOffers:events.filter(e=>e.phase==='merchant'&&e.kind==='offer').length};
}
function evMetrics(rows){
 const es=rows.flatMap(r=>r.events.filter(e=>e.kind==='evForecast')),offers=rows.flatMap(r=>r.events.filter(e=>e.phase==='forge'&&e.kind==='offer'&&Number.isFinite(e.pUpgrade)));
 const buckets=Object.fromEntries([0,.25,.5,.75,1].map((lo,i)=>{const a=es.filter(e=>i===4?e.pUpgrade===1:e.pUpgrade>=lo&&e.pUpgrade<lo+.25);return [lo,{n:a.length,predicted:mean(a,e=>e.pUpgrade),actual:mean(a,e=>Number(e.upgrade)),brier:mean(a,e=>(e.pUpgrade-Number(e.upgrade))**2)}];}));
 return {forecasts:es.length,offers:offers.length,eligibleOffers:offers.filter(e=>e.eligible).length,upgradeRate:mean(es,e=>Number(e.upgrade)),meanPredictedProbability:mean(es,e=>e.pUpgrade),meanThresholdEV:mean(es,e=>e.thresholdEV),meanActualGain:mean(es,e=>e.actualGain),meanForecastError:mean(es,e=>e.meanGain-e.actualGain),meanAbsoluteError:mean(es,e=>Math.abs(e.meanGain-e.actualGain)),brier:mean(es,e=>(e.pUpgrade-Number(e.upgrade))**2),buckets,selectedSlots:counts(es,e=>e.slot),influenced:es.filter(e=>e.influence).length};
}
function paired(h,s){
 const ds=s.map((r,i)=>Number(r.clearedE10)-Number(h[i].clearedE10));return {n:ds.length,clearDelta:sum(ds,x=>x),candidateOnly:ds.filter(x=>x===1).length,controlOnly:ds.filter(x=>x===-1).length,meanEndLevelDelta:mean(s,(r)=>r.endLevel)-mean(h,r=>r.endLevel)};
}
function aggregate(){
 const xs=IDS.flatMap((id,pi)=>arms.map((arm,ai)=>JSON.parse(fs.readFileSync(OUT+'/pilot-'+pi+'-'+ai+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[],controls=[],candidates=[];
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.rows.length,COUNT);}
 for(let pi=0;pi<IDS.length;pi++){
  const h=xs.find(x=>x.pi===pi&&x.ai===0).rows,s=xs.find(x=>x.pi===pi&&x.ai===1).rows;
  for(let i=0;i<COUNT;i++){assert.equal(h[i].seed,s[i].seed);assert.deepEqual(h[i].initialGear,s[i].initialGear);}
  controls.push(...h);candidates.push(...s);
  const r={id:IDS[pi],transition:metrics(h),ev:metrics(s),forecast:evMetrics(s),paired:paired(h,s)};results.push(r);console.log('B32D5_PROFILE='+JSON.stringify(r));
 }
 const rows=[...controls,...candidates],summary={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,accounts:rows.length,matchedSeedGroups:controls.length,arms:{transition:metrics(controls),ev:metrics(candidates)},forecast:evMetrics(candidates),paired:paired(controls,candidates),results,scope:'Exploratory eight matched natural accounts per profile, 32 independent native Forge samples per recipe/tier/influence, actual current equipment and talents, unchanged runtime, resources and acquisition eligibility. No balance or approval claim.'};
 assert.equal(rows.length,192);write('summary',summary);console.log('B32D5_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(rows.some(r=>r.timeouts||r.errors||r.issues||r.badPlans||r.badNonhands||r.badAttributes||r.badTransitions))process.exitCode=1;
}
const [cmd,pi,ai]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='pilot')run(Number(pi),Number(ai));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
