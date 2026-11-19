'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const C=require('../scripts/v013-stage5-starter-comparison.cjs');

test('Only the three native starter item definitions change; all other gear rules stay byte-identical',()=>{
 const changed=C.adjustedStarterSource();
 assert.notEqual(changed,C.SOURCE);
 assert.equal(changed
  .replace("if(slot==='weapon')return {...base,subtype:'Sword',name:'Old Sword',atk:4};",
    "if(slot==='weapon')return {...base,subtype:'Sword',name:'Old Sword',atk:3};")
  .replace("if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:2};",
    "if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:1};")
  .replace("if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:8};",
    "if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:4};"),
  C.SOURCE);
 assert.throws(()=>C.adjustedStarterSource('not the current gear rules'),/Starter rule drift/);
});
test('Native initial gear is adjusted, without altering loot generated from the same seed',()=>{
 const altered={'economy/v013-gear-rolls.js':C.adjustedStarterSource()};
 const control=C.gearProbe(),changed=C.gearProbe(altered);
 assert.deepEqual(control.items.map(x=>[x.atk,x.def,x.hp]),[[3,0,0],[0,1,0],[0,0,4]]);
 assert.deepEqual(changed.items.map(x=>[x.atk,x.def,x.hp]),[[4,0,0],[0,2,0],[0,0,8]]);
 assert.equal(changed.hero.maxhp,control.hero.maxhp+4);
 assert.equal(changed.hero.attack,control.hero.attack+1);
 assert.equal(changed.hero.defense,control.hero.defense+1);
 for(const pair of control.items.map((x,i)=>[x,changed.items[i]])){
  assert.equal(pair[0].startingGear,true);
  assert.equal(pair[1].recoveryStarter,true);
  assert.equal(pair[0].name,pair[1].name);
 }
 const a=create(777,undefined,{}, {skipPersistence:true,now:1720000000777});
 const b=create(777,undefined,altered,{skipPersistence:true,now:1720000000777});
 const first=a.makeItem(1,'weapon',null,'loot','Sword','Common');
 const second=b.makeItem(1,'weapon',null,'loot','Sword','Common');
 assert.deepEqual(JSON.parse(JSON.stringify(first)),JSON.parse(JSON.stringify(second)),
  'Native deterministic Common loot still identical, including stats and source');
});
test('Natural runner accepts isolated module overrides with no changes to production account constructor',()=>{
 const cfg=N.parseArgs(['--seeds=9101','--profiles=cautious','--max-level=1','--max-attempts=1']);
 assert.equal(cfg.maxAttempts,1);
 const control=N.run(cfg);
 const modified=N.run(cfg,{moduleOverrides:{'economy/v013-gear-rolls.js':C.adjustedStarterSource()}});
 assert.equal(control.coverage.accounts,1);
 assert.equal(modified.coverage.accounts,1);
 assert.equal(control.coverage.errors,0);
 assert.equal(modified.coverage.errors,0);
 assert.equal(control.accounts[0].initialGear.starter,3);
 assert.equal(modified.accounts[0].initialGear.starter,3);
 assert.equal(modified.accounts[0].startXp,0);
});
test('Paired summary distinguishes earlier success, later success, and no victory',()=>{
 const base={accounts:[{seed:1,profile:'cautious',won:true,wonOnAttempt:5,firstFightLossPct:65,starterRemaining:1},
  {seed:2,profile:'balanced',won:false,wonOnAttempt:null,firstFightLossPct:50,starterRemaining:2}]};
 const adjusted={accounts:[{seed:1,profile:'cautious',won:true,wonOnAttempt:3,firstFightLossPct:55,starterRemaining:1},
  {seed:2,profile:'balanced',won:true,wonOnAttempt:4,firstFightLossPct:45,starterRemaining:1}]};
 const diff=C.pairSummary(base,adjusted);
 assert.equal(diff.matched,2);
 assert.equal(diff.improvedOnly,1);
 assert.equal(diff.bothWin,1);
 assert.equal(diff.bothWinSoonerAdjusted,1);
 assert.equal(diff.worsenedOnly,0);
 assert.equal(diff.meanPairedFirstFightLossDifference,-7.5);
});
