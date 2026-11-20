'use strict';
// Off-Hand Stage 2: real unified gear rolls, rarity budgets and derived stats.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const G=require('../economy/v013-gear-rolls.js'),create=require('./v012-economy-harness.cjs');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const TYPES=['Orb','Tome','Charm'];
const MAINS={Orb:'spell',Tome:'mana',Charm:'hp'};
function roll(type,rarity='Epic',seed=101,count=1,power=35){
 const random=rng(seed);
 return Array.from({length:count},()=>G.apply({slot:'offhand',subtype:type,rarity},power,random));
}
const budgetValue=x=>G.KEYS.reduce((sum,k)=>sum+(Number(x[k])||0)*G.COST[k],0);

test('Off-Hand identities have distinct, useful mandatory stats from Common onward',()=>{
 assert.deepEqual(TYPES.map(type=>G.PROFILES[type].main),['spell','mana','hp']);
 for(const type of TYPES){
  for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary']){
   const items=roll(type,rarity,12345,120);
   for(const x of items){
    assert(x[MAINS[type]]>0,type+' '+rarity+' requires '+MAINS[type]);
    assert.equal(x.affixes[0],MAINS[type]);
    assert.equal(new Set(x.affixes).size,x.affixes.length,'no duplicate affixes');
    assert.equal(x.v013StatCount,x.affixes.length);
    const [min,max]={Common:[1,1],Uncommon:[2,2],Rare:[2,4],Epic:[3,4],Legendary:[4,5]}[rarity];
    assert(x.v013StatCount>=min&&x.v013StatCount<=max,type+' '+rarity+' stat count');
    for(const key of G.KEYS)assert(Number.isFinite(Number(x[key]||0))&&Number(x[key]||0)>=0,type+' '+rarity+' '+key);
    if(rarity==='Common'){
     assert.deepEqual(x.affixes,[MAINS[type]]);
     for(const key of G.PRIMARY)assert(!(x[key]>0),'Common items have no attributes');
    }
   }
  }
 }
});

test('Distinct weighted secondary pools are materially represented in Epic rolls',()=>{
 const n=2400,identities=[
  ['Orb','wardBonus',['wardBonus','hp','mana','manaRegenBonus']],
  ['Tome','manaRegenBonus',['manaRegenBonus','spell','hp']],
  ['Charm','def',['def','spell','wardBonus','mana']]
 ];
 for(const [type,identity,extras] of identities){
  const rows=roll(type,'Epic',27182+type.length,n);
  const signature=rows.filter(x=>x.affixes.includes(identity)).length/n;
  const distinct=rows.filter(x=>x.affixes.some(key=>extras.includes(key))).length/n;
  assert(signature>=.30,type+' '+identity+' chance is still too low: '+signature);
  assert(distinct>=.58,type+' special secondaries still lose to generic attributes: '+distinct);
  assert(rows.every(x=>x.affixes.length>=3&&x.affixes.length<=4));
 }
});

test('Off-Hand reroll respects the shared power budget and fixed secondary caps at all tiers',()=>{
 for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary'])
  for(const power of [3,20,100,500])
   for(const type of TYPES)
    for(const x of roll(type,rarity,818+power+rarity.length,150,power)){
     assert.equal(x.v013Budget,Math.round(power*G.BUDGET[rarity]*100)/100);
     const effective=budgetValue(x);
     assert(effective<=x.v013Budget+6,'No free extra stat budget: '+type+' '+rarity+' '+effective+' / '+x.v013Budget);
     assert(effective>=x.v013Budget-Math.max(5,x.v013Budget*.1),'Stat budgets are not silently lost: '+type+' '+rarity+' '+effective+' / '+x.v013Budget);
     for(const [key,limits] of Object.entries(G.SECONDARY_CAPS))
      assert((x[key]||0)<=limits[rarity]+1e-8,type+' '+rarity+' '+key+' exceeds cap');
    }
});

test('Native Common Tome adds Mana on Wand; Common Charm adds HP on physical Sword',()=>{
 const a=create(59108),wand=a.makeItem(1,'weapon',null,'loot','Wand','Common'),sword=a.makeItem(1,'weapon',null,'loot','Sword','Common');
 const tome=a.makeItem(1,'offhand',null,'loot','Tome','Common');
 const charm=a.makeItem(1,'offhand',null,'loot','Charm','Common');
 const orb=a.makeItem(1,'offhand',null,'loot','Orb','Common');
 assert.deepEqual(tome.affixes,['mana']);assert.deepEqual(charm.affixes,['hp']);assert.deepEqual(orb.affixes,['spell']);
 const wandBase=a.baseStats({weapon:wand}),wandWithTome=a.baseStats({weapon:wand,offhand:tome});
 assert(wandWithTome.mana>wandBase.mana,'Tome improves real Mana pool');
 const swordBase=a.baseStats({weapon:sword}),swordWithCharm=a.baseStats({weapon:sword,offhand:charm});
 assert(swordWithCharm.maxhp>swordBase.maxhp,'Charm improves physical builds without Magic/Decay');
});

test('Loot, Merchant and Forge use identical Off-Hand generators; no new Epic recipes',()=>{
 const a=create(59109),Craft=globalThis.WandererV013Crafting;
 for(const type of TYPES)for(const source of ['loot','merchant','forge'])
  for(const rarity of ['Common','Uncommon','Rare','Epic']){
   const x=a.makeItem(35,'offhand',null,source,type,rarity);
   assert.equal(x.subtype,type);
   assert.equal(x.rarity,rarity);
   assert.equal(x.affixes[0],MAINS[type]);
   assert(x[MAINS[type]]>0);
  }
 assert(Craft.RECIPES.some(r=>r.id==='epic_aether_orb'));
 assert(!Craft.RECIPES.some(r=>r.rarity==='Epic'&&['Tome','Charm'].includes(r.subtype)),'Epic recipes belong to Stage 3');
});

test('Off-Hand Stage 2 source and generated Pages script remain identical',()=>{
 const src=fs.readFileSync('economy/v013-gear-rolls.js','utf8');
 assert.equal(fs.readFileSync('docs/economy/v013-gear-rolls.js','utf8'),src);
 assert(src.includes('spec.extraWeights?.[k]??1.6'),'affix weights are explicitly subtype-specific');
});
