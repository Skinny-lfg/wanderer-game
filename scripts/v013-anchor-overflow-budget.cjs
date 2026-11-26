'use strict';
// Research only: legal equal-budget 2x2 Cycle/Overflow talent comparison, four weapons.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
require('../combat/v012-runes.js');
const F=['blood','decay','radiance','aegis','fury','arcane'],ELITES=G.SC.filter(s=>s.kind==='elite').map(s=>s.elite),SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'],N=50,OUT='reports/anchor-overflow-budget';
const WEAPONS={twohand:['Two-Handed',null,'Plate'],staff:['Staff',null,'Cloth'],daggers:['Daggers','Off-Hand Dagger','Leather'],wand:['Wand','Tome','Cloth']};
const PROFILES=Object.keys(WEAPONS);
const B='combat/v012-buildcraft.js',C='combat/v012-combat-runtime.js',E='online/v012-expedition-runtime.js',O='online/v013-expedition-boons.js';
const originals=Object.fromEntries([B,C,E,O].map(p=>[p,fs.readFileSync(p,'utf8')]));
function replace(s,a,b){assert.equal(s.split(a).length,2,'source anchor '+a.slice(0,120));return s.replace(a,b);}
function overlay(mode){
 const src={...originals};let b=src[B];
 const change=(a,n)=>{b=replace(b,a,n);};
 const experimental=mode!=='base',persistent=mode==='persistent';
 // Only Rot spread changes, no new stacks, no changes to Burn, Bleed, Boons or damage multipliers.
 change("target.v012Rot.push({damage:d.damage*.65,remaining:specialized(b,'lingering_rot')?6:4,ticks:0,spread:true,secondaryOrigin:'contagious_touch'});","target.v012Rot.push({damage:"+(experimental?"d.damage":"d.damage*.65")+",remaining:specialized(b,'lingering_rot')?6:4,ticks:0,spread:true,secondaryOrigin:'contagious_touch'});c.metric?.('anchorSpreadContagiousTouch',1);c.metric?.('anchorSpreadContagiousTouchPotency',target.v012Rot.at(-1).damage);");
 change("function decayState(c){","function burstEligibleRot(d){return d?.remaining>0&&d.damage>0&&(primaryPaidRot(d)||d.spread===true||d.transferred===true); }\nfunction decayState(c){");
 if(experimental){
  assert.equal(b.split('.filter(primaryPaidRot)').length,3);
  b=b.replaceAll('.filter(primaryPaidRot)','.filter(burstEligibleRot)');
  change('corruptionOverflow(b,c);}',' }');
  change(' corruptionCycle(b,c);',' corruptionOverflow(b,c);\n corruptionCycle(b,c);');
 }
 // Keep paid origin flags intact. Only lifetime changes; no recursive spread or paid-action credit.
 if(persistent){
  change('remaining:primaryPaidRot(s)?s.remaining:s.remaining-1','remaining:burstEligibleRot(s)?s.remaining:s.remaining-1');
  change('rot.every(s=>!primaryPaidRot(s)&&s.remaining<=1)','rot.every(s=>!burstEligibleRot(s)&&s.remaining<=1)');
 }
 change("c.metric?.('corruptionOverflowActivations',1);","c.metric?.('anchorSpreadOverflowPrepared',stacks.filter(d=>!primaryPaidRot(d)).length);c.metric?.('corruptionOverflowActivations',1);");
 change("const remaining=consumed.reduce","c.metric?.('anchorSpreadCycleConsumed',consumed.filter(d=>!primaryPaidRot(d)).length);const remaining=consumed.reduce");
 // Observe prepared targets on actual attacks, not simulator click attempts.
 change("function onAttack(b,c){","const anchorSpreadLastAttack=new WeakMap();\nfunction onAttack(b,c){");
 change(" const e=c.enemy,base=Math.max(1,c.base||1),crit=!!c.critical;"," const e=c.enemy,base=Math.max(1,c.base||1),crit=!!c.critical;\n if(!c.offhand&&c.player){const previous=anchorSpreadLastAttack.get(c.player);if(previous&&previous!==e){const rot=(e.v012Rot||[]).filter(burstEligibleRot);c.metric?.('anchorSpreadAttackTargetChanges',1);c.metric?.('anchorSpreadStacksAtSwitch',rot.length);if(rot.length>=3)c.metric?.('anchorSpreadPreparedSwitches',1);}anchorSpreadLastAttack.set(c.player,e);}");
 change(" e.v012Rot=rot.map"," c.metric?.('anchorSpreadExpired',rot.filter(s=>s.spread&&s.remaining<=1"+(persistent?"&&!burstEligibleRot(s)":"")+").length);\n e.v012Rot=rot.map");
 src[B]=b;return src;
}
function candidate(double,shared){
 const src=overlay('persistent');let b=src[B];
 if(double){
  b=replace(b,"if(specialized(b,'corruption_cycle'))applyRot(b,c,potency,'paid_primary_cycle_extra');","applyRot(b,c,potency,'paid_primary_toxic_extra');");
  assert.equal(b.split('paid_primary_cycle_extra').length,3);
  b=b.replaceAll('paid_primary_cycle_extra','paid_primary_toxic_extra');
 }
 if(shared){
  const start=b.indexOf('function corruptionOverflow(b,c){'),end=b.indexOf('function rotWeaponBase(c){',start);
  assert(start>=0&&end>start,'Overflow function anchor');
  b=b.slice(0,start)+"function corruptionOverflow(b,c){\n if(!specialized(b,'corruption_nova')||!decayOwnAoE(b)||c.player.hp<=0||c.enemy.hp<=0)return;\n const source=c.enemy,stacks=(source.v012Rot||[]).filter(burstEligibleRot);\n if(stacks.length<3||(b.cooldowns.corruptionOverflow??-1e10)>c.now)return;\n const targets=decayTargets(c).filter(e=>e!==source&&(e.v012Rot||[]).some(d=>d.remaining>0&&d.damage>0)).slice(0,3);\n const before=c.player.mp;if(!spendDarkMana(c,6))return;\n ready(b,'corruptionOverflow',c.now,4);activated(b,'corruption_nova');\n c.metric?.('anchorSpreadOverflowPrepared',stacks.filter(d=>!primaryPaidRot(d)).length);\n c.metric?.('corruptionOverflowActivations',1);c.metric?.('corruptionOverflowMana',Math.max(0,before-c.player.mp));\n const raw=stacks.reduce((n,d)=>n+d.damage,0)*2,hp=source.hp;\n c.damage(raw,'☠ Corruption Overflow');\n const actual=Math.max(0,hp-Math.max(0,source.hp)),budget=Math.floor(actual);\n c.metric?.('anchorSpreadOverflowPrimary',actual);c.metric?.('corruptionOverflowDamage',actual);\n if(targets.length){\n  c.metric?.('anchorSpreadOverflowBudget',budget);\n  const per=Math.floor(budget/targets.length),rest=budget%targets.length;\n  for(const [i,target] of targets.entries()){\n   const share=per+(i<rest?1:0),amount=Math.min(share,target.maxhp*(target.boss?.01:target.miniboss?.02:.06));\n   if(!(amount>0))continue;\n   const dealt=c.talentPulseDamage?c.talentPulseDamage(target,amount,'corruption_nova'):c.secondaryHit?.(target,amount);\n   if(Number.isFinite(dealt)&&dealt>0){c.metric?.('anchorSpreadOverflowSecondary',dealt);c.metric?.('corruptionOverflowDamage',dealt);}\n   c.metric?.('corruptionOverflowTargets',1);\n  }\n  c.link?.('rot',source,targets);\n }\n}\n"+b.slice(end);
  b=replace(b," if(specialized(b,'corruption_nova')&&decayOwnAoE(b)&&decayTargets(c).some(x=>x!==e)&&stacks.length<6)return;","");
 }
 b=replace(b,'applyRot,rotguardRetaliate,','applyRot,corruptionOverflow,rotguardRetaliate,');
 src[B]=b;return src;
}
const variants={old:candidate(false,false),double:candidate(true,false),shared:candidate(false,true),both:candidate(true,true)};
const arms=[
 {id:'A',cycle:false,overflow:false,variant:'old',compare:'A'},
 {id:'A2',cycle:false,overflow:false,variant:'double',compare:'A'},
 {id:'B',cycle:true,overflow:false,variant:'old',compare:'B'},
 {id:'C',cycle:false,overflow:true,variant:'old',compare:'C'},
 {id:'C2',cycle:false,overflow:true,variant:'double',compare:'C'},
 {id:'Cnew',cycle:false,overflow:true,variant:'shared',compare:'C'},
 {id:'Cboth',cycle:false,overflow:true,variant:'both',compare:'C'},
 {id:'D',cycle:true,overflow:true,variant:'old',compare:'D'},
 {id:'Dnew',cycle:true,overflow:true,variant:'both',compare:'D'}
].map(a=>({...a,boon:false,rune:false}));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourceHashes=Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([p,s])=>[p,hash(s)]))]));
function cell(cohort,sc,i,arm){
 const p=cohort.configs[arm.id];
 const family=F[i%F.length],seed=65301001+i*101,kind=sc.startsWith('normal')?'normal':sc,size=kind==='normal'?Number(sc.slice(7)):undefined,elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,src=variants[arm.variant];
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,anchorRuneFixture:arm.rune?[{family:'corruption',tier:5,rarity:'Rare'}]:[],contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,stage648c1BuildcraftSource:src[B],stageArmorRuntimeSource:src[C],stage648b1ExpeditionSource:src[E],anchorSpreadResearch:true,anchorSpreadBoonSource:src[O],anchorSpreadBoon:arm.boon,...(elite?{stage619EliteType:elite}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,size);
 assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.controlledTalentNodes.includes('corruption_cycle'),arm.cycle);assert.equal(x.controlledTalentNodes.includes('corruption_nova'),arm.overflow);assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);if(!arm.cycle)assert.equal(x.decayTalentMetrics?.corruptionCycleActivations||0,0);if(!arm.overflow)assert.equal(x.decayTalentMetrics?.corruptionOverflowActivations||0,0);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);
 return {arm:arm.id,sc,i,seed,won:!!x.won,died:!!x.died,timeout:!!x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,periodic:x.affinityMetrics.dotDamageActual,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,heroBaseStats:x.heroBaseStats,paid:x.affinityMetrics.manaSpent,spread:x.anchorSpreadMetrics,decay:x.decayTalentMetrics,bloom:x.graveBloomMetrics,weapon:x.weaponStatusMetrics,match:{resolved:x.resolvedSeed,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId}};
}
function paired(p,sc,i){const rows=arms.map(a=>cell(p,sc,i,a));for(const r of rows.slice(1))assert.deepEqual(r.match,rows[0].match,p.id+'/'+sc+'/'+i+'/'+r.arm);return rows;}
const mean=(rs,fn)=>rs.length?rs.reduce((s,r)=>s+fn(r),0)/rs.length:null;
function stats(rs){const wins=rs.filter(r=>r.won),keys=[...new Set(rs.flatMap(r=>Object.keys(r.spread||{})))];return {n:rs.length,wins:wins.length,winPct:100*wins.length/rs.length,timeouts:rs.filter(r=>r.timeout).length,dps:mean(rs,r=>r.damage/Math.max(.11,r.seconds)),secondaryDps:mean(rs,r=>r.secondary/Math.max(.11,r.seconds)),secondaryDotDps:mean(rs,r=>r.secondaryDot/Math.max(.11,r.seconds)),periodicDps:mean(rs,r=>r.periodic/Math.max(.11,r.seconds)),winSeconds:mean(wins,r=>r.seconds),hpEndPct:mean(rs,r=>100*r.hpEnd/r.hpMax),manaEndPct:mean(rs.filter(r=>r.mpMax>0),r=>100*r.mpEnd/r.mpMax),spread:Object.fromEntries(keys.map(k=>[k,rs.reduce((s,r)=>s+(r.spread?.[k]||0),0)])),manaSpent:rs.reduce((n,r)=>n+(r.paid||0),0),cycleActivations:rs.reduce((n,r)=>n+(r.decay?.corruptionCycleActivations||0),0),cycleDamage:rs.reduce((n,r)=>n+(r.decay?.corruptionCycleDamage||0),0),overflowActivations:rs.reduce((n,r)=>n+(r.decay?.corruptionOverflowActivations||0),0),overflowDamage:rs.reduce((n,r)=>n+(r.decay?.corruptionOverflowDamage||0),0)};}
function summary(rows){const out={};for(const sc of ['all',...SC]){const rs=rows.filter(r=>sc==='all'||r.sc===sc);out[sc]={};for(const arm of arms){const selected=rs.filter(r=>r.arm===arm.id),base=rs.filter(r=>r.arm===arm.compare),m=stats(selected),b=stats(base),lookup=new Map(base.map(r=>[r.sc+'/'+r.i,r]));out[sc][arm.id]={...m,deltaWinPp:m.winPct-b.winPct,pairedGains:selected.filter(r=>r.won&&!lookup.get(r.sc+'/'+r.i).won).length,pairedLosses:selected.filter(r=>!r.won&&lookup.get(r.sc+'/'+r.i).won).length};}}return out;}
function write(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj)+'\n');}
function checkedProfile(id){
 assert(Object.hasOwn(WEAPONS,id));const [weapon,offhandType,armorType]=WEAPONS[id],configs={};
 const candidates=T.NODES.filter(n=>n.family==='decay'&&!n.pair&&!n.pending&&!n.advanced&&['stat','basic'].includes(n.kind)).sort((a,b)=>(a.kind==='stat'?0:1)-(b.kind==='stat'?0:1)||((a.tier||1)-(b.tier||1))||a.id.localeCompare(b.id));
 for(const arm of arms){
  const skills=['affinity_decay','toxic_touch','contagious_touch',...(arm.cycle?['corruption_cycle']:[]),...(arm.overflow?['corruption_nova']:[])];
  let t=buy(skills,{xp:30*T.POINT_XP});assert(t.nodes.length<=30,id+'/'+arm.id+' mandatory budget');
  // Same priority order in every arm. Excluded active/focused/extension nodes
  // cannot be acquired by filler; spend released points in legal supporting nodes.
  for(const skill of ['toxic_touch','virulent_rot']){
   while(t.nodes.length<30){const next=T.allocate(t,skill);if(!next)break;t=next;}
  }
  for(let pass=0;pass<30&&t.nodes.length<30;pass++){
   let changed=false;for(const n of candidates){if(t.nodes.length>=30)break;if(t.nodes.includes(n.id))continue;const next=T.allocate(t,n.id);if(next){t=next;changed=true;}}
   if(!changed)break;
  }
  for(let pass=0;pass<30&&t.nodes.length<30;pass++){
   let changed=false;for(const n of candidates.filter(n=>n.kind==='basic'&&n.maxRank>1)){if(t.nodes.length>=30)break;const next=T.allocate(t,n.id);if(next){t=next;changed=true;}}
   if(!changed)break;
  }
  assert(T.valid(t),id+'/'+arm.id+' invalid talents');assert.equal(t.nodes.length,30,id+'/'+arm.id+' point budget');
  for(const skill of skills)assert(t.nodes.includes(skill),id+'/'+arm.id+' missing '+skill);
  assert.deepEqual(t.nodes.filter(x=>x.startsWith('affinity_')),['affinity_decay']);
  assert.equal(t.nodes.includes('corruption_cycle'),arm.cycle);assert.equal(t.nodes.includes('corruption_nova'),arm.overflow);
  assert(!t.nodes.includes('plagueheart'),'uncontrolled focused effect');
  configs[arm.id]={id:'decay-factorial-'+id,families:['decay'],w:id,weapon,offhandType,armorType,t,skills};
 }
 for(const arm of arms)assert.deepEqual(configs[arm.id].t,configs[arm.compare].t,id+'/'+arm.id+' changed talent allocation within variant comparison');
 return {id,weapon,offhandType,armorType,configs};
}
function run(id){assert(PROFILES.includes(id));const p=checkedProfile(id),rows=[];for(const sc of SC)for(let i=0;i<N;i++)rows.push(...paired(p,sc,i));const report={id,n:rows.length,profile:p,source:S.sourceFingerprint().sha256,sourceHashes,arms,summary:summary(rows),rows};write(id+'.json',report);console.log('ANCHOR_OVERFLOW_BUDGET='+JSON.stringify({id,n:rows.length,summary:report.summary}));}
function smoke(){
 for(const src of Object.values(variants))for(const code of Object.values(src))new Function(code);
 const native=key=>{const root={WandererAutomaticTalents:T};new Function('globalThis','module',variants[key][B])(root,undefined);return root.WandererV012Buildcraft;};
 function fixture(api,skills,count=3,targetCount=0,infected=true,mainHp=100000){
  const b=api.create();api.syncPermanent(b,buy(skills));
  const enemy=(hp,n)=>({hp,maxhp:100000,v012Rot:Array.from({length:n},()=>({damage:100,remaining:4,spread:true})),dots:{bleed:[],burn:[]}});
  const e=enemy(mainHp,count),others=Array.from({length:targetCount},()=>enemy(100000,infected?1:0)),r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:[e,...others],stats:{attack:100,spellPower:50,attacksPerSec:1}},m={};
  const c={player:r,enemy:e,now:1,base:100,power:50,random:()=>.999999,waveKey:'budget',log(){},dot(){},damage(n){e.hp-=n;},talentPulseDamage(target,n){target.hp-=n;return n;},dotDamage(n){e.hp-=n;},metric(k,n){m[k]=(m[k]||0)+n;},heal(){return 0;},barrier(){},mana(n){r.mp+=n;}};
  return {b,e,others,r,m,c};
 }
 for(const key of ['shared','both']){
  const api=native(key);
  for(const targetCount of [0,1,2,3]){
   const {b,e,others,r,m,c}=fixture(api,['corruption_nova'],3,targetCount);
   api.corruptionOverflow(b,c);
   assert.equal(e.hp,99400);assert.equal(r.mp,94);assert.equal(e.v012Rot.length,3);assert.equal(m.anchorSpreadOverflowPrimary,600);
   assert.equal(m.anchorSpreadOverflowSecondary||0,targetCount?600:0);
   for(const other of others)assert.equal(other.hp,100000-600/targetCount);
   api.corruptionOverflow(b,c);assert.equal(r.mp,94,'cooldown prevents repeated payment');
  }
  const f=fixture(api,['corruption_nova'],3,3,true,101);api.corruptionOverflow(f.b,f.c);
  assert.equal(f.m.anchorSpreadOverflowPrimary,101);assert.equal(f.m.anchorSpreadOverflowSecondary,101);assert.deepEqual(f.others.map(e=>100000-e.hp),[34,34,33]);
  const g=fixture(api,['corruption_nova'],3,3,false);api.corruptionOverflow(g.b,g.c);assert.equal(g.m.anchorSpreadOverflowSecondary||0,0);
  const h=fixture(api,['corruption_nova','corruption_cycle'],3,1);api.onAttack(h.b,h.c);
  assert.equal(h.m.corruptionOverflowActivations,1);assert.equal(h.m.corruptionCycleActivations,1);assert.equal(h.e.v012Rot.length,0);assert.equal(h.r.mp,84);
 }
 for(const key of ['old','double','shared','both']){
  const api=native(key);
  for(const cycle of [false,true]){
   const f=fixture(api,['affinity_decay','toxic_touch',...(cycle?['corruption_cycle']:[])],0);
   f.c.random=()=>0;api.onAttack(f.b,f.c);
   const expected=cycle||['double','both'].includes(key)?2:1;
   assert.equal(f.e.v012Rot.length,expected,key+'/'+cycle+' stack count');
   assert.equal(f.m.decayPrimaryPaidApplications,1);assert.equal(f.m.decayPrimaryPaidExtraStacks||0,expected-1);assert.equal(f.r.mp,96);
  }
 }
 for(const id of PROFILES){
  const p=checkedProfile(id);
  console.log('DECAY_OVERFLOW_BUDGET_BUILDS='+JSON.stringify({id,configs:Object.fromEntries(Object.entries(p.configs).map(([k,v])=>[k,v.t.nodes]))}));
  for(const sc of ['normal-1','normal-4','elite','boss'])paired(p,sc,0);
 }
 console.log('ANCHOR_OVERFLOW_BUDGET_SMOKE_OK');
}
function aggregate(){const reports=PROFILES.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));let n=0;for(const r of reports){assert.equal(r.n,SC.length*N*arms.length);assert.deepEqual(r.sourceHashes,sourceHashes);n+=r.n;}assert.equal(new Set(reports.map(r=>r.source)).size,1);const report={n,profiles:Object.fromEntries(reports.map(r=>[r.id,{profile:r.profile,summary:r.summary}])),arms,sourceHashes,source:reports[0].source,notes:['Native runtime with research-only source overlays. E10 30 points Rare gear; 50 seeds per scenario; boss and elite variants rotate. No runes or Boons. All arms use validated experimental persistent 100% Contagious Touch and burst eligibility. A/A2 isolate base double stack with neither ability, B Cycle reference. C/C2/Cnew/Cboth isolate double stack vs shared Overflow vs both, without Cycle. D/Dnew compare old hybrid with both changes. Shared Overflow needs three stacks, 6 Mana, 4s cooldown, two equivalent Rot ticks to the main target; distributes actual main HP damage among up to three infected secondaries (integer allocation, prior class caps, native target modifiers). No stack consumption. Cycle no longer waits for six stacks. Primary/secondary/budget metrics reported separately; old total Overflow damage is secondary only. Real legal 30-point talent allocations with deterministic shared filler priority; supporting stats and prerequisite costs can differ, so this is a build-level comparison, not a same-stats skill toggle. Within each weapon matched seeds, gear and enemy roster asserted. Weapon and armor differ across cohorts. Mechanical target policy unchanged. No production balance change.']};write('summary.json',report);console.log('ANCHOR_OVERFLOW_BUDGET_OVERVIEW='+JSON.stringify({n,profiles:Object.fromEntries(reports.map(r=>[r.id,Object.fromEntries(Object.entries(r.summary).map(([sc,m])=>[sc,Object.fromEntries(Object.entries(m).map(([id,v])=>[id,{n:v.n,win:v.winPct,delta:v.deltaWinPp,aoe:v.secondaryDps,periodic:v.periodicDps,spread:v.spread,dps:v.dps,winSeconds:v.winSeconds,cycleActivations:v.cycleActivations,cycleDamage:v.cycleDamage,overflowActivations:v.overflowActivations,overflowDamage:v.overflowDamage,manaSpent:v.manaSpent,hpEndPct:v.hpEndPct,manaEndPct:v.manaEndPct,pairedGains:v.pairedGains,pairedLosses:v.pairedLosses}]))]))]))}));}
if(require.main===module){const arg=process.argv[2];if(arg==='smoke')smoke();else if(arg==='aggregate')aggregate();else run(arg);}
