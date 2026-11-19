'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const fields=['str','agi','int','end','cha','attack','defense','maxhp','attacksPerSec','crit','blockChance','mana','manaRegen','spellPower','power'];

for(const [weapon,id] of [['Sword','affinity_blood'],['Staff','affinity_magic'],['Daggers','affinity_fury'],['Mace','affinity_aegis']]){
 test('current Dungeon remains statistically finite for '+weapon+' / '+id,()=>{
  const a=create(3301);a.setup(1,weapon);a.state().automaticTalents=buy([id]);
  const initial=a.baseStats();
  a.start(1,true);
  const prep=a.stats(),c=a.controller(),card=c.state.dungeon.cards[0];
  assert(c.state.dungeon&&c.state.dungeon.cards.length===3);
  c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
  const fight=a.state().run.stats;
  for(const key of fields){
   assert(Number.isFinite(initial[key]),'Camp '+key);
   assert(Number.isFinite(prep[key]),'Preparation '+key);
   assert(Number.isFinite(fight[key]),'Combat '+key);
  }
  assert.equal(a.state().automaticTalents.treeVersion,15);
  assert(T.valid(a.state().automaticTalents));
 });
}
test('current native source breakdown matches its displayed totals without mutating state',()=>{
 const a=create(3401);a.state().automaticTalents=buy(['affinity_vitality']);
 a.start(1,true);
 const before=JSON.stringify(a.state()),stats=a.stats(),rows=a.statSources(stats);
 assert(rows.length>0);
 for(const row of rows)assert(Math.abs(row.base+row.equipment+row.runes+row.talents+row.temporary-row.total)<.001,row.key);
 assert.equal(JSON.stringify(a.state()),before);
 const markup=a.statMarkup('Health',stats,stats.maxhp);
 assert(markup.includes('data-stat="maxhp"'));
 assert(markup.includes(String(stats.maxhp)));
});
test('negative equipment attributes remain visually distinct',()=>{
 const a=create(3501);for(const slot of Object.keys(a.state().equip))a.state().equip[slot]=null;
 a.state().equip.weapon=a.makeItem(1,'weapon',null,'loot','Mace','Common');a.state().equip.weapon.spd=-1;
 const stats=a.stats(),markup=a.statMarkup('Hits/sec',stats,stats.attacksPerSec);
 assert(markup.includes('stat-penalty'));
 assert(markup.includes('data-stat="attacksPerSec"'));
});
test('fresh v15 talent progress never exposes historical attribute spending',()=>{
 const p=T.create();assert.equal(p.treeVersion,15);
 assert.equal(typeof T.attributePoints,'undefined');
 assert.equal(typeof T.allocateAttribute,'undefined');
 assert(T.valid(p));
});
