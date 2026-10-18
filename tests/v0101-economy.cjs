const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'economy/v0101.js'),'utf8'),ctx);
const e=ctx.WandererEconomyV0101;
assert(e,'v0.10.1 economy helper must load');
function close(a,b){assert(Math.abs(a-b)<1e-8, a+' != '+b);}
const base={Common:.478,Uncommon:.3,Rare:.1542,Epic:.0678,Legendary:0};
const boosted=e.qualityOdds(base,true);
close(boosted.Common,.308);close(boosted.Uncommon,.27);close(boosted.Rare,.2942);close(boosted.Epic,.1278);close(boosted.Legendary,0);
close(Object.values(boosted).reduce((a,b)=>a+b,0),1);
assert.equal(e.rarityFromOdds(boosted,()=>.999999),'Epic');
assert.throws(()=>e.qualityOdds({...base,Legendary:.01},true),/Legendary/);
for(const rng of [()=>0,()=>.1,()=>.5,()=>.999999]){
 const offer=e.rollOffer(['poison','slow','burn','regen','shield','crit','bleed'],rng);
 assert.equal(offer.length,4);assert.equal(new Set(offer).size,4);
}
const item={rarity:'Legendary',tier:100,atk:100,def:20,hp:40,spd:0,str:1,subtype:'Sword',effect:'burn',legendaryId:'unit'};
const skillIdentity=item.legendaryId,baseAffinity=item.effect;
let spend=0;
for(let rank=0;rank<10;rank++){
 spend+=e.upgradeCost(item.tier,rank);
 assert.equal(e.upgradeLegendary(item).upgradeRank,rank+1);
}
assert.equal(item.atk,120);assert.equal(item.def,24);assert.equal(item.hp,48);
assert.equal(item.effect,baseAffinity);assert.equal(item.legendaryId,skillIdentity);
assert.equal(spend,8217);
assert.throws(()=>e.upgradeLegendary(item),/Not eligible|max rank/);
const save=structuredClone(item);assert.equal(save.upgradeRank,10);
assert.equal(save.upgradeBase.atk,100);
// Low-level Legendary stats must retain fractional gains, rather than silently rounding to zero.
const oldSword={rarity:'Legendary',tier:1,subtype:'Sword',effect:'burn',atk:3,def:1};
for(let rank=0;rank<7;rank++)e.upgradeLegendary(oldSword);
assert.equal(oldSword.upgradeRank,7);
assert.equal(oldSword.atk,3.42);
assert.equal(oldSword.def,1.14);
assert.equal(oldSword.upgradeBase.atk,3);

assert.equal(e.sigilPrice(100),1000);
assert.equal(e.transferCost(100,'economy'),505);
assert.equal(e.transferCost(100,'balanced'),1010);
assert.equal(e.transferCost(100,'secure'),1515);
const wand={rarity:'Epic',tier:100,subtype:'Wand',slot:'weapon',effect:'burn',magic:'burn'};
assert.equal(e.transfer(wand,'slow',['burn','slow'],'balanced',()=>.999),false);
assert.equal(wand.effect,'burn');assert.equal(wand.magic,'burn');
assert.equal(e.transfer(wand,'slow',['burn','slow'],'balanced',()=>0),true);
assert.equal(wand.effect,'slow');assert.equal(wand.magic,'slow');
assert.throws(()=>e.transfer(item,'slow',['slow'],'balanced',()=>0),/Illegal/);
assert.throws(()=>e.transfer(wand,'sunder',['burn','slow'],'balanced',()=>0),/Illegal/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const anchor of [
 'function renderForgeEconomyExtras()','function renderMerchantSigils()',
 'forgeQualityToggle','upgradeLegendaryBtn','forgeInvestmentButton',
 'forgeItemPicker','forgeSigilPicker','forgeLegendaryPicker',
 'data-forge-item','data-forge-sigil','data-forge-invest',
 'refreshSigilStock','merchantSigilHost','merchantSecondaryGrid',
 'affinityArt(a)','state.merchant.sigils[idx]=next',
 'Upgraded Legendary at risk','sigils:Array.isArray(o.sigils)',
 'uiIcon(\'fragments\')','save();renderMerchant()'
])assert(html.includes(anchor),'Missing live integration: '+anchor);
assert(html.includes("if(kind==='sigils')merchant.sigils="),'Sigil refresh must only replace Sigil offers');
assert(html.includes('merchant.stock=Array.from({length:4}'),'Equipment refresh must separately replace gear');
assert(html.includes("refreshMerchantStock('sigils')"),'Sigil reroll handler must be independent');
assert(html.includes("refreshMerchantStock('gear')"),'Equipment reroll handler must be independent');
assert(html.includes('class="panel forgeUnified"'),'Crafting and crafting odds must share one Forge panel');
assert(html.includes('function legendaryRankBadge('),'Legendary rank must appear on item cards');
assert(html.includes('v.upgradeRank*.02'),'Migrating an existing upgraded item should preserve precision');
assert(html.includes('eliteCombatant'),'Elite portraits need their larger dedicated style');
assert(html.includes('Wanderer v0.10.1</title>'),'Page title must show v0.10.1');
assert(!html.includes('merchant.sigils[idx]=null'),'A purchased Sigil must be replaced immediately');
assert(!html.includes('not usable on Legendary'),'Merchant Sigils no longer repeat this label');
assert(!html.includes('firebase deploy'),'Economy change must not deploy rules');
console.log('v0.10.1 economy test PASS — precise Legendary ranks, independent Merchant refreshes, save migration anchors, Forge UI and economics');
