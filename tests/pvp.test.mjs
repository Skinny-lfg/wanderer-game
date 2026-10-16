import test from 'node:test';import assert from 'node:assert/strict';
import {cleanEquipment,publicLoadout} from '../online/public-loadout.mjs';
import {practiceDuel,theftPreview} from '../online/pvp.mjs';
import {totalStats} from '../online/pvp-stats.mjs';
const item=(subtype,slot='weapon',effect=null)=>({id:subtype,slot,subtype,name:subtype,tier:10,rarity:'Rare',atk:25,str:5,int:5,end:5,def:10,spd:1,effect,magic:['Staff','Wand','Orb'].includes(subtype)?effect:null});
test('public equipment strips private data, normalizes both hands, and keeps synergy identity',()=>{
 const equip={weapon:item('Two-Handed','weapon','poison'),offhand:item('Shield','offhand','poison')};
 const shared=publicLoadout({equip,gold:999,stash:[{}],maxDungeon:20});assert.equal(shared.equipment.offhand,null);assert.equal(shared.gold,undefined);assert.equal(shared.stash,undefined);assert.equal(totalStats(shared.equipment).counts.poison,2);
 for(const kind of ['Two-Handed','Bow','Staff']){const cleaned=cleanEquipment({weapon:item(kind,'weapon','poison'),offhand:item('Shield','offhand','poison')});assert.equal(cleaned.offhand,null,kind+' must reserve Off-Hand');assert.equal(totalStats(cleaned).counts.poison,2);}
 assert.throws(()=>cleanEquipment({weapon:{...item('Sword'),atk:Infinity}}),/stats/);
});
test('practice supports every requested weapon pairing, is deterministic, and cannot mutate saves',()=>{
 const builds=[['Sword','Shield'],['Mace','Shield'],['Two-Handed',null],['Bow',null],['Daggers','Off-Hand Dagger'],['Staff',null],['Wand','Orb']].map(([w,o])=>({weapon:item(w,'weapon','burn'),offhand:o?item(o,'offhand','burn'):null}));
 for(const left of builds)for(const right of builds){const original=JSON.stringify([left,right]);const result=practiceDuel(left,right,123);assert.deepEqual(result,practiceDuel(left,right,123));assert.ok(['attacker','defender','draw'].includes(result.winner));assert.ok(result.seconds<=120);assert.equal(result.reward,0);assert.equal(JSON.stringify([left,right]),original);assert.ok(result.events.length<=160);}
});
test('theft proposal rounds down, respects balance and both daily limits',()=>{
 assert.equal(theftPreview(99),0);assert.equal(theftPreview(1000),10);assert.equal(theftPreview(1000000),20);assert.equal(theftPreview(1000000,95,48),2);assert.equal(theftPreview(1000,100,0),0);assert.equal(theftPreview(1000,0,50),0);assert.throws(()=>theftPreview(-1));
});
