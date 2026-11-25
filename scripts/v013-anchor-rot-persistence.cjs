'use strict';
// Research only: isolate Rot persistence with three pure Decay weapon profiles. No live changes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
require('../combat/v012-runes.js');
const F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(s=>s.kind==='elite').map(s=>s.elite),SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'],N=50,OUT='reports/anchor-rot-persistence';
G.P['decay-cycle-only-twohand']={id:'decay-cycle-only-twohand',families:['decay'],w:'twohand',skills:['corruption_cycle','contagious_touch'],role:'aoe'};
G.P['decay-cycle-only-staff']={id:'decay-cycle-only-staff',families:['decay'],w:'staff',skills:['corruption_cycle','contagious_touch'],role:'aoe'};
const PROFILES=['decay-cycle-only-twohand','decay-cycle-only-staff','decay-cycle-daggers'];
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
const variants=Object.fromEntries(['base','finite','persistent'].map(mode=>[mode,overlay(mode)]));
const arms=Object.keys(variants).map(variant=>({id:variant,variant,boon:false,rune:false}));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourceHashes=Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([p,s])=>[p,hash(s)]))]));
function cell(p,sc,i,arm){
 const family=F[i%F.length],seed=65301001+i*101,kind=sc.startsWith('normal')?'normal':sc,size=kind==='normal'?Number(sc.slice(7)):undefined,elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,src=variants[arm.variant];
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,anchorRuneFixture:arm.rune?[{family:'corruption',tier:5,rarity:'Rare'}]:[],contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,stage648c1BuildcraftSource:src[B],stageArmorRuntimeSource:src[C],stage648b1ExpeditionSource:src[E],anchorSpreadResearch:true,anchorSpreadBoonSource:src[O],anchorSpreadBoon:arm.boon,...(elite?{stage619EliteType:elite}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,size);
 assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);
 return {arm:arm.id,sc,i,seed,won:!!x.won,died:!!x.died,timeout:!!x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,periodic:x.affinityMetrics.dotDamageActual,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,spread:x.anchorSpreadMetrics,decay:x.decayTalentMetrics,bloom:x.graveBloomMetrics,weapon:x.weaponStatusMetrics,match:{resolved:x.resolvedSeed,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId}};
}
function paired(p,sc,i){const rows=arms.map(a=>cell(p,sc,i,a));for(const r of rows.slice(1))assert.deepEqual(r.match,rows[0].match,p.id+'/'+sc+'/'+i+'/'+r.arm);return rows;}
const mean=(rs,fn)=>rs.length?rs.reduce((s,r)=>s+fn(r),0)/rs.length:null;
function stats(rs){const wins=rs.filter(r=>r.won),keys=[...new Set(rs.flatMap(r=>Object.keys(r.spread||{})))];return {n:rs.length,wins:wins.length,winPct:100*wins.length/rs.length,timeouts:rs.filter(r=>r.timeout).length,dps:mean(rs,r=>r.damage/Math.max(.11,r.seconds)),secondaryDps:mean(rs,r=>r.secondary/Math.max(.11,r.seconds)),secondaryDotDps:mean(rs,r=>r.secondaryDot/Math.max(.11,r.seconds)),periodicDps:mean(rs,r=>r.periodic/Math.max(.11,r.seconds)),winSeconds:mean(wins,r=>r.seconds),hpEndPct:mean(rs,r=>100*r.hpEnd/r.hpMax),manaEndPct:mean(rs.filter(r=>r.mpMax>0),r=>100*r.mpEnd/r.mpMax),spread:Object.fromEntries(keys.map(k=>[k,rs.reduce((s,r)=>s+(r.spread?.[k]||0),0)])),cycleActivations:rs.reduce((n,r)=>n+(r.decay?.corruptionCycleActivations||0),0),cycleDamage:rs.reduce((n,r)=>n+(r.decay?.corruptionCycleDamage||0),0),overflowActivations:rs.reduce((n,r)=>n+(r.decay?.corruptionOverflowActivations||0),0),overflowDamage:rs.reduce((n,r)=>n+(r.decay?.corruptionOverflowDamage||0),0)};}
function summary(rows){const out={};for(const sc of ['all',...SC]){const rs=rows.filter(r=>sc==='all'||r.sc===sc);out[sc]={};for(const arm of arms){const selected=rs.filter(r=>r.arm===arm.id),base=rs.filter(r=>r.arm==='base'),m=stats(selected),b=stats(base),lookup=new Map(base.map(r=>[r.sc+'/'+r.i,r]));out[sc][arm.id]={...m,deltaWinPp:m.winPct-b.winPct,pairedGains:selected.filter(r=>r.won&&!lookup.get(r.sc+'/'+r.i).won).length,pairedLosses:selected.filter(r=>!r.won&&lookup.get(r.sc+'/'+r.i).won).length};}}return out;}
function write(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj)+'\n');}
function checkedProfile(id){const p=G.profile(id);assert.equal(p.families.join(','),'decay');assert(p.t.nodes.includes('corruption_cycle'));assert(p.t.nodes.includes('contagious_touch'));assert.equal(p.t.nodes.includes('corruption_nova'),id==='decay-cycle-daggers');return p;}
function run(id){assert(PROFILES.includes(id));const p=checkedProfile(id),rows=[];for(const sc of SC)for(let i=0;i<N;i++)rows.push(...paired(p,sc,i));const report={id,n:rows.length,profile:p,source:S.sourceFingerprint().sha256,sourceHashes,arms,summary:summary(rows),rows};write(id+'.json',report);console.log('ANCHOR_SPREAD='+JSON.stringify({id,n:rows.length,summary:report.summary}));}
function smoke(){
 for(const src of Object.values(variants))for(const code of Object.values(src))new Function(code);
 for(const mode of Object.keys(variants)){
  const root={WandererAutomaticTalents:T};new Function('globalThis','module',variants[mode][B])(root,undefined);
  const Bc=root.WandererV012Buildcraft,b=Bc.create();Bc.syncPermanent(b,buy(['corruption_cycle','contagious_touch']));
  const e={hp:100000,maxhp:100000,v012Rot:Array.from({length:3},()=>({damage:100,remaining:4,spread:true,secondaryOrigin:'contagious_touch'})),dots:{bleed:[],burn:[]}},r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:[e],stats:{attack:100,spellPower:50,attacksPerSec:1}},m={};
  const c={player:r,enemy:e,now:1,base:100,power:50,random:()=>.999999,waveKey:'persistent',log(){},dot(){},damage(n){e.hp-=n;},dotDamage(n){e.hp-=n;},metric(k,n){m[k]=(m[k]||0)+n;},heal(){return 0;},barrier(){},mana(n){r.mp+=n;}};
  for(let i=1;i<=8;i++){c.now=i;Bc.tickRot(b,c);}
  if(mode==='persistent'){assert.equal(e.v012Rot.length,3);assert(e.v012Rot.every(d=>d.remaining===4&&!d.primaryPaid));assert.equal(m.anchorSpreadExpired,0);assert(e.hp<100000);Bc.onAttack(b,c);assert.equal(m.anchorSpreadCycleConsumed,3);assert.equal(m.corruptionCycleRawBurst,1830);assert.equal(r.mp,90);assert.equal(e.v012Rot.length,0);}
  else {assert.equal(e.v012Rot.length,0);assert.equal(m.anchorSpreadExpired,3);Bc.onAttack(b,c);assert.equal(r.mp,100);}
  assert.equal(m.decayPrimaryPaidApplications||0,0);assert.equal(m.contagiousTouchActivations||0,0);assert.equal(m.soulDrainMana||0,0);
 }
 for(const id of PROFILES){const p=checkedProfile(id);paired(p,'normal-4',0);paired(p,'normal-1',0);}
 console.log('ANCHOR_ROT_PERSISTENCE_SMOKE_OK');
}
function aggregate(){const reports=PROFILES.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));let n=0;for(const r of reports){assert.equal(r.n,SC.length*N*arms.length);assert.deepEqual(r.sourceHashes,sourceHashes);n+=r.n;}assert.equal(new Set(reports.map(r=>r.source)).size,1);const report={n,profiles:Object.fromEntries(reports.map(r=>[r.id,{profile:r.profile,summary:r.summary}])),arms,sourceHashes,source:reports[0].source,notes:['Native runtime with research-only source overlays. E10 30 points Rare gear; 50 seeds per scenario; boss and elite variants rotate. No runes or Boons. Base: native 65% Contagious Touch and primary-paid-only burst. Finite: 100% Contagious Touch, propagated stacks eligible for burst, Overflow checked on attacks. Persistent: same as finite but propagated Rot does not expire. No change to number of copies, caps, cooldowns, costs, paid application credits, Burn, Bleed, Boon or Overflow six-stack requirement. Mechanical target policy unchanged. Target preparation measured on genuine main attacks. No production balance change.']};write('summary.json',report);console.log('ANCHOR_ROT_PERSISTENCE_OVERVIEW='+JSON.stringify({n,profiles:Object.fromEntries(reports.map(r=>[r.id,Object.fromEntries(Object.entries(r.summary).map(([sc,m])=>[sc,Object.fromEntries(Object.entries(m).map(([id,v])=>[id,{n:v.n,win:v.winPct,delta:v.deltaWinPp,aoe:v.secondaryDps,periodic:v.periodicDps,spread:v.spread,dps:v.dps,winSeconds:v.winSeconds,cycleActivations:v.cycleActivations,cycleDamage:v.cycleDamage,overflowActivations:v.overflowActivations,overflowDamage:v.overflowDamage}]))]))]))}));}
if(require.main===module){const arg=process.argv[2];if(arg==='smoke')smoke();else if(arg==='aggregate')aggregate();else run(arg);}
