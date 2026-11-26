'use strict';
// Diagnostic-only projections on naturally earned Camp checkpoints.
const assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('./v013-natural-progression.cjs'),S=require('./simulate-progression.cjs'),D=require('./v013-stage628-postcap-difficulty.cjs');
require('../combat/expedition-progression.js');require('../combat/v012-combat-core.js');
const T=globalThis.WandererAutomaticTalents;
const LEVELS=[1,2,5,10,20,50,100,200],PROFILES=['smart-blood-pure','smart-fury-bow','smart-radiance-pure','smart-aegis-radiance','smart-arcane-arcane-pure','smart-decay-arcane-aegis','cautious','balanced','plate-warden','cloth-battlemage','leather-duelist','hexblade-hybrid'];
const FIELDS={flatAttack:'attack',flatArmor:'defense',flatLife:'maxhp',flatSpell:'spellPower'};
const OTHER=['flatAvoid','flatRegen','flatMana','flatSpeed','startBarrier','healthRegen','bleedBonus','rotBonus','rotDefense','sunderDamage','attribute'];
const MODES=['current','flat5-defense','percent-only','hybrid-low','hybrid-full'];
const inventory=()=>Object.fromEntries([...Object.keys(FIELDS),...OTHER].map(k=>[k,T.NODES.filter(n=>n.kind==='stat'&&n[k]!==undefined).length]));
function incoming(def,atk){return Math.max(Math.ceil(atk*.24),Math.round(atk*(1-Math.min(.75,def/(def+atk*1.35)))));}
function delta(n,k,base,mode){
 const tier=k==='flatLife'?[5,8,12].indexOf(n[k])+1:n[k]-1;
 const pct=base*(mode==='hybrid-low'?[.01,.015,.02]:[.02,.03,.04])[tier-1];
 return mode==='current'?0:mode==='flat5-defense'?(k==='flatArmor'?5-n[k]:0):mode==='percent-only'?pct-n[k]:pct;
}
// The shadow function uses the same graph, buildcraft and temporary modifiers.
// It never replaces the numerical stats the natural agent uses.
function project(root,base,progress,build,preview,phase6Run,mode,delta){
 const graph=root.WandererAutomaticTalents.NODES,rs=root.WandererAutomaticTalents.graphProgress(progress);
 const selected=graph.filter(n=>rs.ranks[n.id]),map={flatAttack:'attack',flatArmor:'defense',flatLife:'maxhp',flatSpell:'spellPower'},s={...base};
 for(const [k,dest] of Object.entries(map))for(const n of selected)if(n[k]>0)s[dest]+=delta(n,k,base[dest]||0,mode)*rs.ranks[n.id];
 let v=root.WandererTalentGraphBridge.apply(s,graph,rs);
 if(preview&&root.WandererV012Buildcraft){let active=build;if(!active){active=root.WandererV012Buildcraft.create();root.WandererV012Buildcraft.syncPermanent(active,progress);}v=root.WandererV012Buildcraft.mods(active,v);}
 if(preview&&phase6Run?.effects)v=root.WandererV012CombatCore.applyExpeditionModifiers(v,phase6Run.effects);
 v.attacksPerSec=Math.min(4.2,v.attacksPerSec);
 return {base:Object.fromEntries(Object.values(map).map(k=>[k,base[k]])),stats:Object.fromEntries(['attack','defense','maxhp','spellPower','evasionRating','mana','manaRegen','attacksPerSec'].map(k=>[k,v[k]??0])),owned:Object.fromEntries(Object.keys(map).map(k=>[k,selected.filter(n=>n[k]>0).length]))};
}
const FILE='combat/v012-gear-stats.js',SOURCE=fs.readFileSync(FILE,'utf8');
function replaceOnce(s,a,b){assert.equal(s.split(a).length,2,'Missing unique source anchor');return s.replace(a,b);}
function shadowSource(){
 let s=replaceOnce(SOURCE,' if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents)root.WandererAutomaticTalents.apply(s,state.automaticTalents);',
 ' const nodeAuditBase={...s};\n if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents)root.WandererAutomaticTalents.apply(s,state.automaticTalents);');
 const shadow=' Object.defineProperty(result,"__nodeAudit",{enumerable:false,value:mode=>('+project.toString()+')(root,nodeAuditBase,state.automaticTalents,build,PHASE1_PREVIEW,phase6Run,mode,('+delta.toString()+'))});';
 return replaceOnce(s,' result.attacksPerSec=Math.min(4.2,result.attacksPerSec);result.power=power(result);\n return result;',
 ' result.attacksPerSec=Math.min(4.2,result.attacksPerSec);result.power=power(result);\n'+shadow+'\n return result;');
}
function capture(profile,seed,maxLevel=200){
 assert(PROFILES.includes(profile));const checkpoints=[];
 const a=N.simulateAccount(seed,profile,{...N.DEFAULTS,maxLevel,maxAttempts:12,maxTotalAttempts:400},{decisionModel:'adaptive',captureMode:'natural',moduleOverrides:{[FILE]:shadowSource()},onCamp:probe=>{
  if(probe.attempt!==1||!LEVELS.includes(probe.level))return;
  const snap=D.checkpoint(probe,[probe.level]);assert(snap);
  const stats=probe.a.baseStats();assert.equal(typeof stats.__nodeAudit,'function');
  const variants=Object.fromEntries(MODES.map(mode=>[mode,stats.__nodeAudit(mode)]));
  for(const [key,value] of Object.entries(variants.current.stats))assert(Math.abs(value-(stats[key]??0))<1e-8,'Native baseline mismatch '+key);
  const E=probe.level,ref=globalThis.WandererV012CombatCore.estimateEnemy(E);
  checkpoints.push({E,xp:snap.xp,points:snap.talentSpent,gearFingerprint:snap.fingerprint,weapon:snap.state.equip.weapon.subtype,stats:variants.current.stats,owned:variants.current.owned,preGraph:variants.current.base,variants:Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,v.stats])),incomingExample:Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,incoming(v.stats.defense,ref.atk)])),referenceEnemyAttack:ref.atk});
 }});
 const errors=a.attempts.filter(x=>x.error&&x.error!=='Native combat timeout');assert.equal(errors.length,0,JSON.stringify(errors.map(x=>x.error)));
 assert.equal(checkpoints[0]?.E,1);assert.equal(new Set(checkpoints.map(c=>c.E)).size,checkpoints.length);
 return {profile,seed,unlocked:a.endLevel,stopReason:a.stopReason,attempts:a.attempts.length,timeouts:a.attempts.filter(x=>x.error==='Native combat timeout').length,checkpoints};
}
function summary(accounts){
 const med=xs=>{const s=xs.filter(Number.isFinite).sort((a,b)=>a-b);return s.length?Number(((s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2).toFixed(3)):null;};
 return LEVELS.map(E=>{
  const a=accounts.flatMap(x=>x.checkpoints.filter(c=>c.E===E));
  const stats=Object.fromEntries(['attack','defense','maxhp','spellPower','evasionRating','mana','manaRegen','attacksPerSec'].map(k=>[k,med(a.map(c=>c.stats[k]))]));
  const gains=Object.fromEntries(MODES.slice(1).map(mode=>[mode,Object.fromEntries(Object.entries(FIELDS).map(([k,dest])=>{const relevant=a.filter(c=>c.owned[k]>0&&c.stats[dest]>0);return [dest,{n:relevant.length,medianPct:med(relevant.map(c=>100*(c.variants[mode][dest]/c.stats[dest]-1)))}];}))]));
  return {E,n:a.length,stats,defenseNodePct:med(a.filter(c=>c.stats.defense>0).map(c=>100*5/c.stats.defense)),gains};
 });
}
if(require.main===module){
 const mode=process.argv[2];
 if(mode==='cohort'){
  const p=process.argv[3],seed=Number(process.argv[4]),max=Number(process.argv[5]||200),a=capture(p,seed,max);
  fs.mkdirSync('reports/stage647d9a',{recursive:true});fs.writeFileSync('reports/stage647d9a/'+p+'-'+seed+'.json',JSON.stringify(a,null,2));console.log('AUDIT_ACCOUNT='+JSON.stringify({profile:p,seed,unlocked:a.unlocked,attempts:a.attempts,checkpoints:a.checkpoints.map(c=>({E:c.E,stats:c.stats,owned:c.owned}))}));
 }else if(mode==='aggregate'){
  const dir='reports/stage647d9a',accounts=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')));
  assert.equal(accounts.length,PROFILES.length);assert.equal(new Set(accounts.map(a=>a.profile)).size,PROFILES.length);
  const result={stage:'6.47D.9A',source:S.sourceFingerprint().sha256,inventory:inventory(),accounts:accounts.map(({checkpoints,...x})=>({...x,reached:checkpoints.map(c=>c.E)})),levels:summary(accounts)};
  fs.writeFileSync('reports/v013-stage647d9a-stat-scaling.json',JSON.stringify(result,null,2)+'\n');console.log('STAT_NODE_SCALING='+JSON.stringify(result));
 }else if(mode==='selftest'){
  assert.equal(T.NODES.length,419);assert.equal(T.NODES.filter(n=>n.kind==='stat').length,308);assert.equal(inventory().flatArmor,18);
  const n={flatArmor:3};assert.equal(delta(n,'flatArmor',100,'flat5-defense'),2);assert.equal(delta(n,'flatArmor',100,'percent-only'),0);assert.equal(delta(n,'flatArmor',100,'hybrid-low'),1.5);assert.equal(delta(n,'flatArmor',100,'hybrid-full'),3);
  new Function(shadowSource());console.log('STAT_NODE_SCALING_SELFTEST_OK');
 }else throw Error('Use selftest, cohort or aggregate');
}
module.exports={inventory,delta,incoming,shadowSource,capture,summary};
