'use strict';
// B1: current consolidated native baseline. No historical VM overrides or injected natural resources.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),N=require('./v013-natural-progression.cjs'),B=require('./v013-build-planner.cjs'),G=require('./v013-global-e10.cjs');
const Balance=require('./v013-balance-criteria.cjs');
const T=globalThis.WandererAutomaticTalents,P=globalThis.WandererV012Consumables,C=globalThis.WandererV013Crafting;
const graph=new Map(T.NODES.map(n=>[n.id,n])),F=['blood','decay','radiance','aegis','fury','arcane'];
const E10=10,N_PER=50,POINTS=30,OUT='reports/b1-e10';
const CONTROL_PURE=['blood-daggers','blood-sword','blood-twohand','fury-daggers','fury-bow','radiance-sword','radiance-wand','aegis-sword','aegis-mace','aegis-orb','decay-cycle-daggers','decay-cycle-twohand','decay-cycle-wand','decay-cycle-staff','decay-focus-wand','decay-overflow-wand','arcane-arcane-wand','arcane-fire-wand','arcane-fire-staff','arcane-frost-staff','arcane-lightning-wand','arcane-lightning-staff'];
G.P['decay-overflow-wand']={id:'decay-overflow-wand',families:['decay'],w:'wand',skills:['blightburst','contagious_touch','corruption_nova','soul_drain'],role:'aoe'};
const NON_ADJ=[['blood-aegis','blood','aegis','sword',['blood_drinker','guarded_block','barrier_pulse']],['blood-radiance','blood','radiance','daggers',['blood_harvest','renewal']],['blood-arcane','blood','arcane','wand',['deep_cuts','arcane_focus'],'arcane'],['decay-aegis','decay','aegis','mace',['contagious_touch','guarded_block']],['decay-radiance','decay','radiance','wand',['soul_drain','renewal']],['decay-fury','decay','fury','bow',['contagious_touch','quick_hands']],['fury-aegis','fury','aegis','mace',['brutal_crit','guarded_block']],['fury-arcane','fury','arcane','staff',['precision','arcane_focus'],'arcane'],['radiance-arcane','radiance','arcane','orb',['life_bloom','arcane_focus'],'arcane']];
for(const [id,a,b,w,skills,element] of NON_ADJ)G.P['mix-'+id]={id:'mix-'+id,families:[a,b],w,skills,role:'mixed',element};
const CONTROL=[...CONTROL_PURE,...G.IDS.filter(id=>id.startsWith('hybrid-')),...NON_ADJ.map(x=>'mix-'+x[0])];
const NATURAL=[
 'smart-blood-sword','smart-blood-two-handed','smart-fury-daggers','smart-fury-bow','smart-radiance-pure','smart-aegis-radiance',
 'smart-decay-cycle-daggers','smart-decay-cycle-twohand','smart-decay-cycle-wand','smart-decay-overflow-wand','smart-decay-hybrid-staff','smart-decay-plagueheart',
 'smart-arcane-arcane-pure','smart-arcane-fire-pure','smart-arcane-lightning-pure','arcane-frost',
 'smart-blood-fury','smart-blood-fury-radiance','smart-blood-fury-radiance-no-mixed','smart-fury-blood-aegis','smart-arcane-fire-aegis','smart-arcane-frost-radiance','smart-decay-arcane-aegis',
 'balanced','hexblade-hybrid','pure-aegis','hybrid-decay-blood','hybrid-fury-radiance'
];
// Report IDs follow the current named elite identities; native IDs remain the runtime selection keys.
const ELITE_IDENTITIES=Object.freeze({
 tank:{id:'the_pallbearer',name:'The Pallbearer'},berserker:{id:'raker',name:'Raker'},
 vampire:{id:'the_thirst',name:'The Thirst'},caster:{id:'lantern_eye',name:'Lantern-Eye'},
 gravecaller:{id:'gravecaller',name:'Gravecaller'},the_shepherd:{id:'the_shepherd',name:'The Shepherd'},
 the_gilded:{id:'the_gilded',name:'The Gilded'},the_headsman:{id:'the_headsman',name:'The Headsman'}
});
const SC=[...[1,4,8,12,16,22].map(size=>({id:'normal-'+size,kind:'normal',size})),...G.SC.filter(s=>s.kind!=='normal').map(s=>s.elite?{...s,id:'elite-'+ELITE_IDENTITIES[s.elite].id,eliteId:ELITE_IDENTITIES[s.elite].id,name:ELITE_IDENTITIES[s.elite].name}:s)];
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fingerprint=()=>({commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,study:hash(fs.readFileSync(__filename,'utf8')),balanceCriteria:hash(fs.readFileSync(require.resolve('./v013-balance-criteria.cjs'),'utf8')),agent:hash(fs.readFileSync(require.resolve('./v013-agent-strategy.cjs'),'utf8')),planner:hash(fs.readFileSync(require.resolve('./v013-build-planner.cjs'),'utf8')),natural:hash(fs.readFileSync(require.resolve('./v013-natural-progression.cjs'),'utf8'))});
const write=(file,obj)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(obj)+'\n');};
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const tally=(arr,fn=x=>x)=>{const o={};for(const x of arr){const k=fn(x)??'none';o[k]=(o[k]||0)+1;}return o;};
const sumMaps=arr=>{const out={};for(const obj of arr)for(const [k,v] of Object.entries(obj||{}))if(Number.isFinite(v))out[k]=(out[k]||0)+v;return out;};
const mean=(rows,f)=>{const xs=rows.map(f).filter(Number.isFinite);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;};
const round=x=>Number.isFinite(x)?+x.toFixed(2):null;
const baseId=x=>x.replace(/_rank\d+$/,'');
const describe=id=>({id,name:graph.get(id)?.name||null,family:graph.get(id)?.family||null,pair:graph.get(id)?.pair||null,element:graph.get(id)?.element||null,kind:graph.get(id)?.kind||null});
function naturalProfile(id){
 if(N.PROFILES[id])return {...N.PROFILES[id],fixedResearchBuild:true,synergyAudit:true,researchGearPreference:true};
 const p=id==='pure-aegis'?G.P['aegis-mace']:G.P[id];assert(p,id);
 const b=G.profile(p.id);
 return {name:id,families:p.families,targets:p.skills,preparedTargets:p.prepared?[p.prepared]:[],weapons:[b.weapon],offhands:b.offhandType?[b.offhandType==='Off-Hand Dagger'?'Daggers':b.offhandType]:[],armor:b.armorType,element:p.element,style:p.families.length>1?'mixed':'focused',risk:0,healAt:.62,retreatAt:.38,target:'mechanics',shop:true,fixedResearchBuild:true,synergyAudit:true,researchGearPreference:true};
}
function goals(p){return [...new Set([...(p.targets||[]),...(p.preparedTargets||[]),...(p.plan?B.getPlan(p.plan).milestones:[])])];}
function validateGoals(id,p,ids){
 for(const key of ids){const n=graph.get(key);assert(n&&!n.pending,id+' invalid goal '+key);assert(!n.family||p.families.includes(n.family),id+' foreign goal '+key);assert(!n.pair||n.pair.every(f=>p.families.includes(f)),id+' foreign pair '+key);assert(!n.element||n.element===(p.element||'arcane'),id+' wrong element '+key);}
}
function controlProfile(id){
 const p=G.profile(id);validateGoals(id,p,p.skills);
 assert(T.valid(p.t));assert.equal(p.t.nodes.length,POINTS);
 for(const n of p.t.nodes){const x=graph.get(baseId(n));assert(x&&!x.pending,id+' stale allocated node '+n);assert(!x.family||p.families.includes(x.family),id+' foreign node '+n);assert(!x.pair||x.pair.every(f=>p.families.includes(f)),id+' foreign pair '+n);}
 return p;
}
function manifest(){
 assert.equal(SC.length,20);assert.equal(new Set(SC.map(s=>s.id)).size,20);assert.equal(SC.filter(s=>s.elite).length,8);
 assert.equal(new Set(CONTROL).size,CONTROL.length);assert.equal(new Set(NATURAL).size,NATURAL.length);
 assert.equal(new Set(CONTROL.filter(id=>G.P[id].families.length===2).map(id=>G.P[id].families.slice().sort().join('/'))).size,15);
 const control=CONTROL.map(id=>{const p=controlProfile(id);return {id,families:p.families,weapon:p.weapon,offhand:p.offhandType,armor:p.armorType,element:p.t.element||'arcane',prepared:p.t.prepared||null,goals:p.skills.map(describe),nodes:p.t.nodes.map(baseId).map(describe)};});
 const natural=NATURAL.map(id=>{const p=naturalProfile(id),ids=goals(p);validateGoals(id,p,ids);return {id,plan:p.plan||null,families:p.families,weapons:p.weapons,armor:p.armor,offhands:p.offhands||[],element:p.element||null,goals:ids.map(describe)};});
 return {fingerprint:fingerprint(),config:{E10,POINTS,N_PER,scenarios:SC,naturalBudget:{maxLevel:10,maxAttempts:12,maxTotalAttempts:60,tickLimit:6500},targets:Balance.TARGETS,idealHalfWidthPP:Balance.IDEAL_HALF_WIDTH_PP,tolerancePP:Balance.TOLERANCE_PP,eliteIdentities:ELITE_IDENTITIES},control,natural,potions:P.CATALOG.map(p=>({...p,recipe:P.RECIPES.find(r=>r.id===p.id)})),forgeRecipes:C.RECIPES.length};
}
function cell(p,sc,i){
 const seed=76100001+i*101,family=sc.family||F[i%F.length];
 const opts={...S.DEFAULTS,mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'adaptive',measure:true,tickLimit:6500,lockScenarioStreams:true,stage648ManaAudit:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],element:p.element};
 const x=S.encounter(10,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,10);assert.equal(x.affinity,family);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);assert.equal([x.won,x.died,x.timedOut].filter(Boolean).length,1);if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.family)assert.equal(x.bossAffinity,sc.family);
 const m=x.affinityMetrics||{};
 return {trial:i,seed,resolvedSeed:x.resolvedSeed,sc:sc.id,kind:sc.kind,requestedSize:sc.size||null,actualSize:x.initialEnemies,affinity:family,rosterHash:hash([x.roster,x.initialRoles,x.conditionId,x.conditionMarked,x.traitId,x.bossModifierIds,x.eliteType,x.bossId]),gearHash:x.gearFingerprint,elite:x.eliteType,eliteId:sc.eliteId||null,eliteName:sc.name||null,boss:x.bossName,bossId:x.bossId,won:x.won,died:x.died,timedOut:x.timedOut,seconds:x.seconds,damageDealt:x.damageDealt,damageTaken:x.damageTaken,secondaryTargetDamage:x.secondaryTargetDamage,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,manaSpent:x.manaSpent,fundedCasts:x.fundedCasts,unfundedCasterAttacks:x.unfundedCasterAttacks,stats:x.heroBaseStats,healing:m.healingActual,barrier:m.barrierGenerated,absorbed:m.barrierAbsorbed,dotDamage:m.dotDamageActual,passiveActivations:m.passiveActivations||{},abilityMetrics:{...x.magicAdaptiveMetrics,...x.decayTalentMetrics,...x.defensiveTalentMetrics,...x.graveBloomMetrics,...x.weaponStatusMetrics},manaAudit:x.manaAudit||null,peakVisible:x.peakVisibleEnemies,peakPrincipals:x.groupPressure?.peakPrincipals,remainingActors:x.groupPressure?.remainingActors,remainingReserve:x.groupPressure?.remainingReserve};
}
function controlled(id,scenario,n=N_PER){
 const p=controlProfile(id),sc=SC.find(x=>x.id===scenario);assert(sc);assert(Number.isInteger(n)&&n>=1&&n<=N_PER);
 const rows=Array.from({length:n},(_,i)=>cell(p,sc,i));
 write(path.join(OUT,'controlled',id,scenario+'.json'),{id,scenario,fingerprint:fingerprint(),rows});
 console.log('B1_CONTROL='+JSON.stringify({id,scenario,...fightSummary(rows)}));
}
function naturalAccount(id,i,maxLevel=10,maxAttempts=12,maxTotalAttempts=60){
 const profile=naturalProfile(id),seed=76200001+i*101;let snap=null;
 const acc=N.simulateAccount(seed,id,{...N.DEFAULTS,maxLevel,maxAttempts,maxTotalAttempts,tickLimit:6500,maxRooms:34},{researchProfiles:{[id]:profile},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a,level,attempt})=>{
  if(level!==10||attempt!==1)return null;
  const s=a.state(),p=s.automaticTalents,stats=a.baseStats();assert(T.valid(p));assert.equal(a.controller().state.unlocked,10);
  snap={level,seed,xp:p.xp,earned:T.earned(p),spent:p.nodes.length,nodes:[...p.nodes],element:p.element||'arcane',prepared:p.prepared||null,families:p.nodes.filter(x=>x.startsWith('affinity_')).map(x=>x.slice(9)),gear:N.gearSnapshot(a),stats:Object.fromEntries(['attack','spellPower','defense','maxhp','mana','manaRegen','attacksPerSec','crit','blockChance','evasionRating','healingPower','barrierPower'].map(k=>[k,stats[k]??null])),runes:clone(s.runes),runeSlots:clone(s.runeSlots),crafting:clone(s.crafting),gold:s.gold,fragments:s.fragments,potions:clone(s.consumables),loadout:clone(s.potionSelection),capability:N.capabilities(a)};
  return null;
 }});
 assert.equal(acc.startXp,0);assert(acc.initialGear.items.every(x=>x.startingGear));
 for(const t of acc.attempts)if(!t.error){
  assert(t.before&&t.after);assert(t.after.xp>=t.before.xp);assert(t.after.unlocked>=t.before.unlocked);
  assert(t.after.runeBag.length>=t.before.runeBag.length);
  for(const a of t.camp?.potions||[])if(a.action==='craft'){const r=P.RECIPES.find(r=>r.id===a.kind);assert(r);assert.equal(a.essenceSpent,r.essence);assert.deepEqual(clone(a.reagentsSpent),clone(r.reagents));}
  for(const u of t.potions||[])assert(P.CATALOG.some(p=>p.id===u.kind),'unknown used potion '+u.kind);
 }
 return {seed,profile:id,reachedE10:!!snap,clearedE10:acc.endLevel>=11,endLevel:acc.endLevel,stopReason:acc.stopReason,snapshot:snap,attempts:acc.attempts.map(t=>({level:t.level,attempt:t.attempt,status:t.status,error:t.error||null,diagnostic:t.diagnostic||null,bossReached:t.bossReached,bossWon:t.bossWon,before:t.before,after:t.after,camp:t.camp,potions:t.potions,contract:t.contract,contractPaid:t.contractPaid,boons:t.boons,rooms:t.rooms||[]}))};
}
function natural(id,batch,n=5){
 assert(NATURAL.includes(id));assert(Number.isInteger(batch)&&batch>=0&&batch<10);assert(n>=1&&n<=5);
 const accounts=Array.from({length:n},(_,i)=>naturalAccount(id,batch*5+i));
 write(path.join(OUT,'natural',id,'batch-'+batch+'.json'),{id,batch,fingerprint:fingerprint(),accounts});
 console.log('B1_NATURAL_BATCH='+JSON.stringify({id,batch,accounts:accounts.map(a=>({seed:a.seed,E:a.endLevel,reachedE10:a.reachedE10,clearedE10:a.clearedE10,errors:a.attempts.filter(t=>t.error).map(t=>({level:t.level,error:t.error})),attempts:a.attempts.length}))}));
}
function wilson(w,n){if(!n)return null;const p=w/n,z=1.96,d=1+z*z/n,center=(p+z*z/(2*n))/d,r=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [round(100*(center-r)),round(100*(center+r))];}
function fightSummary(rows){
 const valid=rows.filter(r=>r.won||r.died),wins=valid.filter(r=>r.won).length,mp=valid.filter(r=>r.mpMax>0),n=valid.length;
 return {attempted:rows.length,resolved:n,wins,deaths:valid.filter(r=>r.died).length,timeouts:rows.filter(r=>r.timedOut).length,winPct:n?round(100*wins/n):null,ci95:wilson(wins,n),seconds:round(mean(valid,r=>r.seconds)),winSeconds:round(mean(valid.filter(r=>r.won),r=>r.seconds)),dps:round(mean(valid,r=>r.seconds>0?r.damageDealt/r.seconds:null)),secondaryDps:round(mean(valid,r=>r.seconds>0?r.secondaryTargetDamage/r.seconds:null)),meanAP:round(mean(valid,r=>r.stats?.attack)),meanSP:round(mean(valid,r=>r.stats?.spellPower)),meanDefense:round(mean(valid,r=>r.stats?.defense)),hpEndPct:round(mean(valid,r=>r.hpMax>0?100*r.hpEnd/r.hpMax:null)),manaEndPct:round(mean(mp,r=>100*r.mpEnd/r.mpMax)),manaSpent:round(mean(valid,r=>r.manaSpent)),fundedCasts:round(mean(valid,r=>r.fundedCasts)),unfunded:round(mean(valid,r=>r.unfundedCasterAttacks)),healing:round(mean(valid,r=>r.healing)),barrier:round(mean(valid,r=>r.barrier)),absorbed:round(mean(valid,r=>r.absorbed)),dotDamage:round(mean(valid,r=>r.dotDamage)),passiveActivations:sumMaps(valid.map(r=>r.passiveActivations)),abilityMetrics:sumMaps(valid.map(r=>r.abilityMetrics)),requestedSizeMismatch:rows.filter(r=>r.requestedSize!==null&&r.requestedSize!==undefined&&r.actualSize!==r.requestedSize).length,visibleCapViolations:rows.filter(r=>r.peakVisible>4||r.peakLiveEnemies>4).length};
}
function naturalSummary(id,accounts){
 const p=naturalProfile(id),attempts=accounts.flatMap(a=>a.attempts),e10=attempts.filter(t=>t.level===10),snap=accounts.map(a=>a.snapshot).filter(Boolean);
 const rooms=ts=>ts.flatMap(t=>t.rooms||[]),byType=rs=>Object.fromEntries(['combat','elite','boss'].map(k=>[k==='combat'?'normal':k,fightSummary(rs.filter(r=>r.roomType===k))]));
 const economy=ts=>{const cs=ts.flatMap(t=>t.camp?.potions||[]),forge=ts.flatMap(t=>t.camp?.crafted||[]),use=ts.flatMap(t=>t.potions||[]),spend=(xs,k)=>xs.reduce((s,x)=>s+(x[k]||0),0);return {potionCrafts:tally(cs.filter(x=>x.action==='craft'),x=>x.kind),potionPurchases:tally(cs.filter(x=>x.action==='buy'),x=>x.kind),potionUse:tally(use,x=>x.kind),automaticPotionUse:tally(use.filter(x=>x.automatic),x=>x.kind),potionGold:spend(cs.filter(x=>['buy','restock'].includes(x.action)),'cost'),potionEssence:spend(cs,'essenceSpent'),potionReagents:sumMaps(cs.map(x=>x.reagentsSpent)),forgeCrafts:forge.length,forgeRecipes:tally(forge,x=>x.recipe),forgeInfluence:tally(forge.filter(x=>x.influence),x=>x.influence),forgeEssence:spend(forge,'essenceSpent'),forgeReagents:sumMaps(forge.map(x=>x.reagentsSpent)),forgeFragments:spend(forge,'fragmentsSpent'),refines:ts.flatMap(t=>t.camp?.refined||[]).length,contractsPaid:tally(ts.map(t=>t.contractPaid).filter(Boolean),x=>x.kind),loadout:tally(ts.flatMap(t=>t.before?.potionSelection||[])),potionsUnusedAtE10Camp:sumMaps(snap.map(x=>x.potions))};};
 const weapon=x=>x.gear.items.find(i=>i.slot==='weapon')?.subtype,armor=x=>x.gear.items.find(i=>i.slot==='armor')?.armorType,offhand=x=>x.gear.items.find(i=>i.slot==='offhand')?.subtype;
 const e10rooms=rooms(e10),owned=tally(snap.flatMap(x=>[...new Set(x.nodes.map(baseId))])),observed=sumMaps(e10rooms.map(x=>x.passiveActivations));
 const talentAudit=[...new Set([...goals(p),...Object.keys(owned),...Object.keys(observed)])].map(id=>({...describe(id),owners:owned[id]||0,prepared:snap.filter(x=>x.prepared===id).length,observedActivations:observed[id]||0,goal:goals(p).includes(id)}));
 return {id,intent:{families:p.families,weapons:p.weapons,armor:p.armor,offhands:p.offhands||[],element:p.element||null,plan:p.plan||null},accounts:accounts.length,reachedE10:snap.length,clearedE10:accounts.filter(a=>a.clearedE10).length,errors:attempts.filter(t=>t.error).map(t=>({level:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic})),stopReasons:tally(accounts,x=>x.stopReason||'cleared-horizon'),progression:Array.from({length:10},(_,i)=>{const level=i+1,ts=attempts.filter(t=>t.level===level);return {level,accounts:accounts.filter(a=>a.attempts.some(t=>t.level===level)).length,attempts:ts.length,bossWins:ts.filter(t=>t.bossWon).length,deaths:ts.filter(t=>t.status==='defeat').length,extractions:ts.filter(t=>t.status==='extracted').length,byType:byType(rooms(ts))};}),e10:byType(e10rooms),e10BySize:Object.fromEntries([1,4,8,12,16,22].map((n,i,arr)=>[n,fightSummary(e10rooms.filter(r=>r.roomType==='combat'&&r.initialEnemies>(arr[i-1]||0)&&r.initialEnemies<=n))])),e10Elites:Object.fromEntries(SC.filter(s=>s.elite).map(s=>[s.eliteId,{runtimeId:s.elite,name:s.name,...fightSummary(e10rooms.filter(r=>r.eliteType===s.elite))}])),e10BossStyles:Object.fromEntries(['leech','matriarch','devourer','guardian','berserker','conductor'].map(s=>[s,fightSummary(e10rooms.filter(r=>r.bossStyle===s))])),identity:{weapon:tally(snap,weapon),weaponMatch:snap.filter(x=>p.weapons.includes(weapon(x))).length,armor:tally(snap,armor),armorMatch:snap.filter(x=>armor(x)===p.armor).length,offhand:tally(snap,offhand),element:tally(snap,x=>x.element),families:tally(snap,x=>x.families.slice().sort().join('/')),foreignAffinity:snap.filter(x=>x.families.some(f=>!p.families.includes(f))).length,points:round(mean(snap,x=>x.spent)),stats:Object.fromEntries(['attack','spellPower','defense','maxhp','mana','manaRegen','attacksPerSec','crit','blockChance','evasionRating'].map(k=>[k,round(mean(snap,x=>x.stats[k]))])),talentAudit},economyAll:economy(attempts),economyE10:economy(e10)};
}
function aggregate(){
 const manifest=read(path.join(OUT,'manifest.json')),expected=manifest.fingerprint;assert.deepEqual(expected,fingerprint());
 const missing=[],control=[],natural=[],pairing={compared:0,matched:0,mismatches:[]},base=new Map();
 for(const id of CONTROL){const rows=[];for(const sc of SC){const file=path.join(OUT,'controlled',id,sc.id+'.json');if(!fs.existsSync(file)){missing.push('controlled/'+id+'/'+sc.id);continue;}const x=read(file);assert.deepEqual(x.fingerprint,expected);assert.equal(x.rows.length,N_PER);assert.equal(new Set(x.rows.map(r=>r.trial)).size,N_PER);for(const r of x.rows){const key=r.sc+'/'+r.trial,b=base.get(key);if(!b)base.set(key,r);else{pairing.compared++;if(b.rosterHash===r.rosterHash)pairing.matched++;else if(pairing.mismatches.length<20)pairing.mismatches.push({id,key});}}rows.push(...x.rows);}
 const p=manifest.control.find(x=>x.id===id);control.push({...p,rows:rows.length,byType:Object.fromEntries(['normal','elite','boss'].map(k=>[k,fightSummary(rows.filter(r=>r.kind===k))])),scenarios:Object.fromEntries(SC.map(s=>[s.id,fightSummary(rows.filter(r=>r.sc===s.id))]))});}
 for(const id of NATURAL){const accounts=[];for(let i=0;i<10;i++){const file=path.join(OUT,'natural',id,'batch-'+i+'.json');if(!fs.existsSync(file)){missing.push('natural/'+id+'/'+i);continue;}const x=read(file);assert.deepEqual(x.fingerprint,expected);assert.equal(x.accounts.length,5);accounts.push(...x.accounts);}assert.equal(new Set(accounts.map(x=>x.seed)).size,accounts.length);natural.push(naturalSummary(id,accounts));}
 const naturalBalance=Object.fromEntries(Object.keys(Balance.TARGETS).map(k=>{const wins=natural.reduce((n,p)=>n+p.e10[k].wins,0),resolved=natural.reduce((n,p)=>n+p.e10[k].resolved,0),winPct=resolved?round(100*wins/resolved):null;return [k,{wins,resolved,winPct,balance:Balance.classify(k,winPct,resolved)}];}));
 const result={fingerprint:expected,manifest:manifest.config,naturalBalance,missing,complete:!missing.length,pairing,control,natural,coverage:{controlFights:control.reduce((n,x)=>n+x.rows,0),expectedControl:CONTROL.length*SC.length*N_PER,naturalAccounts:natural.reduce((n,x)=>n+x.accounts,0),expectedNatural:NATURAL.length*N_PER,reachedE10:natural.reduce((n,x)=>n+x.reachedE10,0),clearedE10:natural.reduce((n,x)=>n+x.clearedE10,0),naturalErrors:natural.reduce((n,x)=>n+x.errors.length,0)}};
 write(path.join(OUT,'summary.json'),result);
 const fmt=x=>x?.winPct===null||x?.winPct===undefined?'n/a':x.winPct+'% ('+x.resolved+')';
 const md=['# B1 — Current E10 baseline','',JSON.stringify(result.coverage),'','## Aggregate natural E10 balance (encounter-weighted)','| Kind | Target | Ideal | Acceptable | Observed | Status |','|---|---:|---:|---:|---:|---|',...Object.entries(naturalBalance).map(([k,v])=>{const b=v.balance;return '| '+[k,b.target+'%',b.idealMin+'–'+b.idealMax+'%',b.acceptableMin+'–'+b.acceptableMax+'%',fmt(v),b.status].join(' | ')+' |';}),'','## Elite identity mapping','| Report ID | Native runtime ID | Name |','|---|---|---|',...Object.entries(ELITE_IDENTITIES).map(([runtime,v])=>'| '+[v.id,runtime,v.name].join(' | ')+' |'),'','## Natural E1–E10 (earned only)','| Profile | E10 reached | E10 cleared | Normal E10 | Elite E10 | Boss E10 | Weapon match | Errors |','|---|---:|---:|---:|---:|---:|---:|---:|',...natural.map(p=>'| '+[p.id,p.reachedE10+'/'+p.accounts,p.clearedE10,fmt(p.e10.normal),fmt(p.e10.elite),fmt(p.e10.boss),p.identity.weaponMatch+'/'+p.reachedE10,p.errors.length].join(' | ')+' |'),'','## Controlled E10 (30 points, Rare, no potions/runes)','| Build | Normal | Elite | Boss |','|---|---:|---:|---:|',...control.map(p=>'| '+[p.id,fmt(p.byType.normal),fmt(p.byType.elite),fmt(p.byType.boss)].join(' | ')+' |'),'','Missing shards: '+missing.length,'Roster matching: '+pairing.matched+'/'+pairing.compared,'','Natural and controlled outcomes must not be pooled. Natural rooms are selected by the agent, not a random census. CIs are descriptive; repeated fights within an account are correlated. No activation counter is not proof of a broken skill.'];
 fs.writeFileSync(path.join(OUT,'summary.md'),md.join('\n')+'\n');
 console.log('B1_OVERVIEW='+JSON.stringify({coverage:result.coverage,naturalBalance,missing:missing.slice(0,30),pairing,natural:natural.map(p=>({id:p.id,reached:p.reachedE10,cleared:p.clearedE10,errors:p.errors.length,e10:Object.fromEntries(Object.entries(p.e10).map(([k,v])=>[k,{n:v.resolved,win:v.winPct}])),identity:{weapon:p.identity.weapon,armor:p.identity.armor,points:p.identity.points},potionCrafts:p.economyAll.potionCrafts,potionUse:p.economyAll.potionUse,forgeCrafts:p.economyAll.forgeCrafts})),control:control.map(p=>({id:p.id,n:p.rows,normal:p.byType.normal.winPct,elite:p.byType.elite.winPct,boss:p.byType.boss.winPct}))}));
 if(missing.length||result.coverage.naturalErrors)process.exitCode=1;
}
function smoke(){
 const m=manifest();write(path.join(OUT,'manifest.json'),m);
 for(const id of CONTROL)cell(controlProfile(id),SC[0],0);
 for(const sc of SC)cell(controlProfile(CONTROL[0]),sc,1);
 for(const id of NATURAL){const a=naturalAccount(id,0,1,1,1);assert(!a.attempts.some(t=>t.error),id+' '+JSON.stringify(a.attempts.filter(t=>t.error)));assert(a.attempts.length===1,id);}
 console.log('B1_SMOKE_OK='+JSON.stringify({control:CONTROL.length,natural:NATURAL.length,scenarios:SC.length,expectedControl:CONTROL.length*SC.length*N_PER,expectedNatural:NATURAL.length*N_PER}));
}
if(require.main===module){const [cmd,id,sc,n]=process.argv.slice(2);if(cmd==='manifest'){const m=manifest();write(path.join(OUT,'manifest.json'),m);console.log(JSON.stringify({control:CONTROL,natural:NATURAL,scenarios:SC.map(x=>x.id)}));}else if(cmd==='smoke')smoke();else if(cmd==='controlled')controlled(id,sc,n?+n:N_PER);else if(cmd==='natural')natural(id,+sc,n?+n:5);else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={CONTROL,NATURAL,SC,manifest,controlProfile,naturalProfile,fightSummary,naturalSummary,cell,naturalAccount};
