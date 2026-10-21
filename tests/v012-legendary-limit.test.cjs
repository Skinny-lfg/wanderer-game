const {test}=require('node:test');
const assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

function item(a,slot,subtype){const o=a.makeItem(50,slot,null,'loot',subtype,'Legendary');assert(o.legendaryId);return o;}
function count(s){return Object.values(s.equip).filter(o=>o?.rarity==='Legendary').length;}

test('only the 12 current legendary items are generated in new Expeditions',()=>{
 const a=create(42),ids=new Set(['crimson-fang','chalice-hollow-king','gravewake','eye-of-morrow','verdant-oath','heartroot-carapace','oathwall','veil-thousand-seals','kingsbreaker','tempest-talon','astrafall','voidglass']);
 for(const slot of a.slots)for(let i=0;i<16;i++){
  const o=a.makeItem(50,slot,null,'loot','random','Legendary');
  assert(ids.has(o.legendaryId),o.legendaryId);
 }
});

test('a third equipped Legendary is rejected without deleting the item',()=>{
 const a=create(43);a.setup(50,'Sword','Epic');const s=a.state();
 const sword=item(a,'weapon','Sword'),shield=item(a,'offhand','Shield'),chest=item(a,'armor','Armor');
 s.stash.push(sword,shield,chest);
 assert.equal(a.equip(sword.id),true);assert.equal(a.equip(shield.id),true);assert.equal(count(s),2);
 assert.equal(a.equip(chest.id),false);assert.equal(count(s),2);
 assert(s.stash.some(o=>o.id===chest.id),'third Legendary must remain in Stash');
 assert.equal(a.unequip('offhand'),true);assert.equal(a.equip(chest.id),true);assert.equal(count(s),2);
});

test('replacing one of two equipped Legendaries remains possible',()=>{
 const a=create(44);a.setup(50,'Sword','Epic');const s=a.state();
 const sword=item(a,'weapon','Sword'),shield=item(a,'offhand','Shield'),replacement=item(a,'weapon','Sword');
 s.stash.push(sword,shield,replacement);
 assert(a.equip(sword.id));assert(a.equip(shield.id));
 assert(a.equip(replacement.id),'replacement should not count the displaced item');
 assert.equal(count(s),2);assert(s.stash.some(o=>o.id===sword.id));
});

test('two-handed Legendary may replace an offhand Legendary without exceeding the limit',()=>{
 const a=create(45);a.setup(50,'Sword','Epic');const s=a.state();
 const shield=item(a,'offhand','Shield'),chest=item(a,'armor','Armor'),weapon=item(a,'weapon','Two-Handed');
 s.stash.push(shield,chest,weapon);
 assert(a.equip(shield.id));assert(a.equip(chest.id));
 assert(a.equip(weapon.id),'displacing a Legendary shield frees one Legendary position');
 assert.equal(s.equip.offhand,null);assert.equal(count(s),2);
 assert(s.stash.some(o=>o.id===shield.id));
});
