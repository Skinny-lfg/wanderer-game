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
test('Vitality v15 root and basic stat nodes use percentage Max HP, with visible exact units',()=>{
 const root=T.NODES.find(n=>n.id==='affinity_vitality');
 near(root.healthRegen,.0015);
 assert(root.description.includes('0.15%'));
 assert(root.description.includes('0.35%'));
 const nodes=T.NODES.filter(n=>n.kind==='stat'&&n.family==='vitality'&&n.healthRegen);
 assert(nodes.length>0);
 for(const n of nodes){
  assert(n.healthRegen>=.0005&&n.healthRegen<=.001,'rate per node should be bounded');
  assert(n.description.includes('% Max HP regeneration'),'percentage units exposed to player: '+n.id);
 }
 const b=build(['affinity_vitality']);
 near(b.runtime.talentBonuses.healthRegen,.0015);
});
test('Vitality regen scales with Max HP, is capped before fork modifiers and respects effective healing',()=>{
 const b=build(['affinity_vitality']);
 const smaller=context({hp:50,maxhp:200}),larger=context({hp:50,maxhp:600});
 B.onSecond(b,smaller.c);
 B.onSecond(b,larger.c);
 near(smaller.events.find(x=>x[0]==='healed')[1],.3);
 near(larger.events.find(x=>x[0]==='healed')[1],.9);
 assert(larger.player.hp>smaller.player.hp);
 const capBuild=build(['affinity_vitality']);
 capBuild.runtime.talentBonuses.healthRegen=.01; // Stress a valid aggregate above the cap.
 const cap=context({hp:10,maxhp:1000});B.onSecond(capBuild,cap.c);
 near(cap.events.find(x=>x[0]==='healed')[1],3.5);
 capBuild.runtime.specializations=['vitality_recovery'];
 const boost=context({hp:10,maxhp:1000});B.onSecond(capBuild,boost.c);
 near(boost.events.find(x=>x[0]==='healed')[1],3.5*1.25);
 capBuild.runtime.specializations=['vitality_reserve'];
 const reserve=context({hp:10,maxhp:1000});B.onSecond(capBuild,reserve.c);
 near(reserve.events.find(x=>x[0]==='healed')[1],3.5*.75);
 const full=context({hp:1000,maxhp:1000});B.onSecond(capBuild,full.c);
 assert.equal(full.events.find(x=>x[0]==='healed')[1],0,'no overhealing counted as actual healing');
});
test('Vitality healing stays independent of Spell Power and existing Renewal/Life Bloom formulas',()=>{
 const b=build(['affinity_vitality']);
 for(const power of [0,100,1000]){
  const x=context({hp:50,maxhp:500,power});B.onSecond(b,x.c);
  near(x.events.find(e=>e[0]==='healed')[1],.75);
 }
 near(B.values('renewal',1).heal,.0055);
 near(B.values('life_bloom',1).heal,.0025);
});
test('Toxic Precision crit Rot scales 6% base hit + 2% SP per tick without Mana; 2s cooldown persists',()=>{
 const b=build(['toxic_precision']),results=[];
 for(const power of [0,100,200]){
  b.cooldowns=Object.create(null);
  const x=context({power,critical:true,mp:0});
  B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,1,'crit must apply Rot with empty Mana');
  results.push(x.enemy.v012Rot[0].damage);
  x.c.now=1;B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,1,'cooldown prevents second proc');
  x.c.now=2;B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,2,'proc available after two seconds');
  x.c.critical=false;x.c.now=4;B.onAttack(b,x.c);
  assert.equal(x.enemy.v012Rot.length,2,'non-critical strike cannot trigger precision');
 }
 assert.deepEqual(results,[6,8,10]);
 const b2=build(['toxic_precision']),x=context({power:100,critical:true,mp:0});
 for(let i=0;i<10;i++){x.c.now=i*2;B.onAttack(b2,x.c);}
 assert.equal(x.enemy.v012Rot.length,6,'Rot stack cap remains six');
});
test('Toxic Precision and Toxic Touch still use separate applications and do not double spend Mana',()=>{
 const b=build(['toxic_precision']),x=context({mp:10,power:100,critical:true});
 x.c.random=()=>0;
 B.onAttack(b,x.c);
 assert.equal(x.enemy.v012Rot.length,2,'separate Toxic Touch and Precision applications');
 assert.equal(x.player.mp,9,'only Toxic Touch costs one Mana');
});
test('Stage 3 generated Pages and active node descriptions have no retired fixed-HP regen and old Rot formula',()=>{
 for(const p of ['combat/talent-graph-next.js','combat/v012-buildcraft.js','combat/talent-catalog.js']){
  assert.equal(fs.readFileSync('docs/'+p,'utf8'),fs.readFileSync(p,'utf8'),p+' Pages mirror');
 }
 const tree=fs.readFileSync('combat/talent-graph-next.js','utf8');
 const craft=fs.readFileSync('combat/v012-buildcraft.js','utf8');
 assert(tree.includes('0.15% maximum Health per combat second'));
 assert(!tree.includes('Regenerate 0.2 Health per second during combat.'));
 assert(craft.includes('6% base hit damage + 2% Spell Power'));
 assert(!craft.includes("applyRot(b,c,base*.06);"));
});

test('Stage 3 comparator validates frozen Stage 2 cohorts and rejects unrelated Affinity drift',()=>{
 const C=require('../scripts/v013-stage3-coherence-compare.cjs');
 const before=require('../reports/v013-stage2-affinity-freeze.json');
 const groups=before.groups.map(g=>({...g}));
 groups.find(g=>g.build==='pure-vitality').meanHealingPerSecond+=.3;
 const current={settings:{...before.settings,output:'reports/current.json'},
  summary:{valid:48,errors:0,timeouts:0,groups}};
 assert.equal(C.compare(before,current).length,24);
 groups.find(g=>g.build==='pure-fury').meanHealingPerSecond+=.1;
 assert.throws(()=>C.compare(before,current),/Unrelated pure-fury/);
});
