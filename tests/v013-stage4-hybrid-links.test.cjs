'use strict';
// The six current adjacent v15 hybrid links and the optional Stage 4
// Fury + Radiance healing change. These exercise real Buildcraft callbacks,
// not a duplicate combat implementation.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const S=require('../scripts/simulate-progression.cjs');
const R=require('../scripts/v013-stage4-hybrid-review.cjs');
const F=require('../reports/v013-stage3-affinity-freeze.json');
const B=globalThis.WandererV012Buildcraft;
function makeBuild(id){const b=B.create();B.syncPermanent(b,buy([id]));return b;}
function encounter({hp=50,maxhp=200,attack=100,spellPower=100,crit=true,mp=40}={}){
 const player={hp,maxhp,mp,maxmp:100,barrier:0,stats:{attack,spellPower}};
 const enemy={hp:5000,maxhp:5000,bleedStacks:1,dots:{bleed:[{damage:10,remaining:3}],burn:[]},v012Rot:[{damage:10,remaining:4}],slowTime:0};
 const events=[];
 const c={player,enemy,now:0,base:100,power:spellPower,critical:crit,funded:true,amp:1,
  random:()=>.99,damage:(n,label)=>events.push({kind:'damage',amount:n,label}),
  dot:(kind,n)=>events.push({kind:'dot',dot:kind,amount:n}),
  heal:(amount)=>{const available=Math.max(0,player.maxhp-player.hp),actual=Math.min(available,Math.max(0,amount)*(c.healingMultiplier??1));player.hp+=actual;events.push({kind:'heal',amount:actual});return actual;},
  barrier:(n)=>{events.push({kind:'barrier',amount:n});player.barrier+=n;},
  mana:n=>events.push({kind:'mana',amount:n}),
  chill:()=>{},log:()=>{},dotDamage:()=>{}};
 return {c,player,enemy,events};
}
const amounts=(ev,kind)=>ev.filter(x=>x.kind===kind).map(x=>x.amount);
test('Stage 4 all six adjacent links have legal 24-point native v15 allocations',()=>{
 const pairs=R.verifyTalentGraph();
 assert.equal(pairs.length,6);
 assert.equal(new Set(pairs.map(p=>p.id)).size,6);
 for(const p of pairs){
  const progress=S.talentPlan({families:[p.first,p.second],skills:['affinity_'+p.first,'affinity_'+p.second,p.skill]},24);
  assert(progress.nodes.includes(p.skill),p.id);
  assert(progress.nodes.includes('affinity_'+p.first)&&progress.nodes.includes('affinity_'+p.second));
 }
});
test('Stage 4 Crimson Rush requires crit and Bleed, without changing Blood + Fury base damage',()=>{
 const b=makeBuild('crimson_rush'),x=encounter();
 B.onAttack(b,x.c);
 assert(x.events.some(e=>e.kind==='damage'&&e.label.includes('Crimson Rush')&&e.amount===15));
 const before=x.events.filter(e=>e.label?.includes('Crimson Rush')).length;
 x.c.critical=false;B.onAttack(b,x.c);
 assert.equal(x.events.filter(e=>e.label?.includes('Crimson Rush')).length,before);
 x.c.critical=true;x.enemy.bleedStacks=0;B.onAttack(b,x.c);
 assert.equal(x.events.filter(e=>e.label?.includes('Crimson Rush')).length,before);
});
test('Stage 4 Fervent Life grants 2% Max HP + 3% Attack Power, crit only, cooldown 4s',()=>{
 for(const attack of [0,100,300]){
  const b=makeBuild('fervent_life'),x=encounter({attack,hp:10});
  x.c.critical=false;B.onAttack(b,x.c);assert.deepEqual(amounts(x.events,'heal'),[]);
  x.c.critical=true;B.onAttack(b,x.c);
  assert.equal(amounts(x.events,'heal')[0],4+attack*.03);
  x.c.now=1;B.onAttack(b,x.c);assert.equal(amounts(x.events,'heal').length,1);
  x.c.now=4;B.onAttack(b,x.c);assert.equal(amounts(x.events,'heal').length,2);
  assert.equal(amounts(x.events,'heal')[1],4+attack*.03);
  assert.equal(b.runtime.passiveTelemetry?.fervent_life?.activations,2);
 }
 const absent=makeBuild('fervent_life'),u=encounter({attack:NaN});
 B.onAttack(absent,u.c);
 assert.equal(amounts(u.events,'heal')[0],4,'missing invalid Attack Power cannot poison healing');
});
test('Stage 4 Fervent Life retains overheal Barrier conversion and healing reduction',()=>{
 const b=makeBuild('fervent_life'),x=encounter({attack:100,hp:200});
 B.onAttack(b,x.c);
 assert.equal(amounts(x.events,'heal')[0],0);
 assert.equal(amounts(x.events,'barrier')[0],3.5);
 x.c.healingMultiplier=.5;x.c.now=4;B.onAttack(b,x.c);
 assert.equal(amounts(x.events,'heal')[1],0);
 assert.equal(amounts(x.events,'barrier')[1],1.75);
});
test('Stage 4 Sanctuary converts only real healing into Barrier, respecting cooldown',()=>{
 const b=makeBuild('sanctuary'),x=encounter();
 B.onHeal(b,x.c,40);assert.equal(amounts(x.events,'barrier')[0],8);
 x.c.now=.5;B.onHeal(b,x.c,40);assert.equal(amounts(x.events,'barrier').length,1);
 x.c.now=1;B.onHeal(b,x.c,40);assert.equal(amounts(x.events,'barrier').length,2);
});
test('Stage 4 Runic Shield requires funded Magic cast and retains 3s cooldown',()=>{
 const b=makeBuild('runic_shield'),x=encounter();
 B.onCast(b,x.c);assert.equal(amounts(x.events,'barrier')[0],12);
 x.c.now=1;B.onCast(b,x.c);assert.equal(amounts(x.events,'barrier').length,1);
 x.c.now=3;B.onCast(b,x.c);assert.equal(amounts(x.events,'barrier').length,2);
 x.c.now=6;x.c.funded=false;B.onCast(b,x.c);assert.equal(amounts(x.events,'barrier').length,2);
});
test('Stage 4 Hex Bolt uses existing Rot plus Spell Power, cooldown 3s',()=>{
 const b=makeBuild('hex_bolt'),x=encounter();
 B.onCast(b,x.c);
 const hit=x.events.find(e=>e.kind==='damage'&&e.label.includes('Hex Bolt'));
 assert.equal(hit?.amount,35);
 x.c.now=1;B.onCast(b,x.c);
 assert.equal(x.events.filter(e=>e.label?.includes('Hex Bolt')).length,1);
 x.c.now=3;x.c.funded=false;B.onCast(b,x.c);
 assert.equal(x.events.filter(e=>e.label?.includes('Hex Bolt')).length,1);
});
test('Stage 4 Plague Spread uses current Dungeon death hook, no duplicate Buildcraft path',()=>{
 const talent=T.NODES.find(n=>n.id==='plague_spread');
 assert(talent&&talent.kind==='mixed');
 const s=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
 assert(s.includes("automaticTalents?.nodes?.includes('plague_spread')"));
 assert(s.includes("find(dot=>!dot.spread)"));
 assert(s.includes("phase6Metric(r,'plagueSpreadTransfers',transferred)"),'Native transfers must be observable in simulation');
 assert(s.includes("combatLinkEffect?.(r,'bleed',enemy,[target])"));
 assert(s.includes("combatLinkEffect?.(r,'rot',enemy,[target])"));
 assert(!fs.readFileSync('combat/v012-buildcraft.js','utf8').includes("rank(b,'plague_spread')"),
  'Do not add an artificial duplicate spread proc inside Buildcraft');
});
test('Stage 4 frozen Stage 3 audit rejects any unrelated Affinity regression',()=>{
 assert.equal(F.cases.valid,48);
 assert.equal(F.ferventLifeCases.length,4);
 const groups=F.values.map(row=>Object.fromEntries(F.fields.map((field,i)=>[field,row[i]])));
 const fixture=()=>({settings:{...F.settings,output:'ignored'},summary:{valid:48,errors:0,timeouts:0,groups:groups.map(x=>({...x}))}});
 assert.equal(R.compare(fixture()).length,24);
 const altered=fixture();
 altered.summary.groups.find(x=>x.build==='pure-arcane').meanManaSpent++;
 assert.throws(()=>R.compare(altered),/Unrelated Affinity drift/);
});
test('Stage 4 tooltip, runtime and generated Pages mirror have one consistent Fervent formula',()=>{
 const source=fs.readFileSync('combat/v012-buildcraft.js','utf8');
 assert.equal(fs.readFileSync('docs/combat/v012-buildcraft.js','utf8'),source);
 assert(source.includes('2% Max HP + 3% Attack Power'));
 assert(!source.includes('Critical strikes restore 2% maximum HP;'));
});
