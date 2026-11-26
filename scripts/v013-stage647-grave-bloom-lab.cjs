'use strict';
// Historical baseline and isolated candidate experiments, never patch a user's checkout.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const scenarios={baseline:null,balanced:{spell:.45,ticks:2,spread:.75},strong:{spell:.8,ticks:3,spread:.85}};
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function one(s,a,b,label){if(s.split(a).length!==2)throw Error('Grave Bloom anchor '+label);return s.replace(a,b);}
function transform(runtime,build,cfg){
 if(!cfg)return {runtime,build};
 const old=runtime.slice(runtime.indexOf('function v013GraveBloomPulse('),runtime.indexOf('function groupElementalEffects('));
 if(!old.startsWith('function v013GraveBloomPulse')||!old.includes('groupSecondaryDamage'))throw Error('Wrong runtime baseline');
 runtime=one(runtime,old,'','retire old resolver');
 runtime=one(runtime,"if(cast&&(learned('spell_echo')||prepared('grave_bloom'))){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount){const echo=learned('spell_echo')?Math.max(1,Math.round(damage*.1*learned('spell_echo'))):0;damage+=echo;if(echo)ports.floatText(echo,'enemy',false,'ECHO',e);damage+=v013GraveBloomPulse(r,e,s.spellPower||0);}}",
 "if(cast&&learned('spell_echo')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount){const echo=Math.max(1,Math.round(damage*.1*learned('spell_echo')));damage+=echo;if(echo)ports.floatText(echo,'enemy',false,'ECHO',e);}}\n  if(cast&&ports.isPhase1Run()&&ports.phase1Build){const bloom=ports.phase2Context(r);bloom.funded=true;bloom.power=s.spellPower||0;bloom.action='weaponCast';damage+=WandererV012Buildcraft.graveBloomAction(ports.phase1Build,bloom);}","weapon funded cast");
 runtime=one(runtime,"if(learned('spell_echo')||prepared('grave_bloom')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount){if(learned('spell_echo'))spellDamage+=Math.max(1,Math.round(spellDamage*.1*learned('spell_echo')));spellDamage+=v013GraveBloomPulse(r,r.enemy,ctx.power||0);}}",
 "if(learned('spell_echo')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount)spellDamage+=Math.max(1,Math.round(spellDamage*.1*learned('spell_echo')));}\n ctx.action='elementalCast';spellDamage+=WandererV012Buildcraft.graveBloomAction(b,ctx);","elemental funded cast");
 runtime=one(runtime," secondaryHit(enemy,amount){return r.enemies?.includes(enemy)?v013SecondaryHit(r,enemy,amount):0;},",
 " metric(key,n){ports.phase6Metric(r,key,n);},\n link(kind,source,targets){ports.combatLinkEffect?.(r,kind,source,targets);},\n secondaryHit(enemy,amount){return r.enemies?.includes(enemy)?v013SecondaryHit(r,enemy,amount):0;},","native context");
 const start=build.indexOf("  if(r.prepared==='grave_bloom'){",build.indexOf('function onInfusionHit(')),end=build.indexOf('\n  }\n }',start);
 if(start<0||end<0)throw Error('Physical legacy block not found');
 build=build.slice(0,start)+build.slice(end+4);
 build=one(build," // This hit is NOT an additional attack, spell, critical or off-hand proc."," const bloom=graveBloomAction(b,{...c,funded:true,action:'infusion'});if(bloom>0)c.damage(bloom,'☠ Grave Bloom');\n // This hit is NOT an additional attack, spell, critical or off-hand proc.","physical hook");
 const helper=[
  '// One counter per encounter across all real paid magic actions.',
  'function graveBloomAction(b,c){',
  " if(b?.runtime?.prepared!=='grave_bloom'||!specialized(b,'grave_bloom')||!c.funded||c.proc||c.extra||c.recursive||c.offhand)return 0;",
  ' const r=b.runtime,e=c.enemy,power=Math.max(0,Number(c.power)||0);',
  ' if(!e||e.hp<=0||!(power>0))return 0;',
  ' if(r.graveBloomEncounter!==c.waveKey){r.graveBloomEncounter=c.waveKey;r.graveBloomCount=0;}',
  " c.metric?.('graveBloomActions',1);c.metric?.('graveBloomAction_'+c.action,1);",
  ' r.graveBloomCount=((r.graveBloomCount||0)+1)%3;',
  ' if(r.graveBloomCount)return 0;',
  ' const cap=specialized(b,"rot_focus")?3:6;',
  ' e.v012Rot??=[];',
  ' if(!e.v012Rot.some(d=>d.remaining>0)){applyRot(b,c,power*.16);c.metric?.("graveBloomSeeds",1);}',
  ' const source=e.v012Rot.filter(d=>d.remaining>0&&d.damage>0).sort((a,b)=>b.damage-a.damage)[0];',
  ' if(!source)return 0;',
  " activated(b,'grave_bloom');c.trigger?.('grave_bloom');c.metric?.('graveBloomActivations',1);",
  ' const targets=(c.player?.enemies||[]).filter(t=>t!==e&&t.hp>0).slice(0,3);',
  ' if(!targets.length)return source.damage;',
  ' for(const target of targets){',
  '  const amount=Math.min(target.maxhp*(target.boss?.035:target.miniboss?.07:.22),power*'+cfg.spell+'+source.damage*'+cfg.ticks+');',
  '  const actual=c.secondaryHit?.(target,Math.max(1,Math.round(amount)))||0;',
  "  c.metric?.('graveBloomBurstDamage',actual);",
  "  if(actual>0)c.metric?.('graveBloomTargets',1);",
  '  if(target.hp<=0)continue;',
  '  target.v012Rot??=[];',
  '  if(target.v012Rot.length<cap){',
  '   target.v012Rot.push({damage:Math.max(1,Math.round(source.damage*'+cfg.spread+')),remaining:Math.min(3,source.remaining),ticks:0,spread:true,secondaryOrigin:"grave_bloom"});',
  "   c.metric?.('graveBloomSpread',1);",
  '  }',
  "  c.link?.('rot',e,[target]);",
  ' }',
  ' return 0;',
  '}'
 ].join('\n');
 build=one(build,'function onInfusionHit(b,c){',helper+'\nfunction onInfusionHit(b,c){','common resolver');
 build=one(build,'onInfusionActivation,onInfusionHit,validate','onInfusionActivation,onInfusionHit,graveBloomAction,validate','export');
 new vm.Script(runtime);new vm.Script(build);
 return {runtime,build};
}
function install(variant){
 if(!Object.hasOwn(scenarios,variant))throw Error('Unknown variant');
 // Only allowed in GitHub Actions checkout explicitly created for this experiment.
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.STAGE647_ISOLATED!=='1')throw Error('Candidate patch requires isolated CI checkout');
 const a='combat/v012-combat-runtime.js',b='combat/v012-buildcraft.js';
 const out=transform(read(a),read(b),scenarios[variant]);
 if(scenarios[variant])for(const [p,s] of [[a,out.runtime],[b,out.build]])for(const prefix of ['', 'docs/'])fs.writeFileSync(path.join(root,prefix+p),s);
 const p='scripts/simulate-progression.cjs',s=read(p);
 fs.writeFileSync(path.join(root,p),one(s,'const row={weaponStatusMetrics:','const row={graveBloomMetrics:Object.fromEntries(Object.entries(metrics).filter(([k])=>k.startsWith("graveBloom"))),weaponStatusMetrics:','telemetry'));
 return hash(out.runtime+out.build);
}
function respec(s,profile){
 const T=globalThis.WandererAutomaticTalents,P=require('./v013-build-planner.cjs');
 const weapon=s.state.equip.weapon?.subtype,reset=T.reset(s.state.automaticTalents);
 if(profile==='decay-blood-spread'&&weapon!=='Sword'||profile==='arcane-decay-bloom'&&!['Wand','Staff'].includes(weapon))return null;
 const p=P.propose(T,reset,{primary:'arcane',secondary:'decay',secondAt:1,model:'two',mix:true,element:'arcane',weapons:[weapon],armor:profile==='arcane-decay-bloom'?'Cloth':'Leather',milestones:['grave_bloom'],orderedMilestones:true,focus:'rot'});
 const purchased={...reset,nodes:p.expectedNodes,prepared:'grave_bloom'};
 if(!purchased.nodes.includes('grave_bloom')||!T.valid(purchased))return null;
 return {...s,talentSpent:purchased.nodes.length,state:{...s.state,automaticTalents:purchased}};
}
function main(){
 const [variant,profile,shardText,input,out]=process.argv.slice(2);
 if(profile==='--preflight'){install(variant);console.log('STAGE647_PATCH_OK '+variant);return;}
 const shard=Number(shardText);if(![0,1].includes(shard))throw Error('Invalid shard');
 const capture=JSON.parse(fs.readFileSync(input,'utf8'));if(capture.profileId!==profile||capture.phase!=='capture')throw Error('Wrong capture');
 const fingerprint=install(variant);
 require('./v013-natural-progression.cjs');
 const D=require('./v013-stage628-postcap-difficulty.cjs');
 const entrants=capture.accounts.filter(x=>x.snapshot).map(x=>{
  const s=respec(x.snapshot,profile);if(!s)return null;
  return {seed:x.seed,s,weapon:s.state.equip.weapon.subtype,offhand:s.state.equip.offhand?.subtype||null,points:s.talentSpent,nodes:s.state.automaticTalents.nodes,gear:hash(JSON.stringify(s.state.equip)),xp:s.xp};
 }).filter(Boolean);
 if(!entrants.length)throw Error('No legal prepared Grave Bloom E10 actors');
 const rows=[];
 for(let k=0;k<50;k++){
  const i=shard*50+k,a=entrants[i%entrants.length],seed=6430000+i*101;
  for(const size of [1,4,8,12]){
   const r=D.native(a.s,{id:'normal-'+size,type:'normal',realm:'blood',size},seed);
   if(!(r.won||r.died||r.timedOut)||r.peakVisibleEnemies>4)throw Error('Unresolved or overflow');
   rows.push({seed,actor:a.seed,size,won:!!r.won,timeout:!!r.timedOut,seconds:r.seconds,firstKill:r.firstKillSeconds,secondary:r.secondaryTargetDamage,dot:r.secondaryDotDamage,infusion:r.infusionHits,funded:r.fundedCasts,mana:r.manaSpent,effects:r.graveBloomMetrics||{},roster:hash(JSON.stringify(r.roster)),gear:r.gearFingerprint,xp:r.talentXp});
  }
 }
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({stage:'6.47',variant,profile,shard,fingerprint,entrants:entrants.map(({s,...e})=>e),rows},null,2));
 console.log('STAGE647_SHARD='+JSON.stringify({variant,profile,shard,actors:entrants.map(e=>({seed:e.seed,weapon:e.weapon,points:e.points})),groups:[1,4,8,12].map(size=>{const a=rows.filter(r=>r.size===size);return {size,n:a.length,wins:a.filter(r=>r.won).length,timeouts:a.filter(r=>r.timeout).length,blooms:a.reduce((n,r)=>n+(r.effects.graveBloomActivations||0),0)};})}));
}
if(require.main===module)main();
module.exports={transform,scenarios};
