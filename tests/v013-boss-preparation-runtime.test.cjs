'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-boss-preparation.js');
const P=globalThis.WandererV013BossPreparation;
function scenario(risk=1,seed=9312,kind='forgotten_reliquary'){
 const a=create(seed,undefined,{}, {skipPersistence:true});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[risk];c.chooseRealm(card.id);
 // Synthetic first-ring placement for an isolated event transaction. Natural generation
 // uses a later optional room, tested separately by 30k generated map invariants.
 card.nodes[1].kind=kind==='elite'?'elite':'event';card.nodes[1].event=kind==='elite'?null:kind;
 if(kind==='forgotten_reliquary')card.reliquaryRoom=1;
 if(kind==='elite'){card.objective=1;card.nodes[1].escorts=0;}
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 return {a,c,g,card,r:a.state().run};
}
test('real event pays 15% max HP and removes exactly one modifier, with no bonus reward duplication',()=>{
 const {a,c,g,card}=scenario(2,9312);
 const before=a.vitals(),cost=Math.ceil(before.maxhp*.15),ids=[...g.dungeon.foundationState.bossModifierIds],steps=g.dungeon.steps;
 assert.equal(a.events.choose(0),true);
 assert.equal(a.vitals().hp,before.hp-cost);
 assert.deepEqual([...P.effectiveModifiers(g)],ids.slice(1));
 assert.equal(g.dungeon.disabledBossModifierId,ids[0]);
 assert.equal(g.dungeon.steps,steps);assert.equal(g.dungeon.contractPaid,undefined);
 assert.equal(g.dungeon.cleared.includes(1),true);assert.equal(g.dungeon.foundationState.bossPreparation.reliquary,true);
 assert.equal(g.dungeon.foundationState.decisions.filter(x=>x.source==='reliquary').length,1);
 assert.equal(a.events.choose(0),false);
});
test('sacrifice is rejected at insufficient HP and leaves state unchanged',()=>{
 const {a,g}=scenario(1,9313);
 const stats=a.vitals(),cost=Math.ceil(stats.maxhp*.15);
 a.setVitals({...stats,hp:cost});
 const snapshot=JSON.stringify(g.dungeon.foundationState),steps=g.dungeon.steps;
 assert.equal(a.events.choose(0),false);
 assert.equal(JSON.stringify(g.dungeon.foundationState),snapshot);
 assert.equal(a.vitals().hp,cost);assert.equal(g.dungeon.steps,steps);
 assert.equal(g.stage,'combat');assert.equal(a.events.run().event.id,'forgotten_reliquary');
});
test('supply choice restores 15% max HP and 25% max Mana without disabling boss properties',()=>{
 const {a,g}=scenario(2,9314);
 const v=a.vitals();a.setVitals({...v,hp:Math.floor(v.maxhp*.50),mp:Math.floor(v.maxmp*.40)});
 const before=a.vitals(),ids=P.effectiveModifiers(g);
 assert.equal(a.events.choose(1),true);
 assert.equal(a.vitals().hp,Math.min(v.maxhp,before.hp+Math.ceil(v.maxhp*.15)));
 assert.equal(a.vitals().mp,Math.min(v.maxmp,before.mp+Math.ceil(v.maxmp*.25)));
 assert.deepEqual(P.effectiveModifiers(g),ids);
 assert.equal(g.dungeon.foundationState.bossPreparation.reliquary,false);
});
test('pass leaves boss intact, but consumes the entered room once',()=>{
 const {a,g}=scenario(2,9315);const before=JSON.stringify(g.dungeon.foundationState),ids=P.effectiveModifiers(g);
 assert.equal(a.events.choose(2),true);
 assert.deepEqual(P.effectiveModifiers(g),ids);assert.equal(g.dungeon.foundationState.bossPreparation.reliquary,false);
 assert.equal(JSON.stringify(g.dungeon.foundationState),before);assert.equal(g.dungeon.cleared.includes(1),true);
});
test('native Elite kill records preparation once and existing extraction contract still pays only on settlement',()=>{
 const {a,c,g,card,r}=scenario(1,9320,'elite');
 const before={...a.state().crafting};
 assert.equal(r.enemy.miniboss,true);r.enemy.hp=0;a.win();
 assert.equal(g.dungeon.foundationState.bossPreparation.markedElite,true);
 assert.equal(g.dungeon.foundationState.decisions.filter(x=>x.source==='markedElite').length,1);
 assert.equal(g.dungeon.cleared.includes(card.objective),true);
 assert.equal(g.dungeon.contractPaid,undefined);
 // One marked Elite kill does not directly settle the existing reagent/Essence contract.
 assert(a.state().crafting.essence>=before.essence);
});
test('native Guarded marked Elite makes real boss attacks 10% weaker, while Dangerous removes one guard',()=>{
 function bossSetup(risk,seed,prepared){
  const a=create(seed,undefined,{}, {skipPersistence:true});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
  const c=a.controller(),g=c.state,card=g.dungeon.cards[risk];c.chooseRealm(card.id);
  // Force boss into a first-ring node ONLY for isolated combat parity.
  card.nodes[1].kind='boss';card.nodes[1].event=null;card.nodes[1].escorts=risk;
  if(prepared){g.dungeon.foundationState=globalThis.WandererV013ExpeditionFoundation.applyDecision(g.dungeon.foundationState,{type:'prepare_boss',source:'markedElite'},g.dungeon.foundationManifest);}
  assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
  return {a,g,r:a.state().run};
 }
 const plain=bossSetup(0,9401,false),prepared=bossSetup(0,9401,true);
 assert.equal(prepared.r.enemy.atk,Math.max(1,Math.round(plain.r.enemy.atk*.90)));
 assert.equal(prepared.r.totalMobCount,plain.r.totalMobCount);
 const danger=bossSetup(1,9402,false),dangerPrepared=bossSetup(1,9402,true);
 assert.equal(dangerPrepared.r.totalMobCount,danger.r.totalMobCount-1);
 assert.equal(dangerPrepared.r.enemy.atk,danger.r.enemy.atk);
});
test('native Reliquary disables the real boss property, not a copy of the manifest',()=>{
 const a=create(9485,undefined,{}, {skipPersistence:true});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[2];c.chooseRealm(card.id);
 const original=[...g.dungeon.foundationState.bossModifierIds],first=original[0];
 card.nodes[1].kind='boss';card.nodes[1].event=null;
 g.dungeon.disabledBossModifierId=first;
 g.dungeon.foundationState=globalThis.WandererV013ExpeditionFoundation.applyDecision(g.dungeon.foundationState,{type:'prepare_boss',source:'reliquary'},g.dungeon.foundationManifest);
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 const r=a.state().run;
 assert.deepEqual([...r.bossModifierIds],original.slice(1));
 assert.deepEqual([...g.dungeon.foundationManifest.cards.find(x=>x.realmId===card.id).bossModifierIds],original);
});
test('Oracle reveals one new boss property and the event is not duplicated',()=>{
 const {a,g}=scenario(2,9488,'oracle_of_paths');
 const prior=P.knownModifierIds(g,g.dungeon.realm);
 assert.equal(prior.length,1);assert.equal(a.events.choose(0),true);
 assert.equal(P.knownModifierIds(g,g.dungeon.realm).length,2);
 assert.equal(g.dungeon.foundationState.decisions.filter(x=>x.type==='reveal_boss').length,1);
 assert.equal(a.events.choose(0),false);
});
test('UI includes Reliquary descriptions, boss preparation and visible discovery without revealing hidden IDs',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/forgotten_reliquary/);assert.match(html,/WandererV013BossPreparation\.status\(g\)/);
 assert.match(html,/Known boss omen/);assert.match(html,/\(disabled\)/);
 assert.match(html,/15% max HP/);assert.match(html,/Marked Elite defeated/);
 assert(html.indexOf('online/v013-boss-preparation.js')<html.indexOf('online/v012-expedition-controller.js'));
});
test('checkpoint restore preserves the one-time Reliquary change without replaying the HP sacrifice',()=>{
 const a=create(9601,undefined,{}, {skipPersistence:true});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[1];c.chooseRealm(card.id);
 // Reach the naturally generated Reliquary through legitimate known connections.
 const target=card.reliquaryRoom,edges=card.edges.filter(([x,y])=>!(x===card.shortcut&&y===x+1||y===card.shortcut&&x===y+1));
 const paths=[[0]],seen=new Set([0]);let route=[];
 for(const path of paths){const last=path.at(-1);if(last===target){route=path;break;}for(const [x,y] of edges){const next=x===last?y:y===last?x:null;if(next!==null&&!seen.has(next)){seen.add(next);paths.push([...path,next]);}}}
 assert(route.length>0);
 g.dungeon.visited=route.slice(0,-1);g.dungeon.cleared=[...g.dungeon.visited];g.dungeon.current=route.length===2?0:route.at(-2);
 assert(c.visitRoom(target));assert(a.enter());
 const before=a.vitals();assert.equal(a.events.choose(0),true);
 const after=a.vitals(),disabled=g.dungeon.disabledBossModifierId;
 const snap=a.checkpoint.capture();assert.equal(a.checkpoint.restore(snap),undefined);
 const restored=a.controller().state.dungeon;
 assert.equal(restored.disabledBossModifierId,disabled);
 assert.equal(restored.foundationState.bossPreparation.reliquary,true);
 assert.deepEqual([...P.effectiveModifiers(a.controller().state)],[...restored.foundationState.bossModifierIds.slice(1)]);
 assert.equal(a.vitals().hp,after.hp);
 assert.equal(before.hp-after.hp,Math.ceil(before.maxhp*.15));
});
test('simulator preparation diagnostic uses same native boss and reports all four strategies',()=>{
 const sim=require('../scripts/simulate-progression.cjs');
 const report=sim.simulate({...sim.DEFAULTS,mode:'bossprep',levels:[35],seeds:[9101],builds:['blood-fury']});
 assert.deepEqual(report.rows.map(x=>x.kind),['baseline','marked_elite','reliquary','both']);
 assert.equal(report.summary.errors,0);assert.equal(report.summary.timeouts,0);
 assert.equal(report.rows[0].preparationCostHp,0);assert.equal(report.rows[1].preparationCostHp,0);
 assert(report.rows[2].preparationCostHp>0);assert.equal(report.rows[3].preparationCostHp,report.rows[2].preparationCostHp);
 assert.equal(report.rows[0].initialEnemies,report.rows[2].initialEnemies);
 assert.equal(report.rows[0].initialEnemies-1,report.rows[1].initialEnemies);
 assert.equal(report.rows[0].initialEnemies-1,report.rows[3].initialEnemies);
 assert.equal(report.rows[0].bossModifierIds.length,2);
 assert.equal(report.rows[2].bossModifierIds.length,1);
 assert.equal(report.rows[3].bossModifierIds.length,1);
});
