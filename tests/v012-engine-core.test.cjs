// Pure v0.12 engine modules. No browser, Firebase or save state.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),sandbox={};
for(const file of ['combat/v012-combat-core.js','combat/v012-gear-stats.js','combat/v012-runes.js','economy/v012-loot-rules.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const C=sandbox.WandererV012CombatCore,G=sandbox.WandererV012GearStats,L=sandbox.WandererV012LootRules;
test('combat rules use the original formulas and do not mutate player or enemy',()=>{
 assert.equal(C.evasionChance(0,10,100,.42),0);
 assert.equal(C.evasionChance(20,10,100,.42),Math.min(.42,1/(1+100*(2+10*.91)/20)));
 assert.equal(C.enemyAttackType({eliteType:'caster'}),'spell');
 assert.equal(C.enemyAttackType({bossStyle:'leech'}),'spell');
 assert.equal(C.enemyAttackType({attackType:'physical',eliteType:'caster'}),'physical');
 assert.equal(C.affinityProcChance('Daggers',false),.52);
 assert.equal(C.affinityProcChance('Staff',true),.9);
 const enemy=C.estimateEnemy(10,3);
 assert(enemy.hp>0&&enemy.atk>0&&enemy.def>=0);
 const base={attack:100,spellPower:20,defense:30,attacksPerSec:1.3};
 const out=C.applyExpeditionModifiers(base,{might:{power:.1,remaining:2},arcane:{power:.25,remaining:1},ironhide:{power:.1,remaining:0},haste:{power:.08,remaining:1},attack:.05,defense:.07});
 assert.equal(base.attack,100);
 assert.equal(out.attack,115.50000000000001);
 assert.equal(out.spellPower,25);
 assert.equal(out.defense,32.1);
});
test('loot rules preserve drop odds, weighted gear selection and RNG injection',()=>{
 assert.equal(L.craftCost(80),810);
 const w1=L.waveLootOdds(1,5);
 assert.equal(w1.drop,.22);
 assert.equal(w1.rarities.Legendary,.001);
 assert.equal(L.randomFromOdds({Common:.5,Rare:.5},()=>0),'Common');
 assert.equal(L.randomFromOdds({Common:.5,Rare:.5},()=>.75),'Rare');
 const options=L.dungeonEquipmentOdds(null,['Sword'],['Sword','Mace'],['Shield']);
 assert(Math.abs(Array.from(options).reduce((n,x)=>n+x.prob,0)-1)<1e-9);
 assert(Math.abs(Array.from(options).filter(x=>x.slot==='weapon').reduce((n,x)=>n+x.prob,0)-.15)<1e-9);
 const picked=L.dungeonEquipmentPick(null,[],['Sword','Mace'],['Shield'],()=>0,x=>x[0]);
 assert.equal(picked.slot,'weapon');
 assert.equal(picked.subtype,'Sword');
});
test('character stats use one source, retain two-hand restrictions and Rune bonuses',()=>{
 const equipment={weapon:{subtype:'Two-Handed',atk:12,str:2},offhand:{subtype:'Shield',atk:900}};
 const state={runes:[{id:'r1',family:'might',tier:5}],runeSlots:['r1']};
 const deps={isTwoHanded:item=>['Two-Handed','Bow','Staff'].includes(item?.subtype),
  FIELDS:[['STR','str'],['ATK','atk']],itemStatValue:(it,key)=>Number(it?.[key])||0,
  RUNE_FAMILIES:[{id:'might',field:'str'}],runeValue:()=>5,
  setCounts:()=>({crit:0}),setBonuses:()=>({list:[],values:{}}),
  state,PHASE1_PREVIEW:true,phase6Run:null};
 const s=G.totalStats(equipment,null,null,deps);
 assert.equal(s.str,12);
 assert.equal(s.attack,40);
 assert.equal(s.maxhp,115);
 assert.equal(s.off,null);
 assert.equal(s.caster,false);
 assert(s.power>0);
});

test('Rune values, Expedition tiers, pending choices and recycling use the canonical module',()=>{
 const R=sandbox.WandererV012Runes;
 assert.equal(R.FAMILIES.length,8);
 assert(Math.abs(R.runeValue('fury',1)-3.3)<1e-12);
 assert.equal(R.runeValue('warding',10),4);
 assert.equal(R.runeValue('vitality',20),30);
 const e1=R.makeRune('might',1,()=>'e1');
 assert.equal(e1.progression,'expedition');
 assert.equal(R.validRune(e1,200,true),true);
 assert.equal(R.validRune(e1,200,false),false);
 const legacy=R.makeRune('might',10,()=>'legacy',false);
 assert.equal(R.validRune(legacy,200,true),true);
 assert.equal(R.runeSalvageValue(e1,200,true),5);
 assert.equal(R.runeSalvageValue(legacy,200,false),7);
 assert.equal(R.runeSalvageValue(e1,200,false),0);
 const b=R.makeRune('fortune',1,()=>'b'),c=R.makeRune('wisdom',1,()=>'c');
 const pending=R.safePendingRune({tier:1,options:[e1,b,c]});
 assert.equal(pending.options.length,3);
 assert.equal(R.safePendingRune({tier:1,options:[e1,e1,c]}),null);
 assert.equal(R.safeRunes([e1,e1,b]).length,2);
 assert.equal(R.safeRunes([e1,b],200,false).length,0);
});
