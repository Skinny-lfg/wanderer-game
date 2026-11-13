'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={};vm.runInNewContext(fs.readFileSync('combat/v012-buildcraft.js','utf8')+'\n'+fs.readFileSync('combat/automatic-talents.js','utf8'),context);const talents=context.WandererAutomaticTalents;
function unlock(progress,id){const node=talents.NODES.find(n=>n.id===id);for(const requirement of node.prerequisites||[node.requires].filter(Boolean))if(!progress.nodes.includes(requirement))progress=unlock(progress,requirement);return progress.nodes.includes(id)?progress:talents.allocate(progress,id);}
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
test('the whole existing ability catalogue is available in the permanent tree',()=>{
 const catalogue=context.WandererV012Buildcraft.CATALOG;
 assert.equal(talents.NODES.filter(n=>n.passiveId&&n.rank===1).length,catalogue.length);
 assert(catalogue.every(p=>talents.NODES.some(n=>n.passiveId===p.id)));
 let p=talents.award(talents.create(),100000);assert.equal(talents.allocate(p,'passive_bleeding_edge'),null);
 p=unlock(p,'passive_bleeding_edge');assert(talents.valid(p));
 const build=context.WandererV012Buildcraft.create();context.WandererV012Buildcraft.syncPermanent(build,p);
 assert.equal(context.WandererV012Buildcraft.rank(build,'bleeding_edge'),1);
 const dots=[];context.WandererV012Buildcraft.onAttack(build,{enemy:{hp:100},base:100,critical:false,random:()=>0,now:1,dot:(kind,amount)=>dots.push({kind,amount}),log(){}});
 assert.equal(dots[0].kind,'bleed');assert(dots[0].amount>0);
 p=talents.award(p,100);p=talents.allocate(p,'passive_bleeding_edge_rank2');context.WandererV012Buildcraft.syncPermanent(build,p);assert.equal(context.WandererV012Buildcraft.rank(build,'bleeding_edge'),2);
});
test('element-specific talents only activate for the matching element',()=>{
 let p=unlock(talents.award(talents.create(),100000),'passive_kindling');
 const B=context.WandererV012Buildcraft,b=B.create();B.syncPermanent(b,p);assert.equal(B.rank(b,'kindling'),0);b.element='frost';assert.equal(B.rank(b,'kindling'),0);b.element='fire';assert.equal(B.rank(b,'kindling'),1);
});
test('talent ranks unlock in order and preserve the existing rank cap',()=>{
 let p=talents.award(talents.create(),100000);p=talents.allocate(p,'might');p=talents.allocate(p,'path_bleeding_edge_1');p=talents.allocate(p,'path_bleeding_edge_2');assert.equal(talents.allocate(p,'passive_bleeding_edge_rank2'),null);
 for(const id of ['passive_bleeding_edge','passive_bleeding_edge_rank2','passive_bleeding_edge_rank3','passive_bleeding_edge_rank4','passive_bleeding_edge_rank5'])p=talents.allocate(p,id);
 assert(talents.valid(p));const B=context.WandererV012Buildcraft,b=B.create();B.syncPermanent(b,p);assert.equal(B.rank(b,'bleeding_edge'),5);assert.equal(B.canModify(b,'bleeding_edge',.5),false);
});
test('a completed Realm grants XP once and persists it in an isolated checkpoint',()=>{
 const create=require('./v012-economy-harness.cjs'),storage=new Map();
 const game=create(17,undefined,{}, {sessionStorage:storage});game.start(1);game.initial('blood');
 const offer=game.controller().state.offers.find(p=>p.family==='blood');game.select(offer.id);assert.equal(game.enter(),true);
 while(game.controller().state.planeIndex===1){const run=game.state().run;assert(run?.enemy);run.enemy.hp=0;game.win();game.flush();}
 assert.equal(game.draft(),null,'no passive draft is created');assert.equal(game.controller().state.rewardPending,null);assert.equal(game.controller().state.offers.length,3);
 const earned=game.state().automaticTalents.xp;assert(earned>0);
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
test('purchased abilities apply to native combat and survive checkpoint restore',()=>{
 const game=require('./v012-economy-harness.cjs')(43);game.state().automaticTalents={xp:200,nodes:['might','passive_bleeding_edge']};
 game.start(1);game.initial('blood');const offer=game.controller().state.offers.find(p=>p.family==='blood');game.select(offer.id);game.enter();
 assert.equal(game.buildcraft.rank(game.build(),'bleeding_edge'),1);
 const cp=game.checkpoint.capture();game.checkpoint.restore(cp);assert.equal(game.buildcraft.rank(game.build(),'bleeding_edge'),1);
});
test('defeat and duplicate event decisions cannot repeatedly award XP',()=>{
 const create=require('./v012-economy-harness.cjs');
 const loss=create(31);loss.start();loss.initial('blood');const first=loss.controller().state.offers.find(p=>p.family==='blood');loss.select(first.id);loss.enter();loss.death();assert.equal(loss.state().automaticTalents,undefined);
 const event=create(41,undefined,{}, {skipPersistence:true});event.start();event.initial('blood');const g=event.controller().state,p=g.offers.find(x=>x.family==='blood');event.select(p.id);g.selected.event='forgotten_arsenal';g.selected.waves=0;event.enter();
 assert.equal(event.events.choose(2),true);assert.equal(event.state().automaticTalents.xp,20);assert.equal(event.events.choose(2),false);assert.equal(event.state().automaticTalents.xp,20);
});
test('an older in-progress save waiting for a passive draft resumes without one',()=>{
 const create=require('./v012-economy-harness.cjs'),storage=new Map();
 const oldRuntime=fs.readFileSync('tests/fixtures/legacy-expedition-runtime.js','utf8');
 const old=create(17,undefined,{'online/v012-expedition-runtime.js':oldRuntime},{sessionStorage:storage});
 old.start(1);old.initial('blood');const offer=old.controller().state.offers.find(p=>p.family==='blood');old.select(offer.id);old.enter();
 while(old.controller().state.planeIndex===1){old.state().run.enemy.hp=0;old.win();old.flush();}
 assert.equal(old.draft().kind,'reward');
 const restored=create(17,undefined,{}, {sessionStorage:storage});
 assert.equal(restored.debug().saveBlocked,false);assert.equal(restored.draft(),null);assert.equal(restored.controller().state.rewardPending,null);assert.equal(restored.controller().state.offers.length,3);
 assert.equal(restored.state().automaticTalents.xp,old.state().automaticTalents.xp);
});

test('attribute allocations survive XP and talent spending and cannot exceed levels',()=>{
 let p=talents.award(talents.create(),200);p=talents.allocateAttribute(p,'str');p=talents.allocate(p,'might');p=talents.award(p,100);assert.equal(p.attributes.str,1);assert.equal(talents.attributePoints(p),2);p=talents.allocateAttribute(p,'agi');p=talents.allocateAttribute(p,'agi');assert.equal(talents.allocateAttribute(p,'str'),null);assert.equal(talents.valid({...p,attributes:{str:4}}),false);assert.equal(talents.valid({...p,element:'invalid'}),false);
});
test('stat paths lead to skills, preserve legacy purchases and apply attributes',()=>{
 for(const [family,stat] of [['aegis','end'],['decay','agi'],['magic','int']]){
  const first=talents.NODES.find(n=>n.family===family&&n.passiveId&&n.rank===1),path=talents.NODES.filter(n=>n.pathFor===first.passiveId);assert.equal(path.length,2);assert(path.every(n=>n.attribute===stat));
  let progress=talents.award(talents.create(),100000);assert.equal(talents.allocate(progress,first.id),null);progress=unlock(progress,first.id);assert(talents.valid(progress));assert.equal(talents.attributeBonuses(progress)[stat],2);
 }
 const legacy={xp:200,nodes:['might','passive_bleeding_edge']};assert(talents.valid(legacy));assert.equal(talents.passiveIds(legacy)[0],'bleeding_edge');
});
