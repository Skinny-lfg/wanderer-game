// Research-only matrix: real integrated combat + passive drafts, no production caps/saves changed.
// Levels above E200 use E200 session plumbing with projected E>200 enemy stats and synthetic RAM gear.
'use strict';
const fs=require('node:fs'), crypto=require('node:crypto'), create=require('../tests/v012-economy-harness.cjs');
const original=fs.readFileSync('combat/v012-combat-core.js','utf8');
const anchor='const base={hp:27+level*14,atk:4+level*3,def:1+level*.62};';
if(!original.includes(anchor))throw Error('Combat-core scaling anchor changed; abort rather than simulate different rules');
const strategies={
  sustain:{families:['vitality','aegis','blood','fury','decay','magic'],picks:['renewal','strong_heart','second_breath','life_bloom','fortified','barrier_pulse','iron_skin','blood_drinker','guarded_block']},
  offense:{families:['blood','fury','decay','magic','vitality','aegis'],picks:['bleeding_edge','toxic_touch','deep_cuts','quick_hands','precision','double_strike','brutal_crit','virulent_rot','arcane_focus']}
};
const arms=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'];
const initial=['blood','decay','vitality','aegis','fury','magic'];
const levels=[200,250,300,500,1000];
const models=['cap-200','linear-both','soft-both','soft-enemy-125','soft-enemy-150','linear-enemy-soft-gear'];
function curve(E,mode){const d=Math.max(0,E-200);return mode==='soft'?200+110*Math.log1p(d/110):E;}
function pair(E,model){
 if(model==='cap-200')return {enemy:E,gear:200};
 if(model==='linear-both')return {enemy:E,gear:E};
 if(model==='soft-both')return {enemy:curve(E,'soft'),gear:curve(E,'soft')};
 if(model==='soft-enemy-125')return {enemy:200+1.25*(curve(E,'soft')-200),gear:curve(E,'soft')};
 if(model==='soft-enemy-150')return {enemy:200+1.50*(curve(E,'soft')-200),gear:curve(E,'soft')};
 return {enemy:E,gear:curve(E,'soft')};
}
function run(E,model,seed,variant,rarity){
 const {enemy,gear}=pair(E,model),gearRatio=variant==='under'?.80:variant==='over'?1.20:1;
 const gearTier=Math.max(1,Math.round(gear*gearRatio));
 const patched=original.replace(anchor,
  'const __level=level===200?'+JSON.stringify(enemy)+':level;const base={hp:27+__level*14,atk:4+__level*3,def:1+__level*.62};');
 const a=create(seed+E*997,undefined,{'combat/v012-combat-core.js':patched});
 const p=strategies[seed%2?'sustain':'offense'],weapon=arms[(seed+Math.floor(E/50))%arms.length];
 const family=initial[(seed+Math.floor(E/50))%initial.length],state=a.state(),g=a.controller().state;
 a.setup(gearTier,weapon,rarity);
 const runeTier=Math.min(200,gearTier),rf=['vitality','warding',weapon==='Staff'||weapon==='Wand'?'wisdom':'might'];
 state.runes=rf.map(f=>a.makeRune(f,runeTier));state.runeSlots=state.runes.map(x=>x.id);
 g.unlocked=200;state.gold=10000;state.fragments=10000;
 a.start(200);a.initial(family);if(family==='magic')a.element(['fire','frost','lightning'][seed%3]);
 let ticks=0,waves=0,events=0,timeout=false,boss=false,picks=0,error=null;
 for(let step=0;step<35000;step++){
  if(g.stage==='finished'||g.stage==='failed')break;
  const draft=a.draft(),r=state.run,ev=a.events.run()?.event;
  if(draft){
   if(draft.step==='element')a.element(['fire','frost','lightning'][seed%3]);
   else{const offered=[...draft.options],choice=offered.sort((x,y)=>{
     const xi=p.picks.indexOf(x.id),yi=p.picks.indexOf(y.id);
     return (xi<0?99:xi)-(yi<0?99:yi);
   })[0];if(!choice||!a.passive(choice.id))throw Error('Cannot claim passive at E'+E+' '+model+' step '+step);picks++;}
  }else if(ev){if(!a.events.choose(2))throw Error('Could not decline event');events++;}
  else if(r?.status==='cleared'){if(!a.exitResult())throw Error('Cannot exit completed Realm');}
  else if(r?.status==='fight'){
   const enemyObj=r.enemy;let inner=0;
   while(state.run===r&&r.status==='fight'&&r.enemy===enemyObj&&inner++<1700){a.tick();ticks++;}
   if(inner>=1700){timeout=true;break;}
   if(enemyObj.hp<=0)waves++;if(enemyObj.boss)boss=true;
   a.flush();
  }else if(r?.status==='ready'){a.flush();}
  else if(g.stage==='choice'&&!r){
   // Discard only at Between Realms, where the real UI permits bag decisions.
   while(a.bag.overflow()>0){const last=a.bag.items().at(-1);if(!last||!a.bag.discard(last.id))throw Error('Could not resolve bag overflow at Between Realms');}
   // This is a playstyle hypothesis, not an optimal solver. No free rerolls.
   const offer=[...g.offers].sort((x,y)=>{
    const ix=p.families.indexOf(x.family),iy=p.families.indexOf(y.family);
    return (ix<0?99:ix)-(iy<0?99:iy)||(x.waves-y.waves);
   })[0];
   if(!offer)throw Error('No offer');
   a.select(offer.id);a.enter();
  }else if(g.stage==='combat'&&!r){a.flush();}
  else {error='Unresolved state '+g.stage+' / '+(r?.status||'none');break;}
 }
 return {E,model,seed,variant,rarity,weapon,family,enemyEquivalent:+enemy.toFixed(1),gearEquivalent:gearTier,
  won:g.stage==='finished',plane:g.history.length,boss,waves,events,picks,seconds:+(ticks*.11).toFixed(1),timeout,error};
}
const result=[];const limit=Number(process.env.WANDERER_ENDLESS_CASE_LIMIT||0);
outer:for(const E of levels)for(const model of models)for(const variant of ['under','equal','over'])for(let seed=1;seed<=16;seed++){
 result.push(run(E,model,seed,variant,seed%2?'Rare':'Epic'));
 if(limit&&result.length>=limit)break outer;
}
const groups=[];
for(const E of levels)for(const model of models){
 const a=result.filter(x=>x.E===E&&x.model===model);if(!a.length)continue;
 groups.push({E,model,n:a.length,wins:a.filter(x=>x.won).length,stalls:a.filter(x=>x.timeout).length,
  meanPlane:+(a.reduce((n,x)=>n+x.plane,0)/a.length).toFixed(2),
  meanSeconds:+(a.reduce((n,x)=>n+x.seconds,0)/a.length).toFixed(1),
  meanGearEquivalent:+(a.reduce((n,x)=>n+x.gearEquivalent,0)/a.length).toFixed(0)});
}
const summary={type:'actual-integrated-combat-with-synthetic-future-levels',sourceHash:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),
  completeRuns:result.length,errors:result.filter(x=>x.error).length,timeouts:result.filter(x=>x.timeout).length,groups,rows:result};
const target=process.argv[2]||'/tmp/wanderer-endless-combat.json';
fs.writeFileSync(target,JSON.stringify(summary,null,2)+'\n');
console.log('ENDLESS_COMBAT_SUMMARY '+JSON.stringify({cases:summary.completeRuns,errors:summary.errors,timeouts:summary.timeouts,groups}));
if(summary.errors||summary.timeouts)process.exitCode=1;
