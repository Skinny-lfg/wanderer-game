'use strict';
// Stage 5: observational build instrumentation for current natural decision agents.
// No strategic choices, gear, talent purchases, resets or gameplay changed here.
const fs=require('node:fs');
const path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const create=require('../tests/v012-economy-harness.cjs');
// Resolve the talent catalog from the exact integrated VM, not the Node-side
// fallback that only sees CORE when Buildcraft has not initialized.
const T=create(7365,undefined,{}, {skipPersistence:true,now:1720000007365}).talents;
const NODE=new Map(T.NODES.map(n=>[n.id,n]));
const TARGETS=Object.freeze([1,5,10,20]);
const avg=rows=>rows.length?+(rows.reduce((a,b)=>a+b,0)/rows.length).toFixed(2):null;
function classifyGear(gear={},talentNodes=[]){
 const items=gear.items||[],weapon=items.find(i=>i.slot==='weapon')?.subtype||null;
 const armor=items.filter(i=>['Cloth','Leather','Plate'].includes(i.armorType));
 const armorMix=Object.fromEntries(['Cloth','Leather','Plate'].map(type=>
  [type,armor.filter(i=>i.armorType===type).length]));
 const dominantArmor=Object.entries(armorMix).sort((a,b)=>b[1]-a[1])[0]?.[1]?
  Object.entries(armorMix).sort((a,b)=>b[1]-a[1])[0][0]:null;
 const attrs=Object.fromEntries(['str','agi','int','end','cha','spell','atk','def','hp','spd','evasionRating','blockBonus','manaRegenBonus']
  .map(key=>[key,items.reduce((n,x)=>n+Number(x.stats?.[key]||0),0)]));
 const owned=new Set(talentNodes);
 const families=[...new Set(talentNodes.map(id=>NODE.get(id)?.family)
  .filter(Boolean).concat(talentNodes.filter(id=>id.startsWith('affinity_')).map(id=>id.slice('affinity_'.length))))];
 const magicWeapon=['Wand','Staff'].includes(weapon);
 const agilityWeapon=['Bow','Daggers'].includes(weapon);
 const plateWeapon=['Sword','Mace','Two-Handed'].includes(weapon);
 const labels=[];
 if(magicWeapon&&armorMix.Cloth>=1&&
   (families.includes('magic')||attrs.int>0||attrs.spell>0))labels.push('cloth_magic');
 if(agilityWeapon&&armorMix.Leather>=1&&
   (families.includes('fury')||attrs.agi>0))labels.push('leather_agility');
 if(plateWeapon&&armorMix.Plate>=1&&
   (families.includes('aegis')||families.includes('blood')||attrs.str+attrs.end>0))labels.push('plate_strength_endurance');
 const isHybrid=talentNodes.some(id=>{const n=NODE.get(id.replace(/_rank\d+$/,''));return n?.kind==='mixed'||n?.advanced;});
 if(families.length>=2)labels.push('multi_affinity');
 if(isHybrid)labels.push('cross_branch_special');
 const statLeaders=Object.entries({str:attrs.str,agi:attrs.agi,int:attrs.int,end:attrs.end,cha:attrs.cha})
  .sort((a,b)=>b[1]-a[1]);
 return {weapon,dominantArmor,armorMix,attributes:attrs,
  talentFamilies:families,uniqueFamilies:families.length,
  hybridAbilityOwned:isHybrid,matchingExamples:labels,
  gearPrimaryStat:statLeaders[0]?.[1]>0?statLeaders[0][0]:null,
  noGearPieces:items.length===0,starterPieces:gear.starter??null};
}
// v15 has no T.path API. Determine the minimum logical prerequisite
// closure from the actual T.NODES requires / prerequisites / anyRequires.
// This is for diagnostics only; native T.allocate remains the purchase gate.
function prerequisiteClosure(target,visiting=new Set()){
 const id=target.replace(/_rank\d+$/,''),node=NODE.get(id);
 if(!node||visiting.has(id))return null;
 const active=new Set(visiting);active.add(id);
 const needed=new Set();
 function join(candidate){
  if(!candidate)return false;
  for(const key of candidate)needed.add(key);
  return true;
 }
 for(const key of [node.requires,...(node.prerequisites||[])].filter(Boolean)){
  if(!join(prerequisiteClosure(key,active)))return null;
 }
 if(node.anyRequires?.length){
  const options=node.anyRequires.map(key=>prerequisiteClosure(key,active)).filter(Boolean)
   .sort((a,b)=>a.length-b.length);
  if(!join(options[0]))return null;
 }
 needed.add(id);
 return [...needed];
}
function talentDepth(ids=[]){
 const skill=ids.map(id=>NODE.get(id.replace(/_rank\d+$/,''))).filter(Boolean)
  .filter(n=>['basic','focused','mixed','element'].includes(n.kind)||n.advanced);
 const depths=ids.map(id=>prerequisiteClosure(id)?.length||0);
 return {allocated:ids.length,skillNodes:skill.length,
  deepestLegalRoute:depths.length?Math.max(...depths):0,
  abilityIds:skill.map(n=>n.id),
  mixedAbilities:skill.filter(n=>n.kind==='mixed'||n.advanced).map(n=>n.id)};
}
function account(a){
 const attempts=a.attempts||[],first=attempts[0];
 const changeRecords=attempts.map((entry,i)=>{
  const previous=i?attempts[i-1].after?.talentNodes||[]:[];
  const now=entry.before?.talentNodes||[];
  const prev=new Set(previous),next=new Set(now);
  const removed=[...prev].filter(id=>!next.has(id));
  return {level:entry.level,attempt:entry.attempt,
   resetCount:entry.camp?.resets?.length||0,
   inferredNodeRemoval:removed,
   gearChanges:(entry.camp?.equipped?.length||0)+(entry.equipped?.length||0),
   gearBefore:classifyGear(entry.before?.gear,now),
   gearAfter:classifyGear(entry.gearAfter,entry.after?.talentNodes||now),
   nativeOwnedTalentPoints:entry.before?.earned??null,
   talentNodes:now.length,
   attributesAtEntry:entry.before?.attributes||{},
   deliberateStyleChoice:entry.camp?.buildStyle||null,
   status:entry.status};
 });
 const checkpoints=Object.fromEntries(TARGETS.map(level=>{
  const entry=attempts.find(x=>x.level===level);
  return ['E'+level,entry?{
   reached:true,attemptNumber:attempts.indexOf(entry)+1,
   gear:classifyGear(entry.before?.gear,entry.before?.talentNodes||[]),
   talent:talentDepth(entry.before?.talentNodes||[]),
   attributes:entry.before?.attributes||{}
  }:{reached:false}];
 }));
 const finalNodes=a.talents||[];
 return {seed:a.seed,profile:a.profile,attempts:attempts.length,
  unlocked:a.endLevel,checkpoint:checkpoints,
  actualResetCount:changeRecords.reduce((n,x)=>n+x.resetCount,0),
  inferredTalentRemovalEvents:changeRecords.filter(x=>x.inferredNodeRemoval.length).length,
  actualGearEquipDecisions:changeRecords.reduce((n,x)=>n+x.gearChanges,0),
  dominantWeaponTransitions:changeRecords.filter((x,i)=>
   i&&x.gearBefore.weapon!==changeRecords[i-1].gearAfter.weapon).length,
  dominantArmorTransitions:changeRecords.filter((x,i)=>
   i&&x.gearBefore.dominantArmor!==changeRecords[i-1].gearAfter.dominantArmor).length,
  finalGear:classifyGear(a.finalGear,finalNodes),
  finalTalent:talentDepth(finalNodes),attributePointsSpent:Object.values(attempts.at(-1)?.after?.attributes||{}).reduce((n,x)=>n+x,0),
  chronological:changeRecords};
}
function summarize(raw){
 const accounts=raw.accounts.map(account);
 const matrix=Object.fromEntries(TARGETS.map(level=>{
  const at=accounts.filter(a=>a.checkpoint['E'+level].reached);
  const gear=at.map(a=>a.checkpoint['E'+level].gear);
  return ['E'+level,{reached:at.length,
   weaponCounts:gear.reduce((out,g)=>{const k=g.weapon||'none';out[k]=(out[k]||0)+1;return out;},{}),
   armorCounts:gear.reduce((out,g)=>{const k=g.dominantArmor||'none';out[k]=(out[k]||0)+1;return out;},{}),
   synergyExamples:gear.flatMap(g=>g.matchingExamples).reduce((out,k)=>{out[k]=(out[k]||0)+1;return out;},{}),
   meanFamilyCount:avg(gear.map(g=>g.uniqueFamilies)),
   meanRouteDepth:avg(at.map(a=>a.checkpoint['E'+level].talent.deepestLegalRoute)),
   meanTalentNodes:avg(at.map(a=>a.checkpoint['E'+level].talent.allocated)),
   meanAttributePointsAllocated:avg(at.map(a=>Object.values(a.checkpoint['E'+level].attributes).reduce((n,x)=>n+x,0)))}];
 }));
 return {method:'Observational audit of current deterministic agents; no new build selection',
  engineFingerprint:raw.source,runnerHash:raw.runnerSha256,
  cohort:{accounts:accounts.length,totalAttempts:accounts.reduce((n,a)=>n+a.attempts,0),
   errors:raw.coverage.errors,reachedE20:accounts.filter(a=>a.checkpoint.E20.reached).length},
  currentPolicy: Object.fromEntries(Object.entries(N.PROFILES).map(([id,p])=>{
   const valid=p.targets.filter(t=>NODE.has(t));
   return [id,{declaredTargets:p.targets,validTalentIds:valid,
    unresolvedTalentIds:p.targets.filter(t=>!NODE.has(t)),
    familyIds:p.families,deepTargetIds:p.targets.filter(t=>NODE.has(t)&&talentDepth([t]).deepestLegalRoute>5)}];
  })),
  resets:accounts.reduce((n,a)=>n+a.actualResetCount,0),
  gearEquips:accounts.reduce((n,a)=>n+a.actualGearEquipDecisions,0),
  weaponTransitions:accounts.reduce((n,a)=>n+a.dominantWeaponTransitions,0),
  armorTransitions:accounts.reduce((n,a)=>n+a.dominantArmorTransitions,0),
  attributePointsSpent:accounts.reduce((n,a)=>n+a.attributePointsSpent,0),
  milestoneMatrix:matrix,
  accounts
 };
}
function markdown(r){
 const lines=['# Stage 5 — Build-strategy gap analysis (current native agents)','',
  'This measures existing agents only. It does **not** establish relative success of focused, deep, mixed or adaptive builds, because those policies do not yet exist in the current runner.','',
  '- Accounts: '+r.cohort.accounts+'; observed attempts: '+r.cohort.totalAttempts+
  '; native errors: '+r.cohort.errors,
  '- Native talent resets recorded: '+r.resets,
  '- Equipment equip decisions: '+r.gearEquips,
  '- Weapon/armor transitions: '+r.weaponTransitions+' / '+r.armorTransitions,
  '- Persistent attribute points allocated in these agents: '+r.attributePointsSpent,'',
  '## Current declared talent goals and graph integrity',''];
 for(const [id,p] of Object.entries(r.currentPolicy))lines.push('- '+id+
  ': valid IDs ['+p.validTalentIds.join(', ')+']; unresolved IDs ['+
  p.unresolvedTalentIds.join(', ')+']; targeted deep skills ['+
  p.deepTargetIds.join(', ')+']');
 lines.push('','## Milestone equipment and talent snapshots','',
  '| Milestone | Actual arrivals | Average talent nodes | Average legal path depth | Avg attribute points spent | Primary weapons |',
  '|---|---:|---:|---:|---:|---|');
 for(const [level,x] of Object.entries(r.milestoneMatrix)){
  lines.push('| '+level+' | '+x.reached+' | '+(x.meanTalentNodes??'—')+' | '+
   (x.meanRouteDepth??'—')+' | '+(x.meanAttributePointsAllocated??'—')+
   ' | '+Object.entries(x.weaponCounts).map(([k,v])=>k+': '+v).join(', ')+' |');
 }
 lines.push('','## Conclusions and next experiments','',
  '- Existing gear scoring uses nearly fixed affix weights, regardless of chosen magic/strength/agility tree.',
  '- Current talent goals contain invalid IDs, so the fallback allocation does not test intended deep specializations.',
  '- No adaptive respec policy is invoked. A natural talent reset preserves permanent attributes in current game rules; do not assume it can freely move Strength into Intellect.',
  '- Use the real T.path / T.allocate / T.reset, and native gear purchases and Forge, for controlled next-generation build agents.',
  '- Compare fixed focused builds, fixed multi-affinity builds, deep-rush vs broad early trees, and limited gear-triggered respec with the same seeds, budgets and risk exposure. Record switching costs and substitutions.',
  '- Do not infer human play or absolute balance from these baseline agents.','');
 return lines.join('\n');
}
function run(args=process.argv.slice(2)){
 const options=N.parseArgs(args);
 const raw=N.run(options);
 const report=summarize(raw),out=path.resolve(options.output);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.md'),markdown(report)+'\n');
 console.log('STAGE5_BUILD_AUDIT='+JSON.stringify({
  coverage:report.cohort,policy:report.currentPolicy,resets:report.resets,
  gearEquips:report.gearEquips,weaponTransitions:report.weaponTransitions,
  armorTransitions:report.armorTransitions,attributePointsSpent:report.attributePointsSpent,
  milestoneMatrix:report.milestoneMatrix
 }));
 if(report.cohort.errors)process.exitCode=1;
 return report;
}
module.exports={TARGETS,nativeTalentAPI:T,classifyGear,talentDepth,account,summarize,markdown,run};
if(require.main===module)run();
