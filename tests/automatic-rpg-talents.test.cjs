'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={};vm.runInNewContext(fs.readFileSync('combat/automatic-talents.js','utf8'),context);const talents=context.WandererAutomaticTalents;
test('experience earns bounded points and nodes require their predecessors',()=>{
 let p=talents.create();assert.equal(talents.earned(p),0);assert.equal(talents.allocate(p,'might'),null);
 p=talents.award(p,200);assert.equal(talents.earned(p),2);assert.equal(talents.allocate(p,'precision'),null);
 p=talents.allocate(p,'might');p=talents.allocate(p,'precision');assert.equal(talents.allocate(p,'vitality'),null);assert(talents.valid(p));
 p=talents.reset(p);assert.equal(p.xp,200);assert.equal(p.nodes.length,0);assert.equal(talents.earned(talents.award(p,100000)),talents.MAX_POINTS);
});
test('rejects invalid, duplicated or unearned progress',()=>{
 for(const p of [{xp:-1,nodes:[]},{xp:0,nodes:['might']},{xp:200,nodes:['precision']},{xp:200,nodes:['might','might']},{xp:100,nodes:['unknown']}])assert.equal(talents.valid(p),false);
});
test('allocated talents change native derived stats',()=>{
 let p=talents.allocate(talents.award(talents.create(),100),'might');
 const s=talents.apply({attack:100,spellPower:40,maxhp:100,defense:10,crit:10,attacksPerSec:1,mana:50,manaRegen:2,blockChance:0,caster:true,synergyPower:0},p);
 assert.equal(s.attack,105);assert.equal(s.spellPower,42);assert.equal(s.maxhp,100);
});
test('a completed Realm grants XP once and persists it in an isolated checkpoint',()=>{
 const create=require('./v012-economy-harness.cjs'),storage=new Map();
 const game=create(17,undefined,{}, {sessionStorage:storage});game.start(1);game.initial('blood');
 const offer=game.controller().state.offers.find(p=>p.family==='blood');game.select(offer.id);assert.equal(game.enter(),true);
 while(game.controller().state.planeIndex===1){const run=game.state().run;assert(run?.enemy);run.enemy.hp=0;game.win();game.flush();}
 const earned=game.state().automaticTalents.xp;assert.equal(earned,24);
 const saved=JSON.parse(storage.get('wanderer_v012_local_preview'));assert.equal(saved.profile.automaticTalents.xp,earned);
 require('../online/v012-save.js');require('../online/v012-treasures.js');
 const corrupt=JSON.parse(JSON.stringify(saved));corrupt.profile.automaticTalents={xp:0,nodes:['might']};
 assert.throws(()=>globalThis.WandererV012Save.validate(corrupt,'local-playtest'),/automatic talent progress/);
 game.win();assert.equal(game.state().automaticTalents.xp,earned);
 const restored=create(17,undefined,{}, {sessionStorage:storage});assert.equal(restored.state().automaticTalents.xp,earned);
});
test('equipped permanent talents are applied to the actual game stat calculation',()=>{
 const game=require('./v012-economy-harness.cjs')(42);const before=game.baseStats();
 game.state().automaticTalents={xp:100,nodes:['might']};const after=game.baseStats();
 assert.equal(after.attack,Math.round(before.attack*1.05));
 assert.equal(after.spellPower,Math.round(before.spellPower*1.05));
});
test('defeat and duplicate event decisions cannot repeatedly award XP',()=>{
 const create=require('./v012-economy-harness.cjs');
 const loss=create(31);loss.start();loss.initial('blood');const first=loss.controller().state.offers.find(p=>p.family==='blood');loss.select(first.id);loss.enter();loss.death();assert.equal(loss.state().automaticTalents,undefined);
 const event=create(41,undefined,{}, {skipPersistence:true});event.start();event.initial('blood');const g=event.controller().state,p=g.offers.find(x=>x.family==='blood');event.select(p.id);g.selected.event='forgotten_arsenal';g.selected.waves=0;event.enter();
 assert.equal(event.events.choose(2),true);assert.equal(event.state().automaticTalents.xp,15);assert.equal(event.events.choose(2),false);assert.equal(event.state().automaticTalents.xp,15);
});
