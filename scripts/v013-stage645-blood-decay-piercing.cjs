'use strict';
// Stage 6.45: candidate-only native E10 lab. Only temporary runner files
// are modified. Nothing here patches production or deploys the game.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),SIZES=[1,4,8,12];
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function one(s,a,b,name){if(s.split(a).length!==2)throw Error('Unmatched Stage645 anchor '+name);return s.replace(a,b);}
const SCENARIOS={
 'bow-current':{family:'bow'},
 'bow-80':{family:'bow',pierce:.8},
 'bow-100':{family:'bow',pierce:1},
 'bow-100-status':{family:'bow',pierce:1,status:true},
 'bow-armor':{family:'bow',pierce:.9,armor:.5,status:true},
 'mixed-current':{family:'mixed'},
 'mixed-status':{family:'mixed',status:true},
 'mixed-fast':{family:'mixed',status:true,charge:1.5,burst:.75},
 'mixed-heavy':{family:'mixed',status:true,charge:2.5,burst:1.1},
 'mixed-spread':{family:'mixed',status:true,charge:1.5,burst:.75,spread:true},
 'mixed-bow-current':{family:'mixed-bow'},
 'mixed-bow-pierce':{family:'mixed-bow',pierce:1,status:true,charge:1.5,burst:.75,spread:true}
};
function patch(cfg){
 let runtime=read('combat/v012-combat-runtime.js'),build=read('combat/v012-buildcraft.js'),sim=read('scripts/simulate-progression.cjs');
 const statusFn=[
 'function stage645SecondaryStatuses(b,c,q=.5,p=.5){',
 ' const e=c.enemy,base=Math.max(0,c.base||0);',
 ' if(!e||e.hp<=0||base<=0)return;',
 " const br=rank(b,'bleeding_edge'),rr=rank(b,'toxic_touch');",
 ' if(br){',
 "  const v=values('bleeding_edge',br);",
 '  if(c.now>=(e.stage645BleedReady||0)&&c.random()<v.chance*q){',
 "   c.dot('bleed',base*v.bleed*p);e.stage645BleedReady=c.now+v.icd;",
 "   const d=e.dots?.bleed?.at(-1);if(d)d.secondaryOrigin='weapon';",
 "   c.metric('stage645BleedApplied',1);",
 '  }',
 ' }',
 ' if(rr){',
 "  const v=values('toxic_touch',rr);",
 '  if(c.now>=(e.stage645RotReady||0)&&c.random()<v.chance*q&&spendDarkMana(c,1)){',
 '   applyRot(b,c,(base*v.rot+Math.max(0,c.power||0)*.025)*p);e.stage645RotReady=c.now+v.icd;',
 "   const d=e.v012Rot?.at(-1);if(d)d.secondaryOrigin='weapon';",
 "   c.metric('stage645RotApplied',1);",
 '  }',
 ' }',
 " if(specialized(b,'affinity_fury')&&e.baseDef>0&&c.now>=(e.nextFurySunder||0)&&c.random()<.15*q){",
 '  const def=e.baseDef,old=e.furySunder||0,n=Math.max(0,Math.min(def*.04*p,def*.20-old,e.def-def*.25));',
 "  if(n>0){e.def-=n;e.furySunder=old+n;e.nextFurySunder=c.now+1;c.metric('stage645SunderApplied',1);}",
 ' }',
 '}'
 ].join('\n');
 if(cfg.status){
  build=one(build,'function onAttack(b,c){',statusFn+'\nfunction onAttack(b,c){','status helper');
  build=one(build,'mods,onHeal,onAttack,onCast','mods,onHeal,stage645SecondaryStatuses,onAttack,onCast','status export');
  // Secondary bleed/burn should contribute to native secondary-DOT telemetry.
  runtime=runtime.replaceAll('.filter(dot=>dot.spread)',".filter(dot=>dot.spread||dot.secondaryOrigin)");
 }
 if(cfg.charge){
  const old=[
   "if(rank(b,'carrion_detonation')&&e.bleedStacks>0&&e.v012Rot?.length&&ready(b,'carrionDetonation',c.now,8)&&activated(b,'carrion_detonation')){",
   "  const bleed=e.dots?.bleed?.shift();e.bleedStacks=e.dots?.bleed?.length||0;e.bleed=(e.dots?.bleed||[]).reduce((n,d)=>n+d.damage,0);const rot=e.v012Rot.shift();const owed=(bleed?bleed.damage*bleed.remaining:0)+rot.damage*rot.remaining;c.damage(owed+Math.min(base*.25,e.maxhp*.02),'☠ Carrion Detonation');",
   ' }'].join('\n');
  build=one(build,old,'// Carrion is resolved exclusively by the weapon-hit candidate path.','old Carrion');
 }
 const helper=[
 'function stage645Carrion(r,enemy,real){',
 ' const b=ports.phase1Build;',
 " if(!b||!WandererV012Buildcraft.rank(b,'carrion_detonation')||!(real>0))return;",
 ' const bleed=(enemy.dots?.bleed||[]).filter(d=>d.remaining>0),rot=(enemy.v012Rot||[]).filter(d=>d.remaining>0);',
 ' if(!bleed.length||!rot.length){enemy.stage645Charge=0;return;}',
 ' const now=ports.setNow(r);',
 ' if(now<(enemy.stage645RuptureReady||0))return;',
 ' const threshold=Math.max(10,r.stats.attack*'+(cfg.charge||1)+');',
 ' if(!(enemy.stage645Charge>0))ports.phase6Metric(r,"stage645Marks",1);',
 ' enemy.stage645Charge=(enemy.stage645Charge||0)+real;',
 ' ports.phase6Metric(r,"stage645ChargeDamage",real);',
 ' if(enemy.stage645Charge<threshold)return;',
 ' enemy.stage645Charge=0;enemy.stage645RuptureReady=now+1.5;',
 ' ports.phase6Metric(r,"stage645Bursts",1);',
 ' const amount=threshold*'+(cfg.burst||0)+';',
 ' const live=(r.enemies||[r.enemy]).filter(e=>e&&e.hp>0);',
 ' const sourceBleed=bleed.filter(d=>!d.spread&&!d.transferred).sort((a,b)=>b.damage-a.damage)[0];',
 ' const sourceRot=rot.filter(d=>!d.spread&&!d.transferred).sort((a,b)=>b.damage-a.damage)[0];',
 ' for(const target of live){',
 '  const before=target.hp,cap=target.maxhp*(target.boss?.04:target.miniboss?.08:.25);',
 '  const burst=Math.max(1,Math.min(cap,amount*(target===enemy?.35:1)));',
 '  if(target===enemy){const prev=r.enemy;try{r.enemy=target;ports.setDirectEnemyDamage(r,burst,"Carrion Detonation");}finally{r.enemy=prev;}}',
 '  else v013SecondaryHit(r,target,burst);',
 '  ports.phase6Metric(r,"stage645BurstDamage",Math.max(0,before-Math.max(0,target.hp)));',
 '  if(target!==enemy&&target.hp>0&&'+!!cfg.spread+'){',
 '   if(sourceBleed){target.dots??={};target.dots.bleed??=[];if(target.dots.bleed.length<12){target.dots.bleed.push({damage:Math.max(1,Math.round(sourceBleed.damage*.5)),remaining:Math.min(3,sourceBleed.remaining),spread:true,secondaryOrigin:"carrion"});ports.synchronizeDots(target);ports.phase6Metric(r,"stage645SpreadBleed",1);}}',
 '   if(sourceRot){target.v012Rot??=[];const max=b.runtime?.specializations?.includes("rot_focus")?3:6;if(target.v012Rot.length<max){target.v012Rot.push({damage:Math.max(1,Math.round(sourceRot.damage*.5)),remaining:Math.min(3,sourceRot.remaining),ticks:0,spread:true,secondaryOrigin:"carrion"});ports.phase6Metric(r,"stage645SpreadRot",1);}}',
 '  }',
 ' }',
 '}',
 'function stage645SecondaryWeapon(r,e,base,real){',
 ' if(!ports.isPhase1Run()||!ports.phase1Build||!(real>0))return;',
 ' if(!e.bleedStacks||!e.v012Rot?.length)e.stage645Charge=0;',
 ' if(e.hp>0&&'+!!cfg.status+'){',
 '  const previous=r.enemy;',
 '  try{r.enemy=e;const ctx=phase2Context(r);ctx.base=base;ctx.metric=(key,n)=>ports.phase6Metric(r,key,n);WandererV012Buildcraft.stage645SecondaryStatuses(ports.phase1Build,ctx,.5,.5);}',
 '  finally{r.enemy=previous;}',
 ' }',
 ' if('+!!cfg.charge+')stage645Carrion(r,e,real);',
 '}'
 ].join('\n');
 if(cfg.status||cfg.charge){
  runtime=one(runtime,'function groupSecondaryDamage(r,base,factors,label,physical=false){',helper+'\nfunction groupSecondaryDamage(r,base,factors,label,physical=false){','native secondary hook');
  runtime=one(runtime,'  v013SecondaryHit(r,enemy,amount);\n  hit++;','  const actual=v013SecondaryHit(r,enemy,amount);\n  if(physical)stage645SecondaryWeapon(r,enemy,amount,actual);\n  hit++;','actual extra hit');
 }
 if(cfg.charge){
  runtime=one(runtime,' const s=r.stats,e=r.enemy,weapon=offhandStrike?s.off:s.main,off=s.off,caster=!offhandStrike&&s.caster,now=ports.setNow(r),temp=ports.setRuntime(r);',' const s=r.stats,e=r.enemy,weapon=offhandStrike?s.off:s.main,off=s.off,caster=!offhandStrike&&s.caster,now=ports.setNow(r),temp=ports.setRuntime(r);\n if(!e.bleedStacks||!e.v012Rot?.length)e.stage645Charge=0;','charge reset');
  runtime=one(runtime," if(!offhandStrike&&kind==='Two-Handed'){"," if(!cast)stage645Carrion(r,e,real);\n if(!offhandStrike&&kind==='Two-Handed'){",'primary charge hook');
 }
 if(cfg.pierce){
  runtime=one(runtime,"includes('bow_pierce')?[.60,.42,.28]:[.42,.24]","includes('bow_pierce')?["+cfg.pierce+"]:[.66]",'one extra');
  if(cfg.armor)runtime=one(runtime,'-WandererV012Buildcraft.enemyDefense(ports.phase1Build,enemy))',
    "-WandererV012Buildcraft.enemyDefense(ports.phase1Build,enemy)*(label.includes('Piercing Arrow')&&ports.state.automaticTalents?.nodes?.includes('bow_pierce')?"+(1-cfg.armor)+":1))",'piercing armor');
 }
 // Record first death on original visible targets, including kills before reinforcement entry.
 sim=one(sim,' let ticks=0,targetSwitches=0,minimumHp=',' let stage645FirstKill=null;let ticks=0,targetSwitches=0,minimumHp=','first death tracker');
 sim=one(sim,'a.tick();ticks++;for(const mob of r.enemies||[])','a.tick();ticks++;if(stage645FirstKill===null&&sourceActors.some(e=>e.hp<=0))stage645FirstKill=(r.combatSeconds||0)-startedAt;for(const mob of r.enemies||[])','first death sample');
 sim=one(sim,'const row={initialStateSha256,','const row={stage645:Object.fromEntries(Object.entries(metrics).filter(([k])=>k.startsWith("stage645"))),firstKillSeconds:stage645FirstKill,initialStateSha256,','metrics export');
 for(const [p,s] of [['combat/v012-combat-runtime.js',runtime],['combat/v012-buildcraft.js',build],['scripts/simulate-progression.cjs',sim]]){
  new vm.Script(s,{filename:p});write(p,s);
  if(p.startsWith('combat/'))write('docs/'+p,s);
 }
 return hash(runtime+build+sim);
}
function respec(s,cfg){
 const T=globalThis.WandererAutomaticTalents,P=require('./v013-build-planner.cjs');
 if(cfg.family==='bow')return require('./v013-stage642-e10-bow-respec.cjs').makeRespec(s);
 const weapon=s.state.equip.weapon?.subtype;
 if(cfg.family==='mixed'&&!['Two-Handed','Sword'].includes(weapon))return null;
 if(cfg.family==='mixed-bow'&&weapon!=='Bow')return null;
 const families=cfg.family==='mixed-bow'?['blood','decay','fury']:['blood','decay'];
 const plan={primary:'blood',secondary:'decay',secondAt:1,third:families[2],thirdAt:1,
  model:families.length===3?'three':'two',mix:true,weapons:[weapon],armor:'Leather',focus:'bleed',
  milestones:['carrion_detonation','plague_spread',...(weapon==='Bow'?['bow_pierce']:weapon==='Two-Handed'?['cleave_mastery']:[])],
  orderedMilestones:true};
 let p=T.reset(s.state.automaticTalents);
 for(const goal of plan.milestones){
  const steps=P.routeTo(T,p,goal,plan,families);
  let candidate=p;
  if(steps)for(const id of steps){
   candidate=T.allocate(candidate,id);
   if(!candidate)break;
  }
  if(!steps||!candidate||!candidate.nodes.includes(goal)){
   if(goal==='carrion_detonation'||goal==='plague_spread'||goal==='bow_pierce')return null;
   continue;
  }
  p=candidate;
 }
 // Fill unused earned points using existing planner without changing build families.
 const filled=P.propose(T,p,plan,[],2);
 const progress={...p,nodes:filled.expectedNodes};
 if(!T.valid(progress)||!plan.milestones.slice(0,2).every(id=>progress.nodes.includes(id))||
  weapon==='Bow'&&!progress.nodes.includes('bow_pierce'))throw Error('Illegal mixed respec');
 return {...s,talentSpent:progress.nodes.length,state:{...s.state,automaticTalents:progress}};
}
function main(){
 const [variant,profile,shardText,input,out]=process.argv.slice(2),cfg=SCENARIOS[variant];
 if(!cfg)throw Error('Unknown variant '+variant);
 if(profile==='--preflight'){console.log('PATCH_OK '+variant+' '+patch(cfg));return;}
 const shard=Number(shardText);if(![0,1].includes(shard))throw Error('Invalid shard');
 const capture=JSON.parse(fs.readFileSync(input,'utf8'));
 if(capture.profileId!==profile||capture.phase!=='capture')throw Error('Wrong capture');
 const patchHash=patch(cfg);
 require('./v013-natural-progression.cjs');
 const D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
 const source=S.sourceFingerprint().sha256;
 const entries=capture.accounts.filter(x=>x.snapshot).map(x=>{
  const s=respec(x.snapshot,cfg);if(!s){console.log('STAGE645_UNAFFORDABLE '+x.seed+' '+profile);return null;}
  const p=s.state.automaticTalents;
  return {seed:x.seed,s,weapon:s.state.equip.weapon?.subtype,offhand:s.state.equip.offhand?.subtype||null,
    points:p.nodes.length,nodes:p.nodes,gear:hash(JSON.stringify(s.state.equip)),xp:p.xp};
 }).filter(Boolean);
 if(!entries.length)throw Error('No eligible earned E10 actors: '+profile+' '+variant);
 const rows=[];
 for(let k=0;k<50;k++){
  const i=shard*50+k,actor=entries[i%entries.length],seed=6430000+i*101;
  for(const size of SIZES){
   const a=D.native(actor.s,{id:'normal-'+size,type:'normal',realm:'blood',size},seed);
   if(!(a.won||a.died||a.timedOut)||a.peakVisibleEnemies>4)throw Error('Native encounter unresolved or arena overflow');
   rows.push({seed,actor:actor.seed,size,won:!!a.won,died:!!a.died,timeout:!!a.timedOut,
    seconds:a.seconds,firstKill:a.firstKillSeconds,damage:a.damageDealt,secondary:a.secondaryTargetDamage,
    dot:a.secondaryDotDamage,taken:a.damageTaken,hpEnd:a.hpEnd,mana:a.manaSpent,reinforcements:a.reinforcementsSpawned,
    effects:a.stage645||{},nativePassives:a.affinityMetrics?.passiveActivations||{},
    roster:hash(JSON.stringify(a.roster)),gear:a.gearFingerprint,xp:a.talentXp});
  }
 }
 const result={stage:'6.45',profile,variant,shard,source,patchHash,entries:entries.map(({s,...e})=>e),rows};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log('STAGE645_SHARD='+JSON.stringify({profile,variant,shard,entries:result.entries.map(e=>({seed:e.seed,weapon:e.weapon,points:e.points,
  carrion:e.nodes.includes('carrion_detonation'),contagion:e.nodes.includes('plague_spread'),pierce:e.nodes.includes('bow_pierce')})),groups:SIZES.map(size=>{const a=rows.filter(r=>r.size===size);return {size,n:a.length,wins:a.filter(r=>r.won).length,bursts:a.reduce((n,r)=>n+(r.effects.stage645Bursts||0),0),timeouts:a.filter(r=>r.timeout).length};})}));
}
if(require.main===module){try{main();}catch(e){console.error('STAGE645_ERROR '+String(e.stack||e));process.exitCode=1;}}
module.exports={patch,respec,SCENARIOS};
