import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publishableV012Equipment,parseV012Equipment} from '../online/v012-public-equipment.mjs';

test('public v0.12 profile contains only equipped items and equipped Runes',()=>{
 const save={format:'wanderer-expedition',profile:{gold:999999,inventory:[{name:'private bag item'}],stash:[{name:'private stash item'}],
  equip:{weapon:{slot:'weapon',id:'axe-1',name:'Sapphire Axe',subtype:'Two-Handed',rarity:'Epic',tier:42,atk:55},offhand:{slot:'offhand',id:'shield-1',name:'Private shield',subtype:'Shield',rarity:'Rare',tier:42,def:18}},
  runes:[{id:'rune-equipped',family:'might',tier:40},{id:'rune-carried',family:'fortune',tier:20}],runeSlots:['rune-equipped',null,null]},
  expedition:{unlocked:42,active:{private:'save payload'}}};
 const published=publishableV012Equipment(save);
 assert.deepEqual(Object.keys(published).sort(),['equipment','runeSlots','runes','version']);
 assert.equal(published.equipment.weapon.name,'Sapphire Axe');
 assert.equal(published.equipment.offhand,null,'two-handed weapon cannot publish an offhand');
 assert.deepEqual(published.runes,[{id:'rune-equipped',family:'might',tier:40,progression:'expedition'}]);
 assert.deepEqual(published.runeSlots,['rune-equipped',null,null]);
 const decoded=parseV012Equipment(JSON.stringify(published));
 assert.deepEqual(decoded,published);
 assert.ok(!JSON.stringify(published).includes('gold'));
 assert.ok(!JSON.stringify(published).includes('private bag item'));
 assert.ok(!JSON.stringify(published).includes('private stash item'));
 assert.ok(!JSON.stringify(published).includes('private shield'));
 assert.ok(!JSON.stringify(published).includes('active'));
});

test('public equipment rejects unsupported source and bounds/unsets malformed fields',()=>{
 assert.throws(()=>publishableV012Equipment({profile:{equip:{}}}),/Invalid v0.12/);
 const published=publishableV012Equipment({format:'wanderer-expedition',profile:{equip:{weapon:{slot:'weapon',name:'Invalid',subtype:'Sword',rarity:'Unknown',tier:0}},runes:[{id:'x',family:'unknown',tier:999}],runeSlots:['x']}});
 assert.equal(published.equipment.weapon,null);
 assert.deepEqual(published.runes,[]);
 assert.equal(parseV012Equipment('not-json'),null);
});
