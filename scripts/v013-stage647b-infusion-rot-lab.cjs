'use strict';
// Historical baseline and isolated candidate experiments, never patch a user's checkout.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const scenarios={baseline:null,'one-one':{seed:1,spread:1,burst:1},'two-two-half':{seed:2,spread:2,burst:.5},'two-two-full':{seed:2,spread:2,burst:1}};
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function one(s,a,b,label){if(s.split(a).length!==2)throw Error('Grave Bloom anchor '+label);return s.replace(a,b);}
function transform(runtime,build,cfg){
 // Independently instrument actual Rot ticking, including the baseline.
 runtime=one(runtime," secondaryHit(enemy,amount){return r.enemies?.includes(enemy)?v013SecondaryHit(r,enemy,amount):0;},",
 " metric(key,n){ports.phase6Metric(r,key,n);},\n link(kind,source,targets){ports.combatLinkEffect?.(r,kind,source,targets);},\n secondaryHit(enemy,amount){return r.enemies?.includes(enemy)?v013SecondaryHit(r,enemy,amount):0;},","native context");
 build=one(build,"const secondaryFraction=baseRot>0?secondaryRot/baseRot:0;","const secondaryFraction=baseRot>0?secondaryRot/baseRot:0;\n  const bloomRot=rot.filter(s=>s.secondaryOrigin==='grave_bloom');if(bloomRot.length){c.metric?.('graveBloomRotTicks',bloomRot.length);c.metric?.('graveBloomRotRawTickDamage',bloomRot.reduce((n,s)=>n+s.damage,0));}","real tick probe");
 if(!cfg)return {runtime,build};
 const old=runtime.slice(runtime.indexOf('function v013GraveBloomPulse('),runtime.indexOf('function groupElementalEffects('));
 if(!old.startsWith('function v013GraveBloomPulse')||!old.includes('groupSecondaryDamage'))throw Error('Wrong runtime baseline');
 runtime=one(runtime,old,'','retire old resolver');
 runtime=one(runtime,"if(cast&&(learned('spell_echo')||prepared('grave_bloom'))){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount){const echo=learned('spell_echo')?Math.max(1,Math.round(damage*.1*learned('spell_echo'))):0;damage+=echo;if(echo)ports.floatText(echo,'enemy',false,'ECHO',e);damage+=v013GraveBloomPulse(r,e,s.spellPower||0);}}",
 "if(cast&&learned('spell_echo')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount){const echo=Math.max(1,Math.round(damage*.1*learned('spell_echo')));damage+=echo;if(echo)ports.floatText(echo,'enemy',false,'ECHO',e);}}","weapon spell echo only");
 runtime=one(runtime,"if(learned('spell_echo')||prepared('grave_bloom')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount){if(learned('spell_echo'))spellDamage+=Math.max(1,Math.round(spellDamage*.1*learned('spell_echo')));spellDamage+=v013GraveBloomPulse(r,r.enemy,ctx.power||0);}}",
 "if(learned('spell_echo')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount)spellDamage+=Math.max(1,Math.round(spellDamage*.1*learned('spell_echo')));}","elemental spell echo only");
 const start=build.indexOf("  if(r.prepared==='grave_bloom'){",build.indexOf('function onInfusionHit(')),end=build.indexOf('\n  }\n }',start);
 if(start<0||end<0)throw Error('Physical legacy block not found');
 build=build.slice(0,start)+build.slice(end+4);
 const helper=[
  '// Exactly once per actually consumed paid Infusion charge, independent of weapon.',
  'function graveBloomInfusion(b,c){',
  " if(b?.runtime?.prepared!=='grave_bloom'||!specialized(b,'grave_bloom')||c.proc||c.extra||c.recursive||c.offhand)return 0;",
  ' const e=c.enemy,power=Math.max(0,Number(c.power)||0);if(!e||e.hp<=0||!(power>0))return 0;',
  " const cap=specialized(b,'rot_focus')?3:6;",
  ' for(let i=0;i<'+cfg.seed+';i++){applyRot(b,c,power*.16);c.metric?.("graveBloomSeeds",1);}',
  ' const rot=(e.v012Rot||[]).filter(d=>d.remaining>0&&d.damage>0);',
  ' if(!rot.length)return 0;',
  ' const total=rot.reduce((n,d)=>n+d.damage,0),limit=e.maxhp*(e.boss?.035:e.miniboss?.07:.22);',
  ' const amount=Math.max(1,Math.round(Math.min(limit,total*'+cfg.burst+')));',
  " activated(b,'grave_bloom');c.trigger?.('grave_bloom');c.metric?.('graveBloomActivations',1);c.metric?.('graveBloomStackCount',rot.length);",
  ' const before=e.hp;c.damage(amount,"☠ Grave Bloom");',
  " c.metric?.('graveBloomBurstDamage',Math.max(0,before-Math.max(0,e.hp)));",
  ' const sources=rot.filter(d=>!d.spread&&!d.transferred).sort((a,b)=>b.damage-a.damage).slice(0,'+cfg.spread+');',
  ' const targets=(c.player?.enemies||[]).filter(t=>t!==e&&t.hp>0).slice(0,2);',
  ' for(const target of targets){',
  '  target.v012Rot??=[];',
  '  for(const source of sources){',
  '   if(target.v012Rot.length>=cap)break;',
  '   target.v012Rot.push({damage:Math.max(1,Math.round(source.damage*.75)),remaining:Math.min(3,source.remaining),ticks:0,spread:true,secondaryOrigin:"grave_bloom"});',
  "   c.metric?.('graveBloomSpread',1);",
  '  }',
  "  c.link?.('rot',e,[target]);",
  ' }',
  ' return amount;',
  '}'
 ].join('\n');
 build=one(build,'function onInfusionHit(b,c){',helper+'\nfunction onInfusionHit(b,c){','infusion resolver');
 // Execute after charge consumption, before the caster duplicate-callback return.
 // Resolve Bloom before ordinary Infusion damage so a lethal Infusion cannot silently skip the paid effect.
 build=one(build," const amount=Math.round(elementalPower(b,power)*cfg.power);\n if(amount>0)c.damage(amount,'✨ Arcane Infusion');"," const amount=Math.round(elementalPower(b,power)*cfg.power);\n graveBloomInfusion(b,c);\n if(amount>0&&c.enemy.hp>0)c.damage(amount,'✨ Arcane Infusion');","paid hit");
 new vm.Script(runtime);new vm.Script(build);return {runtime,build};
}
function install(variant){
 if(!Object.hasOwn(scenarios,variant))throw Error('Unknown variant');
 // Only allowed in GitHub Actions checkout explicitly created for this experiment.
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.STAGE647B_ISOLATED!=='1')throw Error('Candidate patch requires isolated CI checkout');
 const a='combat/v012-combat-runtime.js',b='combat/v012-buildcraft.js';
 const out=transform(read(a),read(b),scenarios[variant]);
 for(const [p,s] of [[a,out.runtime],[b,out.build]])for(const prefix of ['', 'docs/'])fs.writeFileSync(path.join(root,prefix+p),s);
 const p='scripts/simulate-progression.cjs',s=read(p);
 fs.writeFileSync(path.join(root,p),one(s,'const row={weaponStatusMetrics:','const row={graveBloomMetrics:Object.fromEntries(Object.entries(metrics).filter(([k])=>k.startsWith("graveBloom"))),weaponStatusMetrics:','telemetry'));
 return hash(out.runtime+out.build);
}
function respec(s,profile){
 const T=globalThis.WandererAutomaticTalents,P=require('./v013-build-planner.cjs');
 const weapon=s.state.equip.weapon?.subtype,reset=T.reset(s.state.automaticTalents);
 if(profile==='decay-blood-spread'&&weapon!=='Sword'||profile==='magic-decay-bloom'&&!['Wand','Staff'].includes(weapon))return null;
 const p=P.propose(T,reset,{primary:'magic',secondary:'decay',secondAt:1,model:'two',mix:true,element:'arcane',weapons:[weapon],armor:profile==='magic-decay-bloom'?'Cloth':'Leather',milestones:['grave_bloom'],orderedMilestones:true,focus:'rot'});
 const purchased={...reset,nodes:p.expectedNodes,prepared:'grave_bloom'};
 if(!purchased.nodes.includes('grave_bloom')||!T.valid(purchased))return null;
 return {...s,talentSpent:purchased.nodes.length,state:{...s.state,automaticTalents:purchased}};
}
function main(){
 const [variant,profile,shardText,input,out]=process.argv.slice(2);
 if(profile==='--preflight'){install(variant);console.log('STAGE647B_PATCH_OK '+variant);return;}
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
   rows.push({seed,actor:a.seed,size,won:!!r.won,timeout:!!r.timedOut,seconds:r.seconds,firstKill:r.firstKillSeconds,secondary:r.secondaryTargetDamage,dot:r.secondaryDotDamage,infusion:r.infusionHits,funded:r.fundedCasts,mana:r.manaSpent,taken:r.damageTaken,secondsAlive:r.seconds,effects:r.graveBloomMetrics||{},roster:hash(JSON.stringify(r.roster)),gear:r.gearFingerprint,xp:r.talentXp});
  }
 }
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({stage:'6.47B',variant,profile,shard,fingerprint,entrants:entrants.map(({s,...e})=>e),rows},null,2));
 console.log('STAGE647B_SHARD='+JSON.stringify({variant,profile,shard,actors:entrants.map(e=>({seed:e.seed,weapon:e.weapon,points:e.points})),groups:[1,4,8,12].map(size=>{const a=rows.filter(r=>r.size===size);return {size,n:a.length,wins:a.filter(r=>r.won).length,timeouts:a.filter(r=>r.timeout).length,blooms:a.reduce((n,r)=>n+(r.effects.graveBloomActivations||0),0)};})}));
}
if(require.main===module)main();
module.exports={transform,scenarios};
