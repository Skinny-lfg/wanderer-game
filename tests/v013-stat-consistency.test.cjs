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
test('fresh v15 talent progress has no attribute currency until 100 Talent points are earned',()=>{
 const p=T.create();assert.equal(p.treeVersion,15);
 assert.equal(T.attributeBudget(p),0);
 assert.equal(T.availableAttributes(p),0);
 assert.equal(T.allocateAttribute(p,'str'),null);
 assert.equal(T.attributeBudget(T.award(p,10000)),0);
 assert.equal(T.attributeBudget(T.award(p,10100)),1);
 assert(T.valid(p));
});

test('Stage 5 uses one Power estimator and counts active Decay Spell Power on physical weapons',()=>{
 const a=create(3601);
 for(const slot of Object.keys(a.state().equip))a.state().equip[slot]=null;
 a.state().equip.weapon=a.makeItem(1,'weapon',null,'loot','Sword','Common');
 a.state().automaticTalents=buy(['affinity_decay']);
 const before=a.baseStats();
 assert(before.phase2Decay&&before.spellPower>0&&!before.caster);
 assert.equal(before.power,Math.round(before.attack*2+before.defense*4+before.maxhp*.15+before.attacksPerSec*35+before.crit*1.2+before.blockChance*2+before.spellPower*1.7));
 a.state().equip.weapon.spell=(a.state().equip.weapon.spell||0)+20;
 const after=a.baseStats();
 assert.equal(after.spellPower-before.spellPower,20);
 assert.equal(after.attack,before.attack);
 assert(after.power>before.power,'Active Decay Spell Power must affect estimated Gear Power');
 assert(a.gear.statsWidget(after).includes('Spell Power'),'Physical Decay must show active Spell Power');
 assert(a.gear.statsWidget(after).includes('Mana regen'),'Physical Decay must show Mana regeneration');
 a.state().automaticTalents=buy(['affinity_blood']);
 const blood=a.baseStats();
 assert.equal(blood.spellPower,0,'Unactivated spell stats must not inflate a physical Blood build');
});
test('Stage 5 explains stat limits accessibly and retains all Power sources',()=>{
 const a=create(3602);a.state().automaticTalents=buy(['affinity_magic']);
 const s=a.baseStats(),power=a.statMarkup('Gear Power',s,s.power);
 assert(power.includes('data-stat="power"'));
 assert(power.includes('tabindex="0"'));
 assert(power.includes('not DPS or overall build strength'));
 const spell=a.statMarkup('Spell Power',s,s.spellPower);
 assert(spell.includes('data-stat="spellPower"'));
 assert(spell.includes('Aegis Barrier'));
 const fs=require('node:fs'),source=fs.readFileSync('index.html','utf8'),preview=fs.readFileSync('docs/index.html','utf8');
 assert(source.includes('Stat guide'));
 assert(preview.includes('Stat guide'));
 assert(!source.includes('Base includes allocated attributes'));
 const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync('combat/v012-gear-stats.js')).digest('hex').slice(0,12);
 assert(preview.includes('combat/v012-gear-stats.js?v='+hash),'Pages must bust cache for the changed Power estimator');
 assert.equal(fs.readFileSync('docs/combat/v012-gear-stats.js','utf8'),fs.readFileSync('combat/v012-gear-stats.js','utf8'));
});
