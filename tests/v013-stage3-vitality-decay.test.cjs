'use strict';
// Stage 3: real v15 allocations, production Buildcraft formulas and native
// heal/Rot callbacks. No retired UI or fake per-class rules.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const B=globalThis.WandererV012Buildcraft;
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,'Expected '+a+' ~= '+b);
function build(ids){const progress=buy(ids);const b=B.create();B.syncPermanent(b,progress);return b;}
function context({hp=500,maxhp=1000,mp=0,base=100,power=0,critical=false}={}){
 const player={hp,maxhp,mp,maxmp:100,barrier:0,stats:{spellPower:power}};
 const enemy={hp:5000,maxhp:5000,bleedStacks:0,dots:{bleed:[],burn:[]},v012Rot:[],slowTime:0};
 const events=[];
 const c={player,enemy,now:0,base,power,critical,random:()=>.9,funded:false,amp:1,
  heal:n=>{const result=Math.min(Math.max(0,player.maxhp-player.hp),Math.max(0,n));player.hp+=result;events.push(['healed',result]);return result;},
  damage:(n,label)=>events.push(['damage',label,n]),dot:()=>{},dotDamage:()=>{},barrier:()=>{},mana:()=>{},chill:()=>{},log:()=>{}};
 return {player,enemy,c,events};
}
test('Radiance v15 root and basic stat nodes use percentage Max HP, with visible exact units',()=>{
 const root=T.NODES.find(n=>n.id==='affinity_radiance');
 near(root.healthRegen,.0015);
 assert(root.description.includes('0.15%'));
 assert(root.description.includes('0.35%'));
 const nodes=T.NODES.filter(n=>n.kind==='stat'&&n.family==='radiance'&&n.healthRegen);
 assert(nodes.length>0);
 for(const n of nodes){
  assert(n.healthRegen>=.0005&&n.healthRegen<=.001,'rate per node should be bounded');
  assert(n.description.includes('% Max HP regeneration'),'percentage units exposed to player: '+n.id);
 }
 const b=build(['affinity_radiance']);
 near(b.runtime.talentBonuses.healthRegen,.0015);
});
test('Radiance regen scales with Max HP, is capped before fork modifiers and respects effective healing',()=>{
 const b=build(['affinity_radiance']);
 const smaller=context({hp:50,maxhp:200}),larger=context({hp:50,maxhp:600});
 B.onSecond(b,smaller.c);
 B.onSecond(b,larger.c);
 near(smaller.events.find(x=>x[0]==='healed')[1],.3);
 near(larger.events.find(x=>x[0]==='healed')[1],.9);
 assert(larger.player.hp>smaller.player.hp);
 const capBuild=build(['affinity_radiance']);
 capBuild.runtime.talentBonuses.healthRegen=.01; // Stress a valid aggregate above the cap.
 const cap=context({hp:10,maxhp:1000});B.onSecond(capBuild,cap.c);
 near(cap.events.find(x=>x[0]==='healed')[1],3.5);
 capBuild.runtime.specializations=['radiance_recovery'];
 const boost=context({hp:10,maxhp:1000});B.onSecond(capBuild,boost.c);
 near(boost.events.find(x=>x[0]==='healed')[1],3.5*1.25);
 capBuild.runtime.specializations=['radiance_reserve'];
 const reserve=context({hp:10,maxhp:1000});B.onSecond(capBuild,reserve.c);
 near(reserve.events.find(x=>x[0]==='healed')[1],3.5*.75);
 const full=context({hp:1000,maxhp:1000});B.onSecond(capBuild,full.c);
 assert.equal(full.events.find(x=>x[0]==='healed')[1],0,'no overhealing counted as actual healing');
});
test('Radiance healing stays independent of Spell Power and existing Renewal/Life Bloom formulas',()=>{
 const b=build(['affinity_radiance']);
 for(const power of [0,100,1000]){
  const x=context({hp:50,maxhp:500,power});B.onSecond(b,x.c);
  near(x.events.find(e=>e[0]==='healed')[1],.75);
 }
 near(B.values('renewal',1).heal,.0055);
 near(B.values('life_bloom',1).heal,.0025);
});
test('retired Toxic Precision is absent from current v15 and Buildcraft source, not a hidden passive',()=>{
 assert(!T.NODES.some(n=>n.id==='toxic_precision'));
 assert(!B.CATALOG.some(n=>n.id==='toxic_precision'));
 assert(!fs.readFileSync('combat/v012-buildcraft.js','utf8').includes('toxic_precision'));
});
test('real v15 Decay Toxic Touch scales Rot with hit and Spell Power; costs four Mana and retains cooldown',()=>{
 const damage=[];
 for(const power of [0,100,200]){
  const b=build(['affinity_decay']),x=context({power,mp:10,base:100});
  x.c.random=()=>0;
  B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,1);
  assert.equal(x.player.mp,6,'four Mana for each successful application');
  damage.push(x.enemy.v012Rot[0].damage);
  x.c.now=1;B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,1,'1.3s internal cooldown');
  assert.equal(x.player.mp,6,'no Mana cost on cooldown');
  x.c.now=1.3;B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,2);
  assert.equal(x.player.mp,2);
  x.player.mp=0;x.c.now=3;B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,2,'no free Rot at zero Mana');
 }
 assert.deepEqual(damage,[4,8,12],'4% of the nominal base weapon hit plus Spell Power, without early rounding');
});
test('Rot uses nominal weapon coefficients and retains fractional primary stack potency',()=>{
 const cases=[['Daggers',40,25,2.28],['Two-Handed',40,25,3.72],['Wand',40,25,2.05],['Staff',40,25,2.32]];
 for(const [subtype,attack,spellPower,expected] of cases){
  const b=build(['affinity_decay']),x=context({power:spellPower,mp:10,base:999});
  Object.assign(x.player.stats,{attack,spellPower,main:{subtype}});
  x.c.random=()=>0;B.onAttack(b,x.c);
  near(x.enemy.v012Rot[0].damage,expected);
  assert.equal(x.player.mp,6);
 }
});
test('active Magic + Decay Hex Bolt uses Spell Power without consuming existing Rot stacks',()=>{
 const result=[];
 for(const power of [0,100]){
  const b=build(['hex_bolt']),x=context({power,mp:20});
  x.enemy.v012Rot=[{damage:10,remaining:4,ticks:0}];
  x.c.funded=true;x.c.now=6;
  B.onCast(b,x.c);
  const damage=x.events.find(e=>e[0]==='damage'&&e[1].includes('Hex Bolt'));
  assert(damage,'reachable Arcane/Decay Hex Bolt triggered');
  result.push(damage[2]);
  assert.equal(x.enemy.v012Rot.length,1);
 }
 assert.deepEqual(result,[10.25,35],'funded onCast keeps its existing minimum Spell Power of one');
});
test('Stage 3 generated Pages and active node descriptions have no retired fixed-HP regen and old Rot formula',()=>{
 for(const p of ['combat/talent-graph-next.js','combat/v012-buildcraft.js','combat/talent-catalog.js']){
  assert.equal(fs.readFileSync('docs/'+p,'utf8'),fs.readFileSync(p,'utf8'),p+' Pages mirror');
 }
 const tree=fs.readFileSync('combat/talent-graph-next.js','utf8');
 const craft=fs.readFileSync('combat/v012-buildcraft.js','utf8');
 assert(tree.includes('0.15% maximum Health per combat second'));
 assert(!tree.includes('Regenerate 0.2 Health per second during combat.'));
 assert(craft.includes('4% of base weapon damage plus Spell Power combined'));
 assert(!craft.includes('toxic_precision'));
});

test('Stage 3 comparator validates frozen Stage 2 cohorts and rejects unrelated Affinity drift',()=>{
 const C=require('../scripts/v013-stage3-coherence-compare.cjs');
 const before=require('../reports/v013-stage2-affinity-freeze.json');
 const groups=before.groups.map(g=>({...g}));
 groups.find(g=>g.build==='pure-radiance').meanHealingPerSecond+=.3;
 const current={settings:{...before.settings,output:'reports/current.json'},
  summary:{valid:48,errors:0,timeouts:0,groups}};
 assert.equal(C.compare(before,current).length,24);
 groups.find(g=>g.build==='pure-fury').meanHealingPerSecond+=.1;
 assert.throws(()=>C.compare(before,current),/Unrelated pure-fury/);
});
