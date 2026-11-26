'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../online/v012-consumables.js');
require('../combat/v012-combat-core.js');
require('../combat/v012-buildcraft.js');
const P=globalThis.WandererV012Consumables,C=globalThis.WandererV012CombatCore,B=globalThis.WandererV012Buildcraft,create=require('./v012-economy-harness.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('R5 catalog expands to 21, retains rarity bucket mass and caps three unique progression doses',()=>{
 assert.equal(P.CATALOG.length,21);
 for(const id of ['wisdom','rejuvenation','withering','precision','phantom','prospector','executioner','renewal'])assert(P.CATALOG.some(p=>p.id===id));
 assert.equal(P.CATALOG.filter(p=>p.rarity==='Rare').length,9);
 assert.equal(P.CATALOG.filter(p=>p.rarity==='Epic').length,3);
 assert.deepEqual(P.selection({fortune:1,wisdom:1,prospector:1},['fortune','wisdom','prospector']),['fortune','wisdom','prospector']);
 for(const id of P.UNIQUE)assert.throws(()=>P.selection({[id]:2},[id,id]));
 close(Object.values(P.OFFER_PROBABILITIES).reduce((a,b)=>a+b),1);
});
test('native loadout auto consumes Fortune Wisdom and Prospector once; no returns',()=>{
 const a=create(8501,undefined,{}, {skipPersistence:true}),s=a.state();
 s.consumables={fortune:1,wisdom:1,prospector:1};s.potionSelection=['fortune','wisdom','prospector'];
 a.start(1,true);assert(a.potions.start());assert(a.potions.start());
 const r=a.events.run();assert.deepEqual(clone(r.effects),{fortune:true,wisdom:true,prospector:true});assert(r.potions.every(p=>p.used));assert.equal(r.potions.length,3);
 a.potions.finish('extracted');assert.deepEqual(clone(s.consumables),{fortune:0,wisdom:0,prospector:0});
});
test('stat modifiers add percentage points and snapshot DoT potency once',()=>{
 const base={crit:15,dotPower:0,evasionRating:0};
 const s=C.applyExpeditionModifiers(base,{withering:{power:.15,remaining:3},precision:{power:.05,remaining:3},phantom:{power:.05,remaining:3},executioner:{power:.15,remaining:3}});
 assert.equal(s.crit,20);close(B.dotPotency(100,s),115);close(C.potionEvasion(.15,s.evasionBonus),.20);
 assert.equal(C.potionEvasion(.43,s.evasionBonus),.45);assert.equal(C.applyExpeditionModifiers({crit:98},{precision:{power:.05,remaining:3}}).crit,100);
 close(C.executionerFactor(s,{boss:true}),1.15);close(C.executionerFactor(s,{miniboss:true}),1.15);assert.equal(C.executionerFactor(s,{}),1);assert.equal(C.executionerFactor(s,{boss:true,stage84Node:true}),1);
 assert.equal(C.applyExpeditionModifiers(base,{withering:{power:.15,remaining:0}}).dotPower,0);
 assert.equal(base.crit,15);
});
test('executioner duration advances only on eligible combat; renewal expires after one',()=>{
 const a=create(8502,undefined,{}, {skipPersistence:true});a.start(1,true);
 const effects=a.events.run().effects;Object.assign(effects,{executioner:{power:.15,remaining:3},renewal:{power:.03,remaining:1},withering:{power:.15,remaining:3}});
 a.potions.tick();assert.equal(effects.executioner.remaining,3);assert.equal(effects.renewal.remaining,0);assert.equal(effects.withering.remaining,2);
 a.potions.tick(true);assert.equal(effects.executioner.remaining,2);a.potions.tick(true);a.potions.tick(true);assert.equal(effects.executioner.remaining,0);
});
test('new consumable selection survives actual checkpoint restore and unused doses return',()=>{
 const a=create(8503,undefined,{}, {skipPersistence:true}),s=a.state();
 s.consumables={wisdom:1,rejuvenation:1,phantom:1};s.potionSelection=['wisdom','rejuvenation','phantom'];
 a.start(1,true);assert(a.potions.start());
 const cp=a.checkpoint.capture();a.checkpoint.restore(cp);assert.equal(a.events.run().effects.wisdom,true);
 assert.deepEqual(clone(a.events.run().potions.map(p=>p.kind)),['wisdom','rejuvenation','phantom']);
 a.potions.finish('extracted');assert.equal(a.state().consumables.wisdom,0);assert.equal(a.state().consumables.rejuvenation,1);assert.equal(a.state().consumables.phantom,1);
});
