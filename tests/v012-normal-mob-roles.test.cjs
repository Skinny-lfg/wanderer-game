'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtime=fs.readFileSync(path.join(root,'combat/v012-combat-runtime.js'),'utf8');
const coreSrc=fs.readFileSync(path.join(root,'combat/v012-combat-core.js'),'utf8');

const start=html.indexOf('const THEMES=[');
const end=html.indexOf('const C3_DUNGEON_ART=',start);
assert.ok(start>=0&&end>start);
const registry={};
vm.runInNewContext(html.slice(start,end)+';globalThis.catalog={themes:THEMES,pools:MOB_POOLS};',registry);
const catalog=registry.catalog;
const ctx={};
vm.runInNewContext(coreSrc,ctx);
vm.runInNewContext(runtime,ctx);
const Core=ctx.WandererV012CombatCore;
const Runtime=ctx.WandererV012CombatRuntime;
const all=catalog.themes.flatMap(theme=>theme.mobs.map(mob=>({theme,mob})));
const declared={
 'Blight Mantis':'skirmisher','Spore Toad':'caster',
 'Crimson Courtier':'skirmisher','Bloodfang Ravager':'skirmisher',
 'Sanguine Leech':'skirmisher','Bonewaste Burrower':'tank',
 'Carrion Harrier':'skirmisher','Gravewind Howler':'skirmisher',
 'Chainmaw Brute':'tank','Ironhorn Charger':'tank',
 'Cinder Hexer':'caster','Aether Wyrm':'caster',
 'Hollow Shade':'caster','Grave Lantern':'skirmisher',
 'Sigil Squire':'tank','Bulwark Scarab':'tank',
 'Thornback Stag':'tank','Canopy Stalker':'skirmisher',
 'Rootbound Hermit':'caster','Bloom Wisp':'caster',
 'Shardspark Moth':'caster','Tempest Prism':'caster',
 'Barnacle Legionnaire':'tank','Tidebound Shellbeast':'tank'
};
function spawn(theme,mob,level=50,opts={}){
 const ports={
  state:{run:{eliteType:opts.eliteId||null}},currentTheme:()=>theme,
  estimateEnemy:(tier,n)=>Core.estimateEnemy(tier,n),
  sample:()=>mob,
  eliteArchetype:()=>({id:opts.eliteId||'caster',name:'Elite Caster',icon:'🔮',hp:1,atk:1,def:1,interval:1.65}),
  eliteArt:()=>mob.image,
  bossForTier:()=>({name:'Sample Boss',image:'boss.png',style:'leech'})
 };
 return Runtime.create(ports).enemyFor(level,1,{theme,boss:!!opts.boss,elite:!!opts.elite,variant:opts.boss?{name:'Sample Boss',image:'boss.png',style:'leech'}:null});
}
test('24 animated mobs each have a stable, explicit visual combat type',()=>{
 assert.equal(catalog.themes.length,12);
 assert.equal(all.length,24);
 assert.equal(new Set(all.map(x=>x.mob.name)).size,24);
 const counts={tank:0,skirmisher:0,caster:0};
 for(const {theme,mob}of all){
  assert.equal(mob.role,declared[mob.name],theme.name+': '+mob.name);
  counts[mob.role]++;
  assert.match(mob.image,/^assets\/mobs\/animated\/.+\.gif$/);
  const gif=fs.readFileSync(path.join(root,mob.image));
  assert.equal(gif.toString('ascii',0,3),'GIF',mob.image);
  assert.ok(fs.existsSync(path.join(root,mob.image.replace(/\.gif$/,'.png'))),'missing animation idle '+mob.name);
 }
 assert.deepEqual(counts,{tank:8,skirmisher:8,caster:8});
});
test('each normal enemy spawns with its assigned role and appropriate physical or magic attack',()=>{
 for(const {theme,mob}of all){
  const e=spawn(theme,mob);
  assert.equal(e.role,mob.role,mob.name+' role');
  assert.equal(e.name,mob.name);
  assert.equal(e.image,mob.image);
  assert.equal(e.attackType,mob.role==='caster'?'spell':'physical',mob.name+' attack type');
  assert.equal(Core.enemyAttackType(e),e.attackType);
  assert.equal(e.attackEvery,mob.role==='skirmisher'?1.42:1.72);
  assert.equal(e.maxhp,Math.max(1,Math.round(Core.estimateEnemy(50,1).hp*({tank:1.08,skirmisher:.92,caster:.95}[mob.role]))));
  assert.equal(e.def,Core.estimateEnemy(50,1).def);
  assert.equal(e.barrier,0,'normal roles gain no elite barrier');
  assert.equal(e.eliteType,null,'no elite ability or debuff on normal mob');
 }
});
test('Caster uses existing anti-evasion spell hit rule while other normal mobs remain physical',()=>{
 const hitlog=[],p={evasionChance:()=>1,gameRandom:()=>0,addLog:x=>hitlog.push(x),floatText:()=>{}};
 const dodge=Runtime.create(p).tryDodge;
 const run={tier:50,stats:{evasionRating:999},enemy:{name:'dummy'}};
 assert.equal(dodge(run,'physical'),true);
 assert.equal(dodge(run,'spell'),false);
 assert.equal(hitlog.length,1);
});
test('elite/boss overrides remain intact and do not inherit normal caster passives',()=>{
 const {theme,mob}=all.find(x=>x.mob.role==='caster');
 const elite=spawn(theme,mob,50,{elite:true,eliteId:'caster'});
 const boss=spawn(theme,mob,50,{boss:true});
 assert.equal(elite.role,'miniboss');
 assert.equal(elite.attackType,'spell');
 assert.equal(elite.eliteType,'caster');
 assert.equal(elite.attackEvery,1.65);
 assert.equal(boss.role,'boss');
 assert.equal(boss.attackType,'spell');
 assert.equal(boss.bossStyle,'leech');
});
test('type profiles stay within a small aggregate budget before real combat validation',()=>{
 // Old pool: first mob was Bruiser (HP 1.08, rate 1.72),
 // second mob Skirmisher (HP .92, ATK 1.08, rate 1.42).
 const baselineHP=(1.08+.92)/2;
 const baselineThreat=(1/1.72+1.08/1.42)/2;
 const weights={tank:{hp:1.08,attack:1,seconds:1.72,physical:true},
   skirmisher:{hp:.92,attack:1.08,seconds:1.42,physical:true},
   caster:{hp:.95,attack:1,seconds:1.72,physical:false}};
 const avgHP=all.reduce((total,{mob})=>total+weights[mob.role].hp,0)/all.length;
 assert.ok(Math.abs(avgHP/baselineHP-1)<.03);
 for(const dodgeChance of [0,.20,.30]){
  const oldExpected=baselineThreat*(1-dodgeChance);
  const next=all.reduce((total,{mob})=>{
   const w=weights[mob.role];
   return total+w.attack/w.seconds*(w.physical?1-dodgeChance:1);
  },0)/all.length;
  assert.ok(Math.abs(next/oldExpected-1)<.10,'aggregate expected damage changes <10% at Dodge '+dodgeChance);
 }
});
test('normal casters reuse elemental enemy projectile VFX, not Elite Caster hex',()=>{
 assert.match(html,/EnemyCaster:'spell_projectile_wand'/);
 assert.match(html,/kind==='EnemyCaster'/);
 assert.match(html,/role==='caster'\?'EnemyCaster'/);
 assert.match(html,/combatEffect\(kind,e\?\.effect==='regen'\?'nature':e\?\.effect\)/);
 assert.doesNotMatch(runtime,/role==='caster'[\s\S]{0,100}playerDebuffUntil/);
});
