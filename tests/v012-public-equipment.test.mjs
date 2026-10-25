import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {publishableV012Equipment,parseV012Equipment,V012_PUBLIC_SLOTS,V012_PUBLIC_EQUIPMENT_VERSION} from '../online/v012-public-equipment.mjs';
const weapon={slot:'weapon',id:'sword-01',name:'Ash Sword',rarity:'Epic',tier:18,subtype:'Sword',atk:35,str:9,effect:'burn',upgradeBase:{secret:'do not publish'}};
const belt={slot:'belt',id:'belt-01',name:'Vital Belt',rarity:'Rare',tier:17,subtype:'Belt',armorType:'Leather',evasionRating:12,def:5};
const snapshot={
 format:'wanderer-expedition',profile:{equip:{weapon,belt,offhand:null},stash:[{id:'secret-stash',name:'Secret Stash Blade'}],gold:25000,fragments:18,valuables:[{name:'Secret Treasure'}]},
 expedition:{completed:18,unlocked:19},session:{currentEnemy:'Secret Boss'},identity:{email:'private@example.test'}
};
test('v0.12 public snapshot includes only equipped gear, never inventory/account information',()=>{
 const view=publishableV012Equipment(snapshot);
 assert.equal(view.version,V012_PUBLIC_EQUIPMENT_VERSION);
 assert.equal(Object.keys(view.equipment).length,V012_PUBLIC_SLOTS.length);
 assert.equal(view.equipment.weapon.name,'Ash Sword');
 assert.equal(view.equipment.belt.armorType,'Leather');
 assert.equal(view.equipment.belt.evasionRating,12);
 const publicJson=JSON.stringify(view);
 for(const privateValue of ['Secret Stash Blade','Secret Treasure','private@example.test','Secret Boss','25000','upgradeBase'])assert(!publicJson.includes(privateValue),'private field leaked: '+privateValue);
 assert(publicJson.length<30000,'existing Firestore size bound');
});
test('v0.12 equipment reader rejects retired, malformed and oversized loadouts',()=>{
 assert.equal(parseV012Equipment(JSON.stringify({equipment:{weapon}})),null,'old v092 loadout has no version');
 assert.equal(parseV012Equipment(JSON.stringify({version:'v092',equipment:{weapon}})),null);
 assert.equal(parseV012Equipment('bad json'),null);
 assert.equal(parseV012Equipment('x'.repeat(30001)),null);
 assert.equal(parseV012Equipment(JSON.stringify(publishableV012Equipment(snapshot))).weapon.atk,35);
});
test('only known slots and safe identity/stats survive public decoding',()=>{
 const payload=publishableV012Equipment(snapshot);
 payload.equipment.weapon.name='<img src=x onerror=alert(1)>';
 payload.equipment.weapon.effect='unauthorized-effect';
 payload.equipment.weapon.legendaryId='../../private';
 payload.equipment.weapon.atk=Number.MAX_VALUE;
 payload.equipment.secret={id:'private'};
 const read=parseV012Equipment(JSON.stringify(payload));
 assert.equal(read.weapon.effect,undefined);
 assert.equal(read.weapon.legendaryId,undefined);
 assert.equal(read.weapon.atk,undefined);
 assert.equal(read.weapon.name,'<img src=x onerror=alert(1)>','UI renderer is responsible for escaping text');
 assert.equal(Object.hasOwn(read,'secret'),false);
});
test('public equipment never writes private save collection, and production rules already allow owner-only loadouts',async()=>{
 const client=await readFile(new URL('../online/firebase-client.mjs',import.meta.url),'utf8');
 const rules=await readFile(new URL('../firestore.rules',import.meta.url),'utf8');
 const account=await readFile(new URL('../online/v012-account.mjs',import.meta.url),'utf8');
 assert.match(client,/publishV012EquippedEquipment\(snapshot\)/);
 assert.match(client,/readV012EquippedEquipment\(uid\)/);
 assert.match(client,/sdk\.doc\(db,PUBLIC_LOADOUTS,uid\)/);
 assert.match(rules,/match \/publicLoadoutsV092\/\{uid\}/);
 assert.match(rules,/allow create, update: if owner\(uid\) && hasProfile\(uid\)/);
 assert.match(account,/if\(value==='saved'\)schedulePublicEquipment\(\)/);
 assert.match(account,/unlock\(\);setAccountDialog\(\);schedulePublicEquipment\(\)/);
});
