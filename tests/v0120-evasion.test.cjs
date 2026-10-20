const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
function encounter(elite='tank',type='physical'){
 const a=create(55);a.setup(5,'Sword');a.start(1);a.initial('blood');a.select(a.controller().state.offers.find(o=>o.family==='blood').id);a.enter();
 a.build().families=[];a.build().picks=[];
 const r=a.state().run;r.hp=r.maxhp/2;r.barrier=10;r.stats.evasionRating=10000;r.stats.blockChance=0;
 Object.assign(r.enemy,{hp:500,maxhp:1000,atk:100,eliteType:elite,bossStyle:null,attackType:type,barrier:0,slowTime:0});
 r.tEnemy=100;r.tPlayer=r.tDot=0;r.stats.attacksPerSec=0;
 return {a,r};
}
test('Leather rating scales with E# and rarity independently of Agility; DR and 30% cap are finite',()=>{
 const a=create(),f=a.gear.evasionChance;
 for(const tier of [1,5,200]){
  const leather=a.makeItem(tier,'armor',null,'forge','Leather','Rare');assert(leather.evasionRating>0);
  const equipped={armor:leather},before=a.baseStats(equipped).evasionRating;leather.agi+=1000;
  assert.equal(a.baseStats(equipped).evasionRating,before);
  assert.equal(a.makeItem(tier,'armor',null,'forge','Plate','Rare').evasionRating,undefined);
  assert.equal(a.makeItem(tier,'armor',null,'forge','Cloth','Rare').evasionRating,undefined);
 }
 assert(f(20,5)>f(10,5));assert(f(30,5)-f(20,5)<f(20,5)-f(10,5));
 assert(f(10,200)<f(10,5));assert.equal(f(Number.MAX_VALUE,1),.30);
 for(const bad of [0,-1,NaN,Infinity])assert.equal(f(bad,5),0);
 const common=a.makeItem(5,'belt',null,'forge','Leather','Common'),epic=a.makeItem(5,'belt',null,'forge','Leather','Epic');assert(epic.evasionRating>common.evasionRating);
});
test('legacy Leather derives rating without changing saved item fields; old gear has zero Evasion',()=>{
 const a=create(),old=a.makeItem(5,'helm',null,'forge','Leather','Rare');delete old.evasionRating;
 const raw=JSON.stringify(old);assert(a.baseStats({helm:old}).evasionRating>0);assert.equal(JSON.stringify(old),raw);
 assert.equal(old.evasionRating,undefined);
 assert.equal(a.baseStats({helm:{...old,armorType:undefined}}).evasionRating,0);
 const legendary=a.makeItem(5,'helm',null,'loot','Leather','Legendary'),rating=legendary.evasionRating;
 a.economy.upgradeLegendary(legendary);assert.equal(legendary.evasionRating,Math.round(rating*1.02*100)/100);
 const legacy={...legendary};delete legacy.evasionRating;assert.equal(a.gear.gearEvasionRating(legacy),legendary.evasionRating);
});
test('native physical dodges cause zero damage, no Barrier loss or defensive/on-hit effects, and log DODGE',()=>{
 for(const elite of ['tank','vampire','berserker']){
  const {a,r}=encounter(elite),hp=r.hp,barrier=r.barrier,enemyHp=r.enemy.hp;
  r.stats.blockChance=100;r.stats.blockReduction=.6;
  r.legendaryState={enemy:r.enemy,guard:.12,weaken:.15,reserve:5};
  const feedback=a.feedback();a.rng(0);a.tick();
  assert.equal(r.hp,hp);assert.equal(r.barrier,barrier);assert.equal(r.enemy.hp,enemyHp);
  assert.equal(r.playerHealingDebuffUntil,0);assert.equal(r.playerDebuffUntil,0);
  assert.equal(r.legendaryState.guard,.12);assert.equal(r.legendaryState.weaken,.15);assert.equal(r.legendaryState.reserve,5);
  assert(!feedback.logs.some(e=>e.text.includes('BLOCK')));assert(feedback.logs.some(e=>e.text.includes('DODGE')));assert(feedback.floats.some(e=>e.value==='DODGE'&&e.target==='hero'));
 }
});
test('failed dodge retains normal hits; spells and DoTs never roll dodge, regardless of rating',()=>{
 const physical=encounter();physical.a.rng(.99);physical.a.tick();assert(physical.r.hp<physical.r.maxhp/2);assert(physical.r.playerHealingDebuffUntil>0);
 const {a,r}=encounter('caster','spell'),hp=r.hp;a.rng(0);const feedback=a.feedback();a.tick();
 assert(r.hp<hp);assert(r.playerDebuffUntil>0);assert(!feedback.logs.some(e=>e.text.includes('DODGE')));
 for(const type of ['spell','dot','unknown'])assert.equal(a.gear.tryDodge(r,type),false);
 assert.equal(a.gear.enemyAttackType({eliteType:'caster'}),'spell');assert.equal(a.gear.enemyAttackType({bossStyle:'leech'}),'spell');
 assert.equal(a.gear.enemyAttackType({}),'physical');
});
test('character stats and item comparison display rating and E#-relative dodge chance',()=>{
 const a=create(),item=a.makeItem(5,'belt',null,'forge','Leather','Rare');
 assert.match(a.gear.itemComparison(item),/Evasion Rating/);
 const widget=a.gear.statsWidget(a.baseStats({belt:item}));assert(widget.includes('Evasion'));assert(widget.includes('rating'));assert(widget.includes('% vs E1'));
});
