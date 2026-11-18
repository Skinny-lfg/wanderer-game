'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/expedition-progression.js');require('../economy/v013-crafting.js');require('../economy/v013-tier-upgrade.js');
const U=globalThis.WandererV013TierUpgrade,C=globalThis.WandererV013Crafting;
const item=(tier=1,rarity='Rare')=>({id:'same-id',tier,name:'Ashen Sword',slot:'weapon',subtype:'Sword',rarity,atk:12,str:2,spd:1,effect:'bleed',v013Trait:'focused',legendaryId:'unique',locked:true,source:'loot',craftPrice:45});
const state=(o=item(),equipped=false)=>({fragments:10000,crafting:{...C.create(),essence:1000},stash:equipped?[]:[o],equip:equipped?{weapon:o}:{weapon:null}});
test('tier upgrade costs are deterministic and require sufficient unlocks and materials',()=>{
 const s=state();const preview=U.preview(s,'same-id',4);assert.equal(preview.ready,false);assert.equal(preview.target.minimum,5);
 assert.equal(U.prepare(s,'same-id',4),null);assert(U.prepare(s,'same-id',5));
 s.fragments=0;assert.equal(U.prepare(s,'same-id',5),null);
 s.fragments=10000;s.crafting.essence=0;assert.equal(U.prepare(s,'same-id',5),null);
});
test('upgrade is immutable and preserves identity, effects, traits, rarity and speed',()=>{
 const s=state(),before=JSON.stringify(s),up=U.prepare(s,'same-id',70);
 assert(up);assert.equal(JSON.stringify(s),before);assert.equal(up.item.id,'same-id');assert.equal(up.item.name,'Ashen Sword');
 for(const key of ['rarity','effect','v013Trait','legendaryId','locked','source','craftPrice','spd'])assert.equal(up.item[key],s.stash[0][key]);
 assert(up.item.atk>12);assert.equal(up.item.tier,5);assert.equal(up.location.kind,'stash');
});
test('equipped items are supported without swapping slots or creating a duplicate',()=>{
 const s=state(item(5),true),up=U.prepare(s,'same-id',15);assert.equal(up.location.kind,'equip');assert.equal(up.location.slot,'weapon');assert.equal(up.item.id,s.equip.weapon.id);assert.equal(up.item.tier,15);
});
test('subsequent tier upgrades progress to Exalted and then stop',()=>{
 let s=state();let expected=[5,15,35,70];for(const level of expected){const result=U.prepare(s,'same-id',70);assert(result);s={...s,stash:[result.item],fragments:result.fragments,crafting:result.crafting};assert.equal(result.item.tier,level);}
 assert.equal(U.preview(s,'same-id',1000),null);
});
test('existing Legendary reinforcement recalculates rank from new original stats',()=>{
 const o=item(5,'Legendary');o.upgradeRank=4;o.upgradeBase={atk:10,str:2};o.atk=10.8;o.str=2.16;
 const s=state(o),result=U.prepare(s,'same-id',15);assert(result);assert.equal(result.item.upgradeRank,4);
 assert.equal(result.item.atk,Math.round(result.item.upgradeBase.atk*1.08*100)/100);
 assert.equal(result.item.str,Math.round(result.item.upgradeBase.str*1.08*100)/100);
});
test('reject unowned or duplicate-ID items and malformed character materials',()=>{
 const s=state();assert.equal(U.prepare(s,'wrong',70),null);s.equip.weapon=s.stash[0];assert.equal(U.preview(s,'same-id',70),null);s.equip.weapon=null;
 s.crafting.cores.magic=-4;assert.equal(U.prepare(s,'same-id',70),null);
});
test('equipment E200+ upgrade stops at Exalted instead of growing again',()=>{
 assert.equal(U.nextTier(item(250)),null);assert.equal(U.budget(70),U.budget(1000));
});
