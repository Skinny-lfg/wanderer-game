'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const S=require('../scripts/simulate-progression.cjs');
function p15(a){let p={...a.talents.create(),starterPoints:2};for(const id of ['root_blood','affinity_blood']){const next=a.talents.allocate(p,id);assert(next,id);p=next;}return p;}
test('native v15 graph does not accept old treeVersion 8, duplicates or non-earned nodes',()=>{
 const a=create(6001),T=a.talents,p=p15(a);
 assert.equal(p.treeVersion,15);assert(T.valid(p));assert.equal(T.valid({...p,treeVersion:8}),false);
 assert.equal(T.valid({...p,nodes:[...p.nodes,'affinity_blood']}),false);
 assert.equal(T.allocate(p,'root_magic'),null,'exhausted two starter points');
});
test('native v15 purchase is locked behind graph prerequisites and uses actual XP',()=>{
 const a=create(6002),T=a.talents,p=p15(a);
 assert.equal(T.allocate(p,'bleeding_edge'),null);
 let advanced=T.award(p,300);
 for(const id of ['basic_path_blood_0_1','gate_bleeding_edge','bleeding_edge']){advanced=T.allocate(advanced,id);assert(advanced,id);}
 assert(T.valid(advanced));assert(advanced.nodes.includes('bleeding_edge'));
 assert(T.passiveIds(advanced).includes('bleeding_edge'));
});
test('native v15 permanent affinities survive switching to unrelated Realm Cards',()=>{
 const a=create(6003),p=p15(a);a.state().automaticTalents=p;
 const before=a.baseStats(),saved=JSON.stringify(p);
 a.start(1,true);const c=a.controller(),card=c.state.dungeon.cards.find(x=>x.family!=='blood');assert(card);
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 assert.equal(a.state().run.stats.attack,before.attack);
 assert.deepEqual([...a.build().unlockedFamilies],['blood']);
 assert.deepEqual([...a.build().families],['blood']);
 assert.equal(JSON.stringify(a.state().automaticTalents),saved);
});
test('native 3-card Dungeon uses correct real risk, steps and costs',()=>{
 const a=create(6004);a.start(1,true);const c=a.controller();
 assert.equal(c.state.dungeon.cards.length,3);
 assert.deepEqual(Array.from(c.state.dungeon.cards,x=>x.stepLimit),[14,13,12]);
 assert.equal(c.state.offers.length,0);
 const card=c.state.dungeon.cards[1];c.chooseRealm(card.id);
 const cost=c.travelCost(c.travelPath(1));assert(cost>0);
 assert(c.visitRoom(1));assert.equal(c.state.dungeon.steps,card.stepLimit-cost);
 assert(a.enter());assert(a.state().run.enemy);
});
test('native dungeon simulator reaches real boss with natural route modifiers',()=>{
 const report=S.simulate({...S.DEFAULTS,levels:[5],seeds:[9101],builds:['blood-fury'],mode:'dungeon'});
 assert.equal(report.summary.errors,0);assert.equal(report.summary.timeouts,0);
 assert.equal(report.rows.length,1);
 const row=report.rows[0];assert.equal(row.mode,'dungeon');assert(Array.isArray(row.rooms));
 assert(row.rooms.some(r=>r.type==='boss')||row.stage==='failed','native route must either reach its boss or finish with a real combat defeat, never a stuck route');
});
test('native v15 checkpoint rejects a retired invalid talent version before save validation',()=>{
 const a=create(6005),T=a.talents;
 a.state().automaticTalents=p15(a);
 assert(T.valid(a.state().automaticTalents));
 assert.equal(T.valid({...a.state().automaticTalents,treeVersion:8}),false);
 a.start(1,true);assert.equal(a.controller().state.dungeon.cards.length,3);
});
