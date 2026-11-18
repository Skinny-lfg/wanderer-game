'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
function fresh(seed=7301){const a=create(seed,undefined,{}, {skipPersistence:true});a.start(1,true);return {a,c:a.controller()};}
const clone=val=>JSON.parse(JSON.stringify(val));
function corrupt(label,edit,stage='selected'){
 test('restore rejects '+label,()=>{
  const {c}=fresh();if(stage==='selected')c.chooseRealm(c.state.dungeon.cards[0].id);
  const original=clone(c.state),bad=clone(original);edit(bad);
  assert.throws(()=>c.restore(bad),/Invalid /);
  assert.deepEqual(clone(c.state),original,'failed restore must not alter previous valid state');
 });
}
test('restore valid new Dungeon before and after Realm Card selection',()=>{
 const {c}=fresh();const initial=clone(c.state);assert.equal(c.restore(initial).dungeon.realm,null);
 c.chooseRealm(c.state.dungeon.cards[1].id);const selected=clone(c.state);assert.equal(c.restore(selected).dungeon.realm,selected.dungeon.realm);
 assert.equal(c.state.dungeon.steps,13);
});
corrupt('missing encounter version',g=>{delete g.encounterVersion});
corrupt('negative step budget',g=>{g.dungeon.steps=-99});
corrupt('steps above starting budget',g=>{g.dungeon.steps=999});
corrupt('invalid boss modifier ID in selected manifest',g=>{g.dungeon.foundationManifest.cards[0].bossModifierIds=['INVALID']});
corrupt('invalid boss modifier ID before Realm selection',g=>{g.dungeon.foundationManifest.cards[0].bossModifierIds=['INVALID']},'unselected');
corrupt('corrupted decision ledger',g=>{g.dungeon.foundationState.decisions.push({seq:0,type:'prepare_boss',source:'reliquary'});});
corrupt('foundation state not matching manifest',g=>{g.dungeon.foundationState.bossModifierIds=['INVALID']});
corrupt('unexpected selected room',g=>{g.selected={id:'invalid',node:1};g.offers=[g.selected]});
corrupt('unknown secret connection',g=>{g.dungeon.discoveredSecrets=['100-101']});
corrupt('unvisited current room',g=>{g.dungeon.current=3});
corrupt('duplicate cleared room',g=>{g.dungeon.cleared.push(0)});
corrupt('modifier listed as disabled without Reliquary',g=>{g.dungeon.disabledBossModifierId=g.dungeon.foundationState.bossModifierIds[0]});
corrupt('forged elite preparation',g=>{g.dungeon.foundationState.bossPreparation.markedElite=true});
corrupt('invalid card topology',g=>{g.dungeon.cards[0].edges.push([0,99])});
corrupt('invalid condition compatibility',g=>{g.dungeon.foundationManifest.cards[0].conditionId='something_fake'});
corrupt('deterministically inconsistent condition plan',g=>{const old=g.dungeon.foundationManifest.cards[0].conditionId;const replacement=old==='relentless_hunt'?'blighted_ground':'relentless_hunt';g.dungeon.foundationManifest.cards[0].conditionId=replacement;g.dungeon.foundationState.conditionId=replacement;});

test('native checkpoints remain restorable through real scouting, travel, combat and victory',()=>{
 for(let seed=7301;seed<7401;seed++){
  const {a,c}=fresh(seed);c.restore(clone(c.state));
  const card=c.state.dungeon.cards[seed%3];c.chooseRealm(card.id);c.restore(clone(c.state));
  c.scoutRooms(2);c.restore(clone(c.state));
  assert(c.visitRoom(1));c.restore(clone(c.state));
  assert(a.enter());c.restore(clone(c.state));
  const r=a.state().run;
  while(r.status==='fight'){r.enemy.hp=0;a.win();}
  c.restore(clone(c.state));
 }
});
