'use strict';
// B4: first/max marginal purchase, fixed native E10 fixture, optional equal-cost stat choice.
// No gameplay or agent mutation. Missing telemetry is unknown, not zero activation.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const BASE='c8d2b1a6898aed6aaf7e0727f9cced112eb607a0',OUT='reports/b4',sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');

const FAMILIES=['blood','fury','radiance','aegis','arcane','decay'],POINTS=30,SEEDS=4;
const all=T.NODES,byId=new Map(all.map(n=>[n.id,n])),baseId=id=>id.replace(/_rank\d+$/,'');
const rank=(v,id)=>v.nodes.filter(x=>baseId(x)===id).length;
const skills=all.filter(n=>!n.pending&&!['stat','affinity','choice'].includes(n.kind));
function ensure(v,id,stack=[]){
 if(v.nodes.includes(id))return v;
 if(stack.includes(id))return null;
 const n=byId.get(id);if(!n||n.pending)return null;
 const nextStack=[...stack,id];let x=v;
 for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean)){x=ensure(x,dep,nextStack);if(!x)return null;}
 if(n.anyRequires?.length&&!n.anyRequires.some(k=>x.nodes.includes(k))){
  const choices=n.anyRequires.map(k=>ensure(x,k,nextStack)).filter(Boolean).sort((a,b)=>a.nodes.length-b.nodes.length||a.nodes.join(',').localeCompare(b.nodes.join(',')));
  if(!choices.length)return null;x=choices[0];
 }
 return T.allocate(x,id);
}
const support={
 blood:['bleeding_edge','blood_drinker','deep_cuts'],
 fury:['quick_hands','precision','double_strike'],
 radiance:['renewal','strong_heart','life_bloom'],
 aegis:['barrier_pulse','guarded_block','iron_skin'],
 arcane:['arcane_focus','mana_spring','efficient_cast'],
 decay:['corrupting_touch','virulent_rot','corruption_cycle']
};
function kit(n){
 if(n.id==='cleave_mastery'||n.id==='single_target_mastery'||n.id==='septic_wound'||n.id==='carrion_detonation')return ['Two-Handed',null,'Plate'];
 if(n.id==='bow_pierce')return ['Bow',null,'Leather'];
 if(n.id==='sword_sweep')return ['Sword','Shield','Plate'];
 if(n.id==='mace_shockwave')return ['Mace','Shield','Plate'];
 if(n.id==='arcane_bastion'||n.id==='runic_shield'||n.id==='prismatic_rebound'||n.id==='ward_echo')return ['Wand','Orb','Cloth'];
 if(n.family==='arcane'||n.family==='decay'&&!n.pair)return ['Wand','Tome','Cloth'];
 if(n.family==='aegis')return ['Sword','Shield','Plate'];
 if(n.family==='radiance'||n.pair?.includes('radiance'))return ['Mace','Shield','Plate'];
 return ['Daggers','Off-Hand Dagger','Leather'];
}
function make(n,r){
 const families=n.pair||[n.family],mode=n.element||'arcane';
 let v={...T.create(),xp:POINTS*T.POINT_XP,...(mode==='arcane'?{}:{element:mode})};
 for(const f of families){v=ensure(v,'affinity_'+f);if(!v)throw Error('Missing affinity route '+n.id);}
 if(families.includes('arcane')){v=ensure(v,'element_choice');if(!v)throw Error('Missing attunement '+n.id);}
 v=ensure(v,n.id);if(!v)throw Error('Missing legal acquisition '+n.id);
 const firstCost=v.nodes.length;
 for(let i=1;i<r;i++){v=T.allocate(v,n.id);if(!v)throw Error('Rank outside E10 budget '+n.id+'/'+r);}
 const target=v.nodes.at(-1);if(baseId(target)!==n.id||rank(v,n.id)!==r)throw Error('Target is not last '+n.id);
 let before={...v,nodes:v.nodes.slice(0,-1)};
 if(!T.valid(before))throw Error('Invalid baseline '+n.id);
 const minPath=before.nodes.length+1;
 const legalNodes=all.filter(k=>families.includes(k.family)&&!k.pending&&(!k.element||k.element===mode)&&(!k.pair||k.pair.every(f=>families.includes(f)))&&!['affinity','choice'].includes(k.kind)&&!k.advanced&&k.id!==n.id);
 const extra=[...families.flatMap(f=>support[f]),...({fire:['kindling'],frost:['deep_winter'],lightning:['overcharge'],arcane:['arcane_resonance']}[mode]||[])];
 for(const id of extra){
  const k=byId.get(id);if(!k||id===n.id||!families.includes(k.family)||!families.includes('arcane')&&k.family==='arcane')continue;
  const z=ensure(before,id);if(z&&z.nodes.length<POINTS&&rank(z,n.id)===r-1)before=z;
 }
 const fill=legalNodes.slice().sort((a,b)=>Number(a.kind!=='stat')-Number(b.kind!=='stat')||(a.tier||0)-(b.tier||0)||a.id.localeCompare(b.id));
 while(before.nodes.length<POINTS-1){
  let changed=false;
  for(const k of fill){
   if(before.nodes.length>=POINTS-1)break;
   if(before.nodes.includes(k.id))continue;
   const z=T.allocate(before,k.id);
   if(z&&z.nodes.length===before.nodes.length+1&&rank(z,n.id)===r-1){before=z;changed=true;}
  }
  if(!changed){
   for(const k of fill){
    if(before.nodes.length>=POINTS-1)break;
    const z=T.allocate(before,k.id);
    if(z&&z.nodes.length===before.nodes.length+1&&rank(z,n.id)===r-1){before=z;changed=true;}
   }
  }
  if(!changed)throw Error('Insufficient independent E10 fillers '+n.id+'/'+r);
 }
 let after=T.allocate(before,n.id);if(!after||after.nodes.length!==POINTS||rank(after,n.id)!==r)throw Error('Target allocation failed '+n.id);
 if(n.advanced)after={...after,prepared:n.id};
 if(!T.valid(after)||!T.valid(before))throw Error('Illegal state '+n.id);
 const alternatives=legalNodes.filter(k=>k.kind==='stat'&&k.family===n.family&&!before.nodes.includes(k.id)).sort((a,b)=>Math.abs((a.tier||1)-(n.tier||1))-Math.abs((b.tier||1)-(n.tier||1))||a.id.localeCompare(b.id));
 let alternative=null,alternativeId=null;
 for(const k of alternatives){const z=T.allocate(before,k.id);if(z&&z.nodes.length===POINTS){alternative=z;alternativeId=k.id;break;}}
 const [weapon,offhand,armor]=kit(n);
 return {id:n.id,name:n.name,description:n.description,kind:n.kind,family:n.family,families,mode,rank:r,maxRank:n.maxRank||1,firstCost,minPath,advanced:!!n.advanced,weapon,offhand,armor,alternativeId,before,after,alternative};
}
function inventory(){return {totalNodes:all.length,skills:skills.map(n=>({id:n.id,name:n.name,kind:n.kind,family:n.family,pair:n.pair||null,element:n.element||null,description:n.description,maxRank:n.maxRank||1,prerequisites:[n.requires,...(n.prerequisites||[])].filter(Boolean),anyRequires:n.anyRequires||[],passiveId:n.passiveId||null,effectId:n.effectId||null,advanced:!!n.advanced})),excluded:all.filter(n=>n.pending||['affinity','choice'].includes(n.kind)).map(n=>({id:n.id,kind:n.kind,pending:!!n.pending,description:n.description}))};}
function plan(){const cases=[],blocked=[];for(const n of skills){for(const r of [...new Set([1,n.maxRank||1])]){try{cases.push(make(n,r));}catch(e){blocked.push({id:n.id,rank:r,reason:String(e.message||e)});}}}return {inventory:inventory(),cases,blocked};}


const SC=[{id:'solo',kind:'normal',size:1},{id:'group12',kind:'normal',size:12},{id:'elite',kind:'elite',elite:'tank'},{id:'boss',kind:'boss'}];
const number=x=>Number(x)||0,mean=(a,f)=>a.length?a.reduce((s,x)=>s+f(x),0)/a.length:null;
const strip=it=>{if(!it)return null;const {id,...rest}=it;return rest;};
function fixed(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','economy','online','index.html','docs','scripts/simulate-progression.cjs','scripts/v013-natural-progression.cjs','scripts/v013-b32d7-combat-aware-policy.cjs','scripts/v013-b32c-equipment-policy.cjs'],{encoding:'utf8'}).trim(),'','Gameplay or agent drift');
 const p=plan();assert.equal(p.blocked.length,0,JSON.stringify(p.blocked));assert.equal(p.inventory.skills.length,new Set(p.cases.map(c=>c.id)).size);return p;
}
function cell(c,sc,i,arm){
 const t=c[arm],seed=123800001+i*131, family=FAMILIES[(i+SC.indexOf(sc))%FAMILIES.length];
 assert(T.valid(t));let runtime=null;
 const build={id:'b4-'+c.id,weapon:c.weapon,families:c.families,skills:[],...(c.mode==='arcane'?{}:{element:c.mode})};
 const opts={mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:t,armorType:c.armor,offhandType:c.offhand,stageB31ALoadout:c.weapon,stageB31EquipmentAudit:true,recordModules:es=>{runtime=es.find(e=>e.file==='combat/v012-combat-runtime.js');},...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const x=S.encounter(10,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert(runtime&&!runtime.overridden,'Non-native runtime');assert.equal(runtime.sha256,sha(fs.readFileSync('combat/v012-combat-runtime.js','utf8')));
 assert.equal(x.level,10);assert.equal(x.pointsSpent,t.nodes.length);assert.equal(x.talentXp,t.xp);assert.deepEqual(x.controlledTalentNodes,t.nodes);
 assert.equal(x.weaponType,c.weapon);assert.equal(x.offhandType,c.offhand);assert.equal(x.armorType,c.armor);assert.equal(x.affinity,family);assert.equal(Number(x.won)+Number(x.died)+Number(x.timedOut),1);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.kind==='boss')assert.equal(x.bossAffinity,family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const gear=sha(Object.keys(x.equipmentAudit).sort().map(k=>[k,strip(x.equipmentAudit[k])]));
 const scenario=sha([x.resolvedSeed,x.affinity,x.risk,x.roster,x.initialRoles,x.traitId,x.conditionId,x.conditionMarked,x.bossModifierIds,x.eliteType,x.bossId]);
 const m=x.affinityMetrics||{},active=m.passiveActivations||{}, telemetry={...x.magicAdaptiveMetrics,...x.decayTalentMetrics,...x.defensiveTalentMetrics,...x.graveBloomMetrics,...x.weaponStatusMetrics};
 return {arm,seed,gear,scenario,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,hp:x.hpEnd,maxHp:x.hpMax,mp:x.mpEnd,maxMp:x.mpMax,healing:m.healingActual,barrier:m.barrierGenerated,absorbed:x.absorbed,starved:m.manaStarvedSeconds,paid:x.manaSpent,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,dot:m.dotDamageActual,aoe:x.secondaryTargetDamage,firstKill:x.firstKillSeconds,stats:x.heroBaseStats,active,telemetry};
}
function runCase(c,scs=SC,seeds=SEEDS){
 const rows=[];
 for(const sc of scs)for(let i=0;i<seeds;i++){
  const before=cell(c,sc,i,'before'),after=cell(c,sc,i,'after'),alternative=c.alternative?cell(c,sc,i,'alternative'):null;
  for(const z of [after,alternative].filter(Boolean)){assert.equal(before.gear,z.gear,'Gear mismatch '+c.id);assert.equal(before.scenario,z.scenario,'Opponent mismatch '+c.id);}
  rows.push({sc:sc.id,trial:i,before,after,alternative});
 }
 return {case:c,rows};
}
function summarize(rs,arm){
 const xs=rs.map(r=>r[arm]).filter(Boolean),valid=xs.filter(x=>!x.timeout);
 const avg=k=>mean(valid,x=>number(x[k]));
 return {n:xs.length,timeout:xs.length-valid.length,wins:valid.filter(x=>x.won).length,winPct:valid.length?100*valid.filter(x=>x.won).length/valid.length:null,dps:mean(valid,x=>x.seconds?x.damage/x.seconds:0),winSeconds:mean(valid.filter(x=>x.won),x=>x.seconds),hpPct:mean(valid,x=>100*x.hp/Math.max(1,x.maxHp)),manaPct:mean(valid.filter(x=>x.maxMp>0),x=>100*x.mp/x.maxMp),healing:avg('healing'),barrier:avg('barrier'),absorbed:avg('absorbed'),dot:avg('dot'),aoe:avg('aoe'),paid:avg('paid'),funded:avg('funded'),unfunded:avg('unfunded'),starved:avg('starved'),passiveActivations:sumMaps(valid.map(x=>x.active)),runtimeTelemetry:sumMaps(valid.map(x=>x.telemetry))};
}
function sumMaps(maps){const out={};for(const m of maps)for(const [k,v] of Object.entries(m||{}))if(Number.isFinite(v))out[k]=(out[k]||0)+v;return out;}
function pair(rows,a,b){let gains=0,losses=0,unresolved=0,n=0;for(const r of rows){const x=r[a],y=r[b];if(!x||!y)continue;if(x.timeout||y.timeout){unresolved++;continue;}n++;if(y.won&&!x.won)gains++;if(x.won&&!y.won)losses++;}return {n,gains,losses,unresolved,deltaPP:n?100*(gains-losses)/n:null};}
function brief(x){const c=x.case,rs=x.rows;return {id:c.id,name:c.name,rank:c.rank,family:c.family,mode:c.mode,kind:c.kind,advanced:c.advanced,firstCost:c.firstCost,minPath:c.minPath,kit:[c.weapon,c.offhand,c.armor],alternativeId:c.alternativeId,before:summarize(rs,'before'),after:summarize(rs,'after'),alternative:c.alternative?summarize(rs,'alternative'):null,paired:pair(rs,'before','after'),equalCost:c.alternative?pair(rs,'alternative','after'):null,scenarios:SC.map(sc=>{const s=rs.filter(r=>r.sc===sc.id);return {id:sc.id,before:summarize(s,'before'),after:summarize(s,'after'),paired:pair(s,'before','after'),equalCost:c.alternative?pair(s,'alternative','after'):null};})};}
function write(file,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+file+'.json',JSON.stringify(obj));}
function run(family,band){const p=fixed(),selected=p.cases.filter(c=>c.family===family&&(band==='first'?c.rank===1:c.rank>1));assert(selected.length>0);const results=selected.map(c=>runCase(c));write(family+'-'+band,{commit:process.env.GITHUB_SHA,source:S.sourceFingerprint().sha256,family,band,results});console.log('B4_SHARD='+JSON.stringify({family,band,cases:results.length,pairs:results.reduce((s,x)=>s+x.rows.length,0),timeouts:results.reduce((s,x)=>s+x.rows.reduce((t,r)=>t+[r.before,r.after,r.alternative].filter(z=>z?.timeout).length,0),0)}));}
function aggregate(){
 const p=fixed(),shards=FAMILIES.flatMap(f=>['first','max'].map(b=>JSON.parse(fs.readFileSync(OUT+'/'+f+'-'+b+'.json','utf8'))));assert.equal(new Set(shards.map(x=>x.source)).size,1);for(const x of shards)assert.equal(x.commit,process.env.GITHUB_SHA);
 const results=shards.flatMap(x=>x.results),key=c=>c.id+'/'+c.rank;assert.deepEqual(results.map(x=>key(x.case)).sort(),p.cases.map(key).sort());for(const x of results){assert.equal(x.rows.length,SC.length*SEEDS);assert.deepEqual(x.case,p.cases.find(c=>key(c)===key(x.case)));}
 const rows=results.flatMap(x=>x.rows),report={baseline:BASE,commit:process.env.GITHUB_SHA,source:shards[0].source,inventory:p.inventory,blocked:p.blocked,cases:results.length,uniqueSkills:p.inventory.skills.length,pairs:rows.length,fights:rows.reduce((s,r)=>s+2+Number(!!r.alternative),0),timeouts:rows.reduce((s,r)=>s+[r.before,r.after,r.alternative].filter(x=>x?.timeout).length,0),seedsPerScenario:SEEDS,scope:'Exploratory legal purchase marginal vs one unspent point; equal-cost comparison to one available same-family stat if present. First/max rank, not intermediate ranks; advanced measures purchase plus preparation. Fixed E10 Rare gear, four matchups, four seeds. Other skills and build retained within each case; cross-case context differs. Intrinsic affinity bundles and attunement inventoried, not isolated. Missing activation counters are not evidence of failure. No universal ability rank, no natural targets, no gameplay tuning.',results:results.map(brief)};
 write('summary',report);console.log('B4_OVERVIEW='+JSON.stringify({...report,inventory:undefined,results:undefined}));for(const x of report.results)console.log('B4_ABILITY='+JSON.stringify({id:x.id,rank:x.rank,family:x.family,paired:x.paired,equalCost:x.equalCost,before:{dps:x.before.dps,hp:x.before.hpPct},after:{dps:x.after.dps,hp:x.after.hpPct,activations:x.after.passiveActivations}}));
 // Preserve all timeouts in artifacts; the quality gate is not unconditional when unresolved.
 if(report.timeouts)process.exitCode=1;
}
const [cmd,f,b]=process.argv.slice(2);
if(cmd==='plan'){const p=fixed();write('plan',p);console.log('B4_PLAN='+JSON.stringify({skills:p.inventory.skills.length,cases:p.cases.length,blocked:p.blocked,alternatives:p.cases.filter(c=>c.alternative).length}));}
else if(cmd==='smoke'){const p=fixed(),ids=['bleeding_edge','double_strike','vital_pulse','guarded_block','controlled_burn','corruption_cycle','red_guillotine'];const results=ids.map(id=>runCase(p.cases.find(c=>c.id===id&&c.rank===1),[SC[1]],1));write('smoke',results);assert(results.every(x=>x.rows.every(r=>!r.before.timeout&&!r.after.timeout&&!r.alternative?.timeout)));console.log('B4_SMOKE='+JSON.stringify({cases:results.length,pairs:results.reduce((s,x)=>s+x.rows.length,0)}));}
else if(cmd==='run')run(f,b);else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
