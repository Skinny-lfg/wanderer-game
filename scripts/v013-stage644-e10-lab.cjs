'use strict';
// Stage 6.44 isolated candidate scenarios. Patches ONLY ephemeral GitHub Actions
// workspaces; the game source in the branch is not modified by these tests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const SIZES=[1,4,8,12],N=50;
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s);
function one(src,a,b,why){
 const count=src.split(a).length-1;
 if(count!==1)throw Error(why+': expected one patch anchor; found '+count);
 return src.replace(a,b);
}
function patch(mode){
 let combat=read('combat/v012-combat-runtime.js');
 let build=read('combat/v012-buildcraft.js');
 const arms=mode.split('+');
 if(arms.includes('bow1')){
  combat=one(combat,
   "if(!offhandStrike&&kind==='Bow')groupSecondaryDamage(r,base,ports.state.automaticTalents?.nodes?.includes('bow_pierce')?[.60,.42,.28]:[.42,.24],'🏹 Piercing Arrow',true);",
   "if(!offhandStrike&&kind==='Bow')groupSecondaryDamage(r,base,ports.state.automaticTalents?.nodes?.includes('bow_pierce')?[.60]:[.40],'🏹 Piercing Arrow',true);",
   'bow single-extra');
 }
 if(arms.includes('bowNoTalent')){
  combat=one(combat,"ports.state.automaticTalents?.nodes?.includes('bow_pierce')?[.60]:[.40]",
   "[.40]",'bow skill ablation');
 }
 if(arms.includes('noCleave')){
  combat=one(combat,"const factor=ports.state.automaticTalents?.nodes?.includes('cleave_mastery')?.6:.4;",
   "const factor=.4;",'cleave skill ablation');
 }
 if(arms.includes('noMace')){
  combat=one(combat,"if(!offhandStrike&&kind==='Mace'&&ports.state.automaticTalents?.nodes?.includes('mace_shockwave'))",
   "if(false&&kind==='Mace')",'mace skill ablation');
 }
 if(arms.includes('noSword')){
  combat=one(combat,"if(!offhandStrike&&kind==='Sword'&&off?.subtype==='Shield'&&ports.state.automaticTalents?.nodes?.includes('sword_sweep'))",
   "if(false&&kind==='Sword')",'sword skill ablation');
 }
 if(arms.includes('noFan')){
  combat=one(combat,"if(!offhandStrike&&kind==='Daggers'&&ports.state.automaticTalents?.nodes?.includes('fan_of_blades'))",
   "if(false&&kind==='Daggers')",'fan skill ablation');
 }
 const status=arms.find(x=>/^status(35|50|65)$/.test(x));
 if(status){
  const q=Number(status.slice(6))/100;
  const fn=[
   'function v013Stage644SecondaryStatus(r,e,hit){',
   ' if(!ports.isPhase1Run()||!ports.phase1Build||e.hp<=0)return;',
   ' const nodes=ports.state.automaticTalents?.nodes||[],s=r.stats,now=ports.setNow(r),q='+q+',p=.5;',
   " if(nodes.includes('affinity_blood')&&ports.gameRandom()<.42*q){",
   '  e.dots??={};e.dots.bleed??=[];',
   "  if(e.dots.bleed.length<12){e.dots.bleed.push({damage:Math.max(1,Math.round(WandererV012Buildcraft.bleedDamage(ports.phase1Build,hit*.16*p))),remaining:3,secondaryOrigin:'weapon_aoe'});ports.synchronizeDots(e);ports.phase6Metric(r,'stage644Bleed',1);}",
   ' }',
   " if(nodes.includes('affinity_decay')&&r.mp>=1&&ports.gameRandom()<.42*q){",
   "  e.v012Rot??=[];if(e.v012Rot.length<6){r.mp--;ports.phase6Metric(r,'manaSpent',1);e.v012Rot.push({damage:Math.max(1,Math.round((hit*.065+(s.spellPower||0)*.025)*p)),remaining:4,ticks:0,secondaryOrigin:'weapon_aoe'});ports.phase6Metric(r,'stage644Rot',1);}",
   ' }',
   " if(nodes.includes('affinity_fury')&&e.baseDef>0&&now>=(e.nextFurySunder||0)&&ports.gameRandom()<.15*q){",
   '  const delta=Math.max(0,Math.min(e.baseDef*.02,e.baseDef*.20-(e.furySunder||0),e.def-e.baseDef*.25));',
   "  if(delta>0){e.def-=delta;e.furySunder=(e.furySunder||0)+delta;e.nextFurySunder=now+1;ports.phase6Metric(r,'stage644Sunder',1);}",
   ' }',
   " const effect=s.main?.effect;",
   " if(['bleed','burn','sunder','slow'].includes(effect)&&ports.gameRandom()<ports.affinityProcChance(s.main?.subtype)*q){ports.applyAffinity(effect,e,s,p,hit*p);ports.phase6Metric(r,'stage644WeaponStatus',1);}",
   '}'
  ].join('\n');
  combat=one(combat,"function groupSecondaryDamage(r,base,factors,label,physical=false){",
   fn+"\nfunction groupSecondaryDamage(r,base,factors,label,physical=false){",'secondary function');
  combat=one(combat,"  v013SecondaryHit(r,enemy,amount);\n  hit++;",
   "  const applied=v013SecondaryHit(r,enemy,amount);\n  if(physical&&applied>0)v013Stage644SecondaryStatus(r,enemy,amount);\n  hit++;",
   'secondary invocation');
 }
 if(arms.includes('bloomFixed')){
  const before="for(const m of others){m.v012Rot??=[];if(m.v012Rot.length<6)m.v012Rot.push({damage:Math.max(1,Math.round(source.damage*.75)),remaining:Math.min(3,source.remaining),ticks:0,secondaryOrigin:'grave_bloom'});}";
  const after="for(const [i,m] of others.entries()){m.v012Rot??=[];if(m.v012Rot.length<6){m.v012Rot.push({damage:Math.max(1,Math.round(source.damage*.75)),remaining:Math.min(3,source.remaining),ticks:0,secondaryOrigin:'grave_bloom'});c.synchronizeDots?.(m);c.secondaryHit?.(m,Math.max(1,Math.round(source.damage*(i===0?.75:.55))));}}";
  build=one(build,before,after,'Grave Bloom shared damage');
 }
 if(arms.includes('rupture')){
  const before=[
   "if(rank(b,'carrion_detonation')&&e.bleedStacks>0&&e.v012Rot?.length&&ready(b,'carrionDetonation',c.now,8)&&activated(b,'carrion_detonation')){",
   '  const bleed=e.dots?.bleed?.shift();e.bleedStacks=e.dots?.bleed?.length||0;e.bleed=(e.dots?.bleed||[]).reduce((n,d)=>n+d.damage,0);const rot=e.v012Rot.shift();const owed=(bleed?bleed.damage*bleed.remaining:0)+rot.damage*rot.remaining;c.damage(owed+Math.min(base*.25,e.maxhp*.02),\'☠ Carrion Detonation\');',
   ' }'].join('\n');
  const after=[
   "if(rank(b,'carrion_detonation')&&e.bleedStacks>0&&e.v012Rot?.length){",
   '   e.v013RuptureCharge=(e.v013RuptureCharge||0)+base;',
   '   const cap=Math.max(12,Math.round((c.player?.stats?.attack||base)*1.8));',
   '   if(e.v013RuptureCharge>=cap&&c.now>=(e.v013RuptureReady||0)){',
   '    e.v013RuptureCharge=0;e.v013RuptureReady=c.now+2;',
   "    activated(b,'carrion_detonation');",
   "    if(c.areaDamage)c.areaDamage(Math.min(base*.75,e.maxhp*.05),'☠ Carrion Detonation');",
   "    else c.damage(Math.min(base*.75,e.maxhp*.05),'☠ Carrion Detonation');",
   "    c.trigger?.('stage644Rupture');",
   '   }',
   '  }'].join('\n');
  build=one(build,before,after,'Carrion experimental charge');
 }
 write('combat/v012-combat-runtime.js',combat);
 write('docs/combat/v012-combat-runtime.js',combat);
 write('combat/v012-buildcraft.js',build);
 write('docs/combat/v012-buildcraft.js',build);
 return crypto.createHash('sha256').update(combat+build).digest('hex');
}
function main(){
 const [variant,profile,shardText,capturePath,out]=process.argv.slice(2);
 const shard=Number(shardText);
 if(!/^[a-z0-9+-]+$/.test(variant)||!Number.isInteger(shard)||shard<0||shard>1)throw Error('Bad variant/shard');
 const capture=JSON.parse(fs.readFileSync(capturePath,'utf8'));
 if(capture.profileId!==profile||capture.phase!=='capture')throw Error('Wrong earned snapshots');
 const players=capture.accounts.filter(x=>x.snapshot);
 if(!players.length)throw Error('Zero genuine E10 players');
 const candidate=patch(variant);
 require('./v013-natural-progression.cjs');
 const T=globalThis.WandererAutomaticTalents;
 const D=require('./v013-stage628-postcap-difficulty.cjs');
 const S=require('./simulate-progression.cjs');
 const source=S.sourceFingerprint().sha256;
 const entrants=players.map(x=>{
  const s=x.snapshot,progress=s.state.automaticTalents;
  if(!T.valid(progress))throw Error('Invalid earned v15 build');
  return {seed:x.seed,s,weapon:s.state.equip.weapon?.subtype||null,
   offhand:s.state.equip.offhand?.subtype||null,prepared:progress.prepared,
   points:s.talentSpent,active:progress.nodes.filter(n=>['bow_pierce','cleave_mastery','fan_of_blades','sword_sweep','mace_shockwave','carrion_detonation','grave_bloom','plague_spread'].includes(n))};
 });
 const rows=[];
 for(let n=0;n<N;n++){
  const i=shard*N+n,actor=entrants[i%entrants.length],seed=6430000+i*101;
  for(const size of SIZES){
   const a=D.native(actor.s,{id:'normal-'+size,type:'normal',realm:'blood',size},seed);
   if(!(a.won||a.died||a.timedOut))throw Error('Unresolved native fight');
   rows.push({i,seed,naturalSeed:actor.seed,size,won:!!a.won,timeout:!!a.timedOut,
    damage:a.damageDealt||0,secondary:a.secondaryTargetDamage||0,
    dot:a.secondaryDotDamage||0,taken:a.damageTaken||0,seconds:a.seconds||0,
    roster:crypto.createHash('sha256').update(JSON.stringify(a.roster)).digest('hex'),
    gear:a.gearFingerprint,xp:a.talentXp});
  }
 }
 const result={stage:'6.44',variant,profile,shard,source,candidate,
  note:'Candidate code patched only in ephemeral GitHub Actions runner; no gameplay changes committed.',
  entrants:entrants.map(({s,...rest})=>rest),rows};
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log('STAGE644_RESULTS='+JSON.stringify({variant,profile,shard,source,entrants:result.entrants,
  sizes:SIZES.map(size=>{const a=rows.filter(x=>x.size===size);return {size,n:a.length,
   wins:a.filter(x=>x.won).length,timeouts:a.filter(x=>x.timeout).length,
   secondary:a.reduce((v,x)=>v+x.secondary,0)};})}));
}
if(require.main===module)try{main();}catch(e){console.error('STAGE644_ERROR '+String(e.stack||e));process.exitCode=1;}
module.exports={patch};
