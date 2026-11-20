'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/v012-buildcraft.js');require('../combat/talent-catalog.js');
require('../combat/talent-graph-next.js');require('../combat/talent-graph-bridge.js');require('../combat/talent-graph-runtime.js');
const B=globalThis.WandererV012Buildcraft,T=globalThis.WandererAutomaticTalents;
function buy(p,id){
 const n=T.NODES.find(x=>x.id===id);assert(n,id);
 for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.nodes.includes(dep))p=buy(p,dep);
 if(n.anyRequires&&!n.anyRequires.some(x=>p.nodes.includes(x)))p=buy(p,n.anyRequires[0]);
 const next=T.allocate(p,id);assert(next,id);return next;
}
function build(skills=[],mode='arcane'){
 let p={...T.create(),xp:10000};
 for(const id of skills)p=buy(p,id);
 if(mode!=='arcane')p=T.selectElement(p,mode);
 const b=B.create();B.syncPermanent(b,p);return b;
}
function context(){
 const events=[],enemy={hp:10000,maxhp:10000,def:0,baseDef:0,bleedStacks:0,dots:{burn:[],bleed:[]},v012Rot:[]},player={hp:100,maxhp:100,mp:40,maxmp:50};
 const c={enemy,player,now:1,power:100,base:80,random:()=>0,funded:true,magicalAction:'infusion',
  damage:(n,kind)=>events.push({type:'damage',n,kind}),barrier:n=>events.push({type:'barrier',n}),
  mana:n=>events.push({type:'mana',n}),log:msg=>events.push({type:'log',msg})};
 return {events,enemy,player,c};
}
test('Magic root cannot cast an automatic projectile and has a funded 6 Mana infusion',()=>{
 const b=build(['affinity_magic']);assert.equal(B.magicMode(b),'unattuned');
 assert.equal(B.infusionConfig(b).cost,6);assert.equal(B.infusionConfig(b).power,.85);
 assert(B.infusionReady(b,0));assert.equal(B.activateInfusion(b,0).charges,2);
 assert(!B.infusionReady(b,2),'cannot overlap active charges');
 const x=context();assert.equal(B.onInfusionHit(b,x.c),85);
 assert.equal(B.onInfusionHit(b,{...x.c,now:2}),85);
 assert.equal(B.onInfusionHit(b,{...x.c,now:3}),0,'two main attacks exhaust charges');
 assert(!B.infusionReady(b,5));assert(B.infusionReady(b,6));
 assert.equal(x.events.filter(e=>e.kind==='✨ Arcane Infusion').length,2);
});
test('An offhand strike cannot consume a charge or cause extra Magic hits',()=>{
 const b=build(['affinity_magic']),x=context();B.activateInfusion(b,0);
 assert.equal(B.onInfusionHit(b,{...x.c,offhand:true}),0);
 assert.equal(b.runtime.infusionCharges,2);
 B.onInfusionHit(b,x.c);assert.equal(b.runtime.infusionCharges,1);
 assert.equal(x.events.filter(e=>e.kind==='✨ Arcane Infusion').length,1);
});
test('Infusion expires after seven combat seconds; unspent charges never transfer',()=>{
 const b=build(['affinity_magic']),x=context();B.activateInfusion(b,0);
 x.c.now=7;assert.equal(B.onInfusionHit(b,x.c),0);
 assert.equal(b.runtime.infusionCharges,0);assert(B.infusionReady(b,7));
});
test('Choosing Arcane makes infusion stronger and cheaper; the three elements replace it with spells',()=>{
 const basic=build(['affinity_magic']),arcane=build(['element_choice']);
 assert.equal(B.magicMode(basic),'unattuned');assert.equal(B.magicMode(arcane),'arcane');
 assert.equal(B.infusionConfig(arcane).cost,5);assert.equal(B.infusionConfig(arcane).power,.95);
 for(const mode of ['fire','frost','lightning']){
  const b=build(['element_choice'],mode);assert.equal(B.magicMode(b),mode);
  assert.equal(B.infusionConfig(b),null);assert.equal(B.infusionReady(b,0),false);
 }
});
test('Aegis Runic Shield triggers on paid enchantment activation but not repeatedly on its charges',()=>{
 const b=build(['runic_shield']),x=context();B.activateInfusion(b,0);
 B.onInfusionActivation(b,x.c);
 assert.equal(x.events.filter(e=>e.type==='barrier').length,1);
 B.onInfusionHit(b,x.c);B.onInfusionHit(b,{...x.c,now:2});
 assert.equal(x.events.filter(e=>e.type==='barrier').length,1);
});
test('Decay Hex Bolt and Arcane Blight trigger against Rot on main infused hit without spending another Mana',()=>{
 const b=build(['hex_bolt','elemental_blight']),x=context();
 x.enemy.v012Rot=[{damage:8,remaining:4}];B.activateInfusion(b,0);
 B.onInfusionHit(b,x.c);
 assert(x.events.some(e=>e.kind==='☠ Hex Bolt'));
 assert(x.events.some(e=>e.kind==='✨ Arcane Blight'));
 assert.equal(x.player.mp,40,'only runtime activation spends Mana');
});
test('Magic+Decay and Magic+Aegis hybrids work without investing in element_choice',()=>{
 for(const target of ['hex_bolt','runic_shield']){
  const b=build([target]);assert.equal(B.magicMode(b),'unattuned');
  assert(!b.runtime.specializations.includes('element_choice'));
  const x=context();B.activateInfusion(b,0);
  x.enemy.v012Rot=[{damage:8,remaining:4}];
  B.onInfusionActivation(b,x.c);B.onInfusionHit(b,x.c);
  assert(target==='hex_bolt'?x.events.some(e=>e.kind==='☠ Hex Bolt'):x.events.some(e=>e.type==='barrier'));
 }
});
test('Arcane mastery restores Mana on empowered hits with its original 5-second throttle',()=>{
 const b=build(['arcane_mastery']),x=context();B.activateInfusion(b,0);
 B.onInfusionHit(b,x.c);B.onInfusionHit(b,{...x.c,now:2});
 assert.equal(x.events.filter(e=>e.type==='mana').length,1);
});
test('Infusion alone is not a spell cast and does not trigger elemental statuses',()=>{
 const b=build(['arcane_echo']),x=context();B.activateInfusion(b,0);
 B.onInfusionActivation(b,x.c);B.onInfusionHit(b,x.c);
 assert(!x.events.some(e=>/burn|chill|lightning|spell/i.test(e.kind||'')));
});
test('All production Magic Stage 6.3 modules match their GitHub Pages counterparts',()=>{
 for(const path of ['combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/talent-graph-next.js'])
  assert.equal(fs.readFileSync(path,'utf8'),fs.readFileSync('docs/'+path,'utf8'),path);
});
