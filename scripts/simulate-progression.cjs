'use strict';
// Exploratory simulation only: production scaling and saves are untouched.
const fs=require('node:fs'),path=require('node:path'),create=require('../tests/v012-economy-harness.cjs');
require('../combat/expedition-progression.js');require('../combat/v012-combat-core.js');require('../combat/v012-buildcraft.js');require('../combat/automatic-talents.js');require('../combat/talent-graph-next.js');require('../combat/talent-graph-bridge.js');require('../combat/talent-graph-runtime.js');
const T=globalThis.WandererAutomaticTalents;
function buy(p,id){const n=T.NODES.find(n=>n.id===id);if(!n)throw Error('Unknown node '+id);for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.nodes.includes(dep))p=buy(p,dep);if(n.anyRequires&&!n.anyRequires.some(x=>p.nodes.includes(x)))p=buy(p,n.anyRequires[0]);const q=T.allocate(p,id);if(!q)throw Error('Cannot allocate '+id);return q;}
const builds=[{name:'Blood/Fury',weapon:'Daggers',skills:['deep_cuts','double_strike','crimson_rush']},{name:'Aegis/Vitality',weapon:'Mace',skills:['strong_heart','barrier_pulse','stored_force']},{name:'Magic/Decay',weapon:'Wand',skills:['blight','hex_bolt'],element:'fire'},{name:'Blood/Decay',weapon:'Two-Handed',skills:['deep_cuts','virulent_rot','carrion_detonation']}];
const bands=[[1,1],[5,1.15],[15,1.30],[35,1.45],[70,1.60]],levels=[1,5,15,35,70,100,250,1000],seeds=[9101,9102,9103];
function gearScale(level){return WandererExpeditionProgression.gearTier(level).multiplier;}
// Candidate continuous curve for exploratory testing, not production.
function enemyScale(level){return WandererExpeditionProgression.enemyReference(level);}
function run(level,build,seed,boss,previous=false){
 const a=create(seed,undefined,{}, {skipPersistence:true});a.setup(1,build.weapon,'Rare');
 const factor=gearScale(previous?Math.max(1,(bands.findLast(([min])=>min<=level)?.[0]||1)-1):level);
 for(const item of Object.values(a.state().equip))if(item)for(const k of ['atk','def','hp','str','agi','int','end','cha','mana','spell'])if(item[k])item[k]=Math.round(item[k]*factor);
 let p={...T.create(),xp:10000};for(const id of build.skills)p=buy(p,id);if(build.element){p=buy(p,'element_choice');p=T.selectElement(p,build.element);if(!p)throw Error('Cannot select element');}a.state().automaticTalents=p;
 a.start(1,true);const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);c.visitRoom(1);if(!a.enter())throw Error('Cannot enter');a.state().run.tier=level;const r=a.encounter({count:boss?1:3,boss});
 r.hp=r.maxhp;r.mp=r.maxmp;let ticks=0;while(r.status==='fight'&&r.hp>0&&ticks<1800){a.tick();ticks++;}return {won:r.status==='cleared',died:r.hp<=0,seconds:+(ticks*.11).toFixed(1),hp:Math.max(0,+(r.hp/r.maxhp*100).toFixed(1)),mana:Math.max(0,+(r.mp/(r.maxmp||1)*100).toFixed(1))};
}
const rows=[];for(const level of levels)for(const build of builds)for(const boss of [false,true])for(const seed of seeds){const result=run(level,build,seed,boss);rows.push({level,build:build.name,encounter:boss?'boss':'normal',seed,...result});}
for(const level of [5,15,35,70])for(const seed of seeds)rows.push({level,build:'Blood/Fury previous gear',encounter:'normal',seed,...run(level,builds[0],seed,false,true)});
const out=path.resolve('reports/progression-continuous-results.json');fs.writeFileSync(out,JSON.stringify({assumptions:{seeds,levels,bands,enemyCurve:'candidate reference level = E through E5; thereafter 5 × (1 + 0.2 × ln(1 + (E − 5)/5))',gear:'scale selected E1 generated equipment base stats; fixed starter character and 100 talent points; rounded per item',limits:'one three-enemy or boss encounter per run with real level-derived enemies; no potions, no full expedition, three seeds, no balance proof'},rows},null,2));
for(const level of levels){console.log('\nE'+level+' gear ×'+gearScale(level).toFixed(2)+' enemy reference '+enemyScale(level).toFixed(2));for(const build of builds)for(const boss of [false,true]){const r=rows.filter(x=>x.level===level&&x.build===build.name&&x.encounter===(boss?'boss':'normal'));console.log(build.name.padEnd(16),(boss?'boss  ':'normal'),r.filter(x=>x.won).length+'/'+r.length,'wins','mean seconds '+(r.reduce((s,x)=>s+x.seconds,0)/r.length).toFixed(1),'mean HP% '+(r.reduce((s,x)=>s+x.hp,0)/r.length).toFixed(1));}}
console.log('\nSaved '+out);
