'use strict';
// Research only: integrated independent Rot sources and isolated calibration candidates.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
require('../combat/v012-runes.js');
const F=['blood','decay','radiance','aegis','fury','arcane'],ELITES=G.SC.filter(s=>s.kind==='elite').map(s=>s.elite),SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'],N=50,OUT='reports/anchor-decay-integrated';
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
function independent({cycle=false,shared=false,overflowSeed=false,blightSeed=false}={}){
 const src=candidate(false,shared);let b=src[B];
 // All new direct skill stacks carry their own provenance; they are persistent,
 // snapshot native Rot potency, and NEVER earn Corrupting Touch action credit.
 b=replace(b,"const primary=origin==='paid_primary_corrupting_touch'||origin==='paid_primary_cycle_extra';","const primary=origin==='paid_primary_corrupting_touch'||origin==='paid_primary_cycle_extra',ability=typeof origin==='string'&&origin.startsWith('ability_');");
 b=replace(b,"primary||origin==='weapon'||origin==='rotguard'?","primary||ability||origin==='weapon'||origin==='rotguard'?");
 b=replace(b,"remaining:primary?4:","remaining:primary||ability?4:");
 b=replace(b,"...(primary?{primaryPaid:true}:{}),","...(primary?{primaryPaid:true}:{}),...(ability?{abilityOrigin:origin}:{}),");
 b=replace(b," stacks.push(d);"," stacks.push(d);if(ability)c.metric?.('anchorSpreadSource_'+origin,1);");
 b=replace(b,"||d.transferred===true); }","||d.transferred===true||!!d.abilityOrigin); }");
 if(cycle){
  b=replace(b,"if(specialized(b,'corruption_cycle'))applyRot(b,c,potency,'paid_primary_cycle_extra');","");
  const a=b.indexOf('function corruptionCycle(b,c){'),z=b.indexOf('\nfunction ',a+1);assert(a>=0&&z>a);
  b=b.slice(0,a)+"function corruptionCycle(b,c){\n if(!specialized(b,'corruption_cycle')||c.enemy.hp<=0||c.player.hp<=0||(b.cooldowns.corruptionCycle??-1e10)>c.now)return;\n const before=c.player.mp;if(!spendDarkMana(c,10))return;\n const e=c.enemy,stats=c.player.stats||{},speed=Math.max(.01,Number(stats.attacksPerSec)||.7),cd=Math.max(2.5,Math.min(10,3.5/speed));\n ready(b,'corruptionCycle',c.now,cd);activated(b,'corruption_cycle');\n c.metric?.('anchorSpreadCycleCasts',1);c.metric?.('corruptionCycleMana',Math.max(0,before-c.player.mp));\n for(let i=0;i<2;i++)applyRot(b,c,rotPotency(c),'ability_cycle');\n const stacks=(e.v012Rot||[]).filter(burstEligibleRot);\n if(stacks.length<3){c.metric?.('anchorSpreadCycleSeedOnly',1);return;}\n const consumed=stacks.slice(0,3),remove=new Set(consumed);e.v012Rot=e.v012Rot.filter(d=>!remove.has(d));\n c.metric?.('anchorSpreadCycleConsumed',consumed.filter(d=>d.spread||d.transferred).length);\n const remaining=consumed.reduce((n,d)=>n+d.damage*6,0),raw=remaining+.2*Math.max(0,Number(stats.attack??c.base)||0)+.2*Math.max(0,Number(stats.spellPower??c.power)||0),hp=e.hp;\n c.damage(raw,'🦠 Corruption Cycle');\n c.metric?.('corruptionCycleActivations',1);c.metric?.('corruptionCycleConsumedRawRot',remaining);c.metric?.('corruptionCycleRawBurst',raw);c.metric?.('corruptionCycleDamage',Math.max(0,hp-Math.max(0,e.hp)));c.metric?.('corruptionCycleStacksConsumed',consumed.length);\n}\n"+b.slice(z);
 }
 if(overflowSeed){
  assert(shared);
  b=replace(b,"const source=c.enemy,stacks=(source.v012Rot||[]).filter(burstEligibleRot);\n if(stacks.length<3||(b.cooldowns.corruptionOverflow??-1e10)>c.now)return;","const source=c.enemy;\n if((b.cooldowns.corruptionOverflow??-1e10)>c.now)return;");
  b=replace(b,"ready(b,'corruptionOverflow',c.now,4);activated(b,'corruption_nova');","ready(b,'corruptionOverflow',c.now,4);activated(b,'corruption_nova');c.metric?.('anchorSpreadOverflowCasts',1);applyRot(b,c,rotPotency(c),'ability_overflow');const stacks=(source.v012Rot||[]).filter(burstEligibleRot);if(stacks.length<3){c.metric?.('anchorSpreadOverflowSeedOnly',1);c.metric?.('corruptionOverflowMana',Math.max(0,before-c.player.mp));return;}");
 }
 if(blightSeed){
  b=replace(b,"if(e.hp>0&&rank(b,'blightburst')&&e.v012Rot?.length&&(b.cooldowns.blightburst??-1e10)<=c.now&&spendDarkMana(c,8)&&ready(b,'blightburst',c.now,7)&&activated(b,'blightburst'))c.damage(Math.min(base*.38+Math.max(0,c.power||0)*.35,e.maxhp*.025),'☠ Blight');","if(e.hp>0&&rank(b,'blightburst')&&(b.cooldowns.blightburst??-1e10)<=c.now&&spendDarkMana(c,8)&&ready(b,'blightburst',c.now,7)&&activated(b,'blightburst')){applyRot(b,c,rotPotency(c),'ability_blightburst');c.damage(Math.min(base*.38+Math.max(0,c.power||0)*.35,e.maxhp*.025),'☠ Blight');}");
 }
 src[B]=b;return src;
}
function integrated({rotScale=1,burstScale=1}={}){
 const src=independent({cycle:true,shared:true,overflowSeed:true,blightSeed:true});
 let b=src[B];
 if(rotScale!==1)b=replace(b,'function rotPotency(c){return .04*(rotWeaponBase(c)+Math.max(0,Number(c.player?.stats?.spellPower??c.power)||0));}','function rotPotency(c){return '+(.04*rotScale)+'*(rotWeaponBase(c)+Math.max(0,Number(c.player?.stats?.spellPower??c.power)||0));}');
 if(burstScale!==1){
  b=replace(b,'const remaining=consumed.reduce((n,d)=>n+d.damage*6,0),raw=remaining+.2*Math.max(0,Number(stats.attack??c.base)||0)+.2*Math.max(0,Number(stats.spellPower??c.power)||0),hp=e.hp;','const remaining=consumed.reduce((n,d)=>n+d.damage*6,0),raw=(remaining+.2*Math.max(0,Number(stats.attack??c.base)||0)+.2*Math.max(0,Number(stats.spellPower??c.power)||0))*'+burstScale+',hp=e.hp;');
  b=replace(b,'const raw=stacks.reduce((n,d)=>n+d.damage,0)*2,hp=source.hp;','const raw=stacks.reduce((n,d)=>n+d.damage,0)*'+(2*burstScale)+',hp=source.hp;');
 }
 src[B]=b;return src;
}
const variants={
 old:candidate(false,false),
 cycle:independent({cycle:true}),
 overflow:independent({shared:true,overflowSeed:true}),
 hybridSeed:independent({cycle:true,shared:true,overflowSeed:true}),
 full:integrated(),
 rot85:integrated({rotScale:.85}),
 burst75:integrated({burstScale:.75}),
 combined:integrated({rotScale:.85,burstScale:.75})
};
const arms=[
 {id:'Aref',cycle:false,overflow:false,variant:'old',compare:'Aref'},
 {id:'Afull',cycle:false,overflow:false,variant:'full',compare:'Aref'},
 {id:'Arot85',cycle:false,overflow:false,variant:'rot85',compare:'Afull'},
 ...[
  ['B',true,false,'cycle'],
  ['C',false,true,'overflow'],
  ['D',true,true,'hybridSeed']
 ].flatMap(([id,cycle,overflow,reference])=>[
  {id:id+'ref',cycle,overflow,variant:reference,compare:id+'ref'},
  {id:id+'full',cycle,overflow,variant:'full',compare:id+'ref'},
  {id:id+'rot85',cycle,overflow,variant:'rot85',compare:id+'full'},
  {id:id+'burst75',cycle,overflow,variant:'burst75',compare:id+'full'},
  {id:id+'combined',cycle,overflow,variant:'combined',compare:id+'full'}
 ])
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
  const skills=['affinity_decay','corrupting_touch','contagious_touch','blightburst',...(arm.cycle?['corruption_cycle']:[]),...(arm.overflow?['corruption_nova']:[])];
  let t=buy(skills,{xp:30*T.POINT_XP});assert(t.nodes.length<=30,id+'/'+arm.id+' mandatory budget');
  // Same priority order in every arm. Excluded active/focused/extension nodes
  // cannot be acquired by filler; spend released points in legal supporting nodes.
  for(const skill of ['corrupting_touch','virulent_rot']){
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
function run(id){assert(PROFILES.includes(id));const p=checkedProfile(id),rows=[];for(const sc of SC)for(let i=0;i<N;i++)rows.push(...paired(p,sc,i));const report={id,n:rows.length,profile:p,source:S.sourceFingerprint().sha256,sourceHashes,arms,summary:summary(rows),rows};write(id+'.json',report);console.log('ANCHOR_DECAY_INTEGRATED='+JSON.stringify({id,n:rows.length,summary:report.summary}));}
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

 for(const key of ['full','rot85','burst75','combined']){
  const api=native(key);
  // Independent abilities: no Corrupting Touch, no free paid credits.
  const f=fixture(api,['corruption_cycle','corruption_nova','blightburst'],0);
  api.onAttack(f.b,f.c);
  assert.equal(f.r.mp,76);
  assert.equal(f.m.anchorSpreadSource_ability_cycle,2);
  assert.equal(f.m.anchorSpreadSource_ability_overflow,1);
  assert.equal(f.m.anchorSpreadSource_ability_blightburst,1);
  assert.equal(f.m.anchorSpreadCycleCasts,1);
  assert.equal(f.m.corruptionCycleActivations,1);
  assert.equal(f.m.anchorSpreadOverflowSeedOnly,1);
  assert.equal(f.e.v012Rot.length,1);
  assert.equal(f.e.v012Rot[0].abilityOrigin,'ability_blightburst');
  assert.equal(f.m.decayPrimaryPaidApplications||0,0);
  assert.equal(f.m.contagiousTouchActivations||0,0);
  api.onAttack(f.b,f.c);assert.equal(f.r.mp,76,'same-time attack cannot repeat cast');
  for(let i=0;i<8;i++){f.c.now++;api.tickRot(f.b,f.c);}
  assert.equal(f.e.v012Rot.length,1);
  const t=fixture(api,['affinity_decay','corrupting_touch','corruption_cycle'],0);t.c.random=()=>0;t.b.cooldowns.corruptionCycle=99;api.onAttack(t.b,t.c);
  assert.equal(t.e.v012Rot.length,1);assert.equal(t.r.mp,96);assert.equal(t.m.decayPrimaryPaidApplications,1);
  const g=fixture(api,['corruption_nova'],3,3);
  api.corruptionOverflow(g.b,g.c);
  assert.equal(g.r.mp,94);assert.equal(g.e.v012Rot.length,4);assert.equal(g.m.anchorSpreadSource_ability_overflow,1);
  assert((g.m.anchorSpreadOverflowSecondary||0)<=(g.m.anchorSpreadOverflowBudget||0));
 }
 // Compare potency and raw burst coefficients with identical owned talents.
 const observed={};
 for(const key of ['full','rot85','burst75','combined']){
  const api=native(key),f=fixture(api,['corruption_cycle'],1);api.onAttack(f.b,f.c);
  const b=fixture(api,['blightburst'],0);api.onAttack(b.b,b.c);
  observed[key]={burst:f.m.corruptionCycleRawBurst,potency:b.e.v012Rot[0].damage};
 }
 const near=(a,b)=>assert(Math.abs(a-b)<1e-7,a+' != '+b);
 near(observed.rot85.potency,observed.full.potency*.85);
 near(observed.burst75.potency,observed.full.potency);
 near(observed.combined.potency,observed.rot85.potency);
 near(observed.burst75.burst,observed.full.burst*.75);
 near(observed.combined.burst,observed.rot85.burst*.75);
 console.log('DECAY_CALIBRATION_SMOKE='+JSON.stringify(observed));
 for(const id of PROFILES){const p=checkedProfile(id);console.log('DECAY_INTEGRATED_BUILDS='+JSON.stringify({id,configs:Object.fromEntries(Object.entries(p.configs).map(([k,v])=>[k,v.t.nodes]))}));for(const sc of ['normal-1','normal-4','elite','boss'])paired(p,sc,0);}
 console.log('ANCHOR_DECAY_INTEGRATED_SMOKE_OK');
}
function aggregate(){const reports=PROFILES.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));let n=0;for(const r of reports){assert.equal(r.n,SC.length*N*arms.length);assert.deepEqual(r.sourceHashes,sourceHashes);n+=r.n;}assert.equal(new Set(reports.map(r=>r.source)).size,1);const report={n,profiles:Object.fromEntries(reports.map(r=>[r.id,{profile:r.profile,summary:r.summary}])),arms,sourceHashes,source:reports[0].source,notes:['E10 Rare gear, 30 legal talent points, paired seeds, 50 per scenario, no runes or Boons. Reference profiles reproduce previous independent Rot study A, Bnew, Cseed, Dseed. Full adds independent Blight while retaining Corrupting Touch one stack, 100% persistent Contagious Touch, independent Cycle two stacks then burst, shared Overflow one stack then burst with split secondary budget. No double credit to Corrupting Touch. Rot85 changes native Rot potency coefficient .04 to .034 for Corrupting Touch, independent sources, weapon secondary and reactive Rot; it preserves inherited prepared stacks and all costs/cooldowns. Burst75 multiplies only Cycle direct burst (including AP/SP term) and Overflow direct burst by .75, with secondary damage following the main damage budget. Combined applies both changes. No enemy changes, production changes, or final calibration decision. Within each talent archetype configurations have identical talent allocation. Across archetypes legal supporting talents may differ. Elite and boss variants rotate. Targeting unchanged.']};write('summary.json',report);console.log('ANCHOR_DECAY_INTEGRATED_OVERVIEW='+JSON.stringify({n,profiles:Object.fromEntries(reports.map(r=>[r.id,Object.fromEntries(Object.entries(r.summary).map(([sc,m])=>[sc,Object.fromEntries(Object.entries(m).map(([id,v])=>[id,{n:v.n,win:v.winPct,delta:v.deltaWinPp,aoe:v.secondaryDps,periodic:v.periodicDps,spread:v.spread,dps:v.dps,winSeconds:v.winSeconds,cycleActivations:v.cycleActivations,cycleDamage:v.cycleDamage,overflowActivations:v.overflowActivations,overflowDamage:v.overflowDamage,manaSpent:v.manaSpent,hpEndPct:v.hpEndPct,manaEndPct:v.manaEndPct,pairedGains:v.pairedGains,pairedLosses:v.pairedLosses}]))]))]))}));}
if(require.main===module){const arg=process.argv[2];if(arg==='smoke')smoke();else if(arg==='aggregate')aggregate();else run(arg);}
