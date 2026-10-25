const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
const fs=require('node:fs'),vm=require('node:vm');
const env={};vm.runInNewContext(fs.readFileSync('combat/v012-buildcraft.js','utf8'),env);const B=env.WandererV012Buildcraft;
test('one existing initial passive per family; Magic needs its element before starter or upgrades',()=>{
 for(const family of B.FAMILIES){const b=B.create();b.families=[family];
  if(family==='magic'){assert.equal(B.eligible(b,family).length,0);assert.throws(()=>B.initial(b,family),/unavailable/);B.element(b,'lightning');}
  const p=B.initial(b,family);assert.equal(p.family,family);assert.equal(b.picks.length,1);assert.equal(b.initialPassive,p.id);
  assert.equal(B.initial(b,family),null,'starter cannot be awarded twice');assert.equal(b.picks.length,1);B.clear(b);assert.equal(b.initialFamily,null);assert.equal(b.initialPassive,null);assert.equal(b.picks.length,0);
 }
 for(const element of B.ELEMENTS){const b=B.create();b.families=['magic'];B.element(b,element);const p=B.initial(b,'magic');assert.equal(p.element,element);assert(B.eligible(b,'magic').some(p=>p.id==='mana_spring'));}
});
test('first successful Realm grants its starter AND a normal choice before Exit Realm',()=>{
 const a=create(90);a.start(1);assert.equal(a.controller().state.offers.length,0);
 a.initial('blood');assert.equal(a.build().picks.length,0,'selection grants no power');
 a.select(a.controller().state.offers.find(o=>o.family==='blood').id);
 assert.equal(a.state().run,null);a.enter();assert(a.state().run);
 assert.equal(a.build().picks.length,0,'entering grants no power');
 const waves=a.state().run.planeWaves;
 for(let n=0;n<waves;n++){a.state().run.enemy.hp=0;a.win();a.flush();}
 assert.equal(a.draft().kind,'reward');assert.equal(a.build().initialPassive,'bleeding_edge');
 assert.equal(a.build().picks.length,1);assert.equal(a.state().run.status,'cleared');
 const id=a.draft().options[0].id;assert.equal(a.exitResult(),false,'cannot leave before picking');
 assert.equal(a.passive(id),true);assert.equal(a.build().picks.length,2);
 assert.equal(a.passive(id),false,'reward cannot be claimed twice');
 assert.equal(a.exitResult(),true);assert.equal(a.state().run,null);
 assert.equal(a.controller().state.offers.length,3);
});
test('later Magic acquisition chooses only an element before entry, with its next passive after the Realm',()=>{
 const a=create(50);a.start();a.initial('blood');const c=a.controller();
 // Scheduler fixture: select a legal Magic offer, without adding a free passive.
 if(!c.state.offers.some(o=>o.family==='magic')){c.state.offers[1]={id:'storm',name:'Storm',image:'storm.webp',family:'magic',waves:1,elite:false,boss:false,event:null};}
 a.select(c.state.offers.find(o=>o.family==='magic').id);assert.equal(a.build().element,null);assert.equal(a.build().families.includes('magic'),false);
 a.enter();assert.equal(a.draft().kind,'entry');assert.equal(a.state().run,null);a.element('fire');
 assert(a.state().run);assert.equal(a.build().picks.length,0);assert.equal(a.build().element,'fire');assert.equal(a.element('frost'),false);
});
test('hybrid passives reuse exactly the two simplified affinity icons; families stay separate from gear',()=>{
 const a=create(),hybrid=a.catalog.find(p=>p.id==='plague_rupture'),icons=a.passiveIcons(hybrid);
 assert.equal((icons.match(/role="img"/g)||[]).length,2);assert(icons.includes('Blood affinity'));assert(icons.includes('Decay affinity'));assert(icons.includes('itemAffinityGlyph'));
 a.start();a.initial('decay');assert.equal(a.build().initialPassive,null,'Decay requires a victory to unlock');assert(Object.values(a.baseStats().counts).every(n=>n===0));
});
