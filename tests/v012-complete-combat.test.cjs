const {test}=require('node:test'),assert=require('node:assert/strict');require('../combat/v012-buildcraft.js');const B=globalThis.WandererV012Buildcraft;
function ctx(){const effects=[];return {effects,c:{funded:true,base:100,power:100,amp:1,now:0,critical:false,enemy:{hp:10000,maxhp:10000,dots:{},slowTime:0},player:{maxhp:100,hp:50},random:()=>0,dot:(...a)=>effects.push(['dot',...a]),damage:(...a)=>effects.push(['damage',...a]),dotDamage:(...a)=>effects.push(['dotDamage',...a]),heal:n=>(effects.push(['heal',n]),n),mana:n=>effects.push(['mana',n]),barrier:n=>effects.push(['barrier',n]),chill:n=>effects.push(['chill',n]),log:()=>{}}};}
test('six bare families grant no combat effects; explicit starters do',()=>{
 for(const family of B.FAMILIES){const b=B.create();b.families=[family];if(family==='magic')b.element='fire';const {c,effects}=ctx();B.onAttack(b,c);B.onSecond(b,c);B.onCast(b,c);assert.deepEqual(effects,[],family);B.initial(b,family);if(['blood','decay','magic'].includes(family)){B.onAttack(b,{...c,now:10});B.onCast(b,c);assert(family==='decay'?c.enemy.v012Rot?.length:effects.length,family);}}
});
test('Static is player state, requires funded casts, survives Waves/JSON and clears at Expedition end',()=>{
 const b=B.create();b.families=['magic'];B.element(b,'lightning');B.initial(b,'magic');const {c,effects}=ctx();
 for(let i=0;i<3;i++)B.onCast(b,c);assert.equal(b.runtime.staticCharges,3);B.resetWave(b,c.enemy);assert.equal(b.runtime.staticCharges,3);const copy=B.validate(JSON.parse(JSON.stringify(b)));B.onCast(copy,{...c,funded:false});assert.equal(copy.runtime.staticCharges,3);B.onCast(copy,c);assert.equal(copy.runtime.staticCharges,0);assert(effects.some(e=>e[2]==='⚡ Static Discharge'&&Math.abs(e[1]-32)<.01));assert.equal(c.enemy.v012Shock,0);B.clear(copy);assert.equal(copy.runtime.staticCharges,0);
});
test('Deep Winter caps boss chill and Withering Hex reduces non-healer attacks',()=>{
 const b=B.create();b.families=['magic','decay'];b.element='frost';b.picks=['deep_winter','wither'];const {c,effects}=ctx();c.enemy.boss=true;c.enemy.v012Rot=[{damage:1,remaining:2}];B.onCast(b,c);assert(effects.some(e=>e[0]==='chill'&&e[1]===1.2));assert(B.incoming(b,c,100)<100);
});
test('DOT conversions repay the remaining damage consumed over 2/4/8 ticks',()=>{
 for(const remaining of [2,4,8])for(const id of ['carrion_detonation','venom_shatter','hemal_sigil']){
  const b=B.create();b.families=id==='carrion_detonation'?['blood','decay']:id==='venom_shatter'?['decay','fury']:['blood','magic'];b.element=id==='hemal_sigil'?'lightning':null;b.picks=[id];const {c,effects}=ctx();c.critical=true;c.enemy.bleedStacks=1;c.enemy.dots.bleed=[{damage:10,remaining}];c.enemy.v012Rot=[{damage:7,remaining}];const owed=(id==='carrion_detonation'?17:id==='venom_shatter'?7:10)*remaining;
  if(id==='hemal_sigil')B.onCast(b,c);else B.onAttack(b,c);const damage=effects.filter(e=>e[0]==='damage').reduce((n,e)=>n+e[1],0);assert(damage>=owed,id+' remaining '+remaining);
 }
});
test('Spell Surge cannot consume on its triggering critical; free echoes cannot create Static',()=>{
 const b=B.create();b.families=['magic','fury'];b.element='lightning';b.picks=['overcharge','spell_surge','spellblade','arcane_echo'];const {c,effects}=ctx();c.critical=true;B.onAttack(b,c);B.onCast(b,c);assert(!effects.some(e=>e[2]==='✨ Spell Surge'));c.now=1;B.onCast(b,c);assert(effects.some(e=>e[2]==='✨ Spell Surge'));assert.equal(b.runtime.staticCharges,2);B.onCast(b,{...c,funded:false});assert.equal(b.runtime.staticCharges,2);
});


test('Combat explains regular Bleed/Burn ticks and Rot ticks with visible damage and preserves HP accounting',()=>{
 const create=require('./v012-economy-harness.cjs');
 function fight(seed){
  const a=create(seed);a.setup(1,'Sword','Rare');a.start(1);a.initial('blood');
  const offer=a.controller().state.offers.find(o=>o.family==='blood');
  assert(offer);a.select(offer.id);assert.equal(a.enter(),true);
  const run=a.state().run;
  assert(run&&run.status==='fight');
  run.enemy.hp=run.enemy.maxhp=1000;run.enemy.attackEvery=999;run.tEnemy=0;run.tPlayer=0;run.tDot=.99;
  return {a,run,feedback:a.feedback()};
 }
 {
  const {a,run,feedback}=fight(44001),e=run.enemy;
  e.dots={bleed:[{damage:12,remaining:2}],burn:[{damage:8,remaining:2}]};
  e.bleedStacks=1;e.burnStacks=1;e.bleed=12;e.burn=8;
  const hp=e.hp;a.tick();
  assert.equal(e.hp,hp-20,'periodic Bleed and Burn retain original damage amounts');
  assert(feedback.floats.some(f=>f.target==='enemy'&&f.value===20&&f.source==='BLEED + BURN'),
   'players must see the damage value and its source');
  assert(feedback.logs.some(f=>f.text.includes('Damage over time: 20 damage')));
 }
 {
  const {a,run,feedback}=fight(44002),e=run.enemy;
  e.v012Rot=[{damage:9,remaining:2,ticks:0}];
  const hp=e.hp;a.tick();
  assert.equal(e.hp,hp-9,'Rot retains its original periodic damage');
  assert(feedback.floats.some(f=>f.target==='enemy'&&f.value===9&&f.source==='ROT'),
   'Rot must display as a visible damage source');
  assert(feedback.logs.some(f=>f.text.includes('Rot 9 damage')));
 }
 const fs=require('node:fs'),path=require('node:path');
 const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
 assert.match(html,/function floatText\(n,target='enemy',crit=false,source=''\)/);
 assert.match(html,/x\.dataset\.damageSource=source/);
});
