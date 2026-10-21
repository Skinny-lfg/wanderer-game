'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),create=require('../tests/v012-economy-harness.cjs');
const simFile=path.resolve(__dirname,'v012-affinity-combat-sim.cjs');
let src=fs.readFileSync(simFile,'utf8');
for(const [old,rep] of [['a.setup(E,weapon,rarity)','void 0'],['g.unlocked=E;','void 0;'],["if(runes){s.runes=['vitality','warding',['Staff','Wand'].includes(weapon)?'wisdom':'might'].map(f=>a.makeRune(f,E));s.runeSlots=s.runes.map(r=>r.id);}",'void 0;']]){if(!src.includes(old))throw Error('Missing audit anchor '+old);src=src.replace(old,rep);}
const mod=new Module(simFile,module);mod.filename=simFile;mod.paths=Module._nodeModulePaths(path.dirname(simFile));mod._compile(src,simFile);
const scenarios={base:[],fortuneHeal:['fortune','health','haste'],fortuneRisk:['fortune','might','ironhide'],health3:['health','health','health']},out=[];
for(const [name,kinds]of Object.entries(scenarios))for(let seedIndex=0;seedIndex<24;seedIndex++){
 const a=create(84100+seedIndex),s=a.state(),g=a.controller().state;a.setup(200,'Bow','Epic');
 let j=0;for(const [slot,item]of Object.entries(s.equip))if(item){const tier=196+((j*3+seedIndex)%5),rarity=j%5===0?'Rare':'Epic',armor=['helm','armor','gloves','belt','boots'].includes(slot);s.equip[slot]=a.makeItem(tier,slot,null,'loot',slot==='weapon'?'Bow':armor?'Leather':item.subtype,rarity);j++;}
 s.runes=['vitality','warding','might'].map((f,i)=>a.makeRune(f,[190,195,199][i]));s.runeSlots=s.runes.map(r=>r.id);s.gold=4000;s.fragments=3000;g.unlocked=200;
 const startingGold=30000;s.gold=startingGold;
 let buyGold=0,refreshGold=0,refreshes=0,procurementError=null;
 if(kinds.length){s.apothecary=a.potions.shop(200);
  for(const kind of kinds){let offer=s.apothecary.stock.find(x=>x.kind===kind);
   for(let tries=0;!offer&&tries<75;tries++){
    const before=s.gold;if(!a.potions.reroll()){procurementError='Insufficient Gold for reroll '+kind;break;}
    refreshGold+=before-s.gold;refreshes++;offer=s.apothecary.stock.find(x=>x.kind===kind);
   }
   if(procurementError||!offer){procurementError ||= 'No offer '+kind;break;}
   const before=s.gold;if(!a.potions.buy(offer.id)){procurementError='Buy failed '+kind;break;}
   buyGold+=before-s.gold;
  }
  if(!procurementError)for(const kind of kinds){if(!a.potions.select(kind)){procurementError='Selection failed '+kind;break;}}
 }
 const beforeInventory={...a.potions.inventory()};
 const seed=851000+seedIndex*10007;
 let r;try{if(procurementError)throw Error(procurementError);r=mod.exports.run({E:200,weapon:'Bow',rarity:'Epic',family:'fury',strategy:'triple',routeMode:'planned',runes:true,seed,controlSeed:seed,potionKinds:kinds,potionsPreloaded:true,harnessFactory:()=>a});}catch(e){r={error:e.stack||String(e)};}
 const afterInventory={...a.potions.inventory()};const earned=a.results().earned||[],summary=a.results().summary||{};const used=r.potionUses||[],price={health:350,mana:350,might:550,arcane:550,ironhide:550,haste:750,fortune:1050,barrier:750};
 const spent=kinds.reduce((v,k)=>v+price[k],0);
 const row={scenario:name,seedIndex,win:!!r.win,reached:r.reached||0,error:r.error||null,timeout:!!r.timeout,used:used.length,uses:used,selected:kinds,estimatedInitialCost:spent,hpFatal:r.fatalFight?.hpBeforeFatalTick??null,damageReceived:r.damageReceived??null,lootCount:earned.length,lootRarities:earned.map(x=>x.rarity||null),goldEarned:summary.gold||0,fragmentsEarned:summary.fragments||0,treasuresKept:summary.treasuresKept?.length||0,lootKept:summary.kept?.length||0,lootLost:summary.lost?.length||0,fortuneApplied:kinds.includes('fortune'),buyGold,refreshGold,refreshes,startingGold,finalGold:s.gold,beforeInventory,afterInventory,netGoldChange:s.gold-startingGold,actualCost:buyGold+refreshGold,remainingPotions:Object.values(afterInventory).reduce((n,v)=>n+v,0)};
 out.push(row);
}
const result={rows:out,summary:Object.keys(scenarios).map(scenario=>{const rows=out.filter(x=>x.scenario===scenario);return {scenario,runs:rows.length,wins:rows.filter(x=>x.win).length,errors:rows.filter(x=>x.error).length,timeouts:rows.filter(x=>x.timeout).length,used:rows.reduce((n,x)=>n+x.used,0),meanReached:+(rows.reduce((n,x)=>n+x.reached,0)/rows.length).toFixed(2),selectedGold:rows.reduce((n,x)=>n+x.estimatedInitialCost,0),buyGold:rows.reduce((n,x)=>n+x.buyGold,0),refreshGold:rows.reduce((n,x)=>n+x.refreshGold,0),netGold:rows.reduce((n,x)=>n+x.netGoldChange,0),kept:rows.reduce((n,x)=>n+x.lootKept,0),lost:rows.reduce((n,x)=>n+x.lootLost,0),treasureKept:rows.reduce((n,x)=>n+x.treasuresKept,0),loot:rows.reduce((n,x)=>n+x.lootCount,0),gold:rows.reduce((n,x)=>n+x.goldEarned,0),fragments:rows.reduce((n,x)=>n+x.fragmentsEarned,0),rarities:Object.fromEntries(['Common','Uncommon','Rare','Epic','Legendary'].map(k=>[k,rows.reduce((n,x)=>n+x.lootRarities.filter(r=>r===k).length,0)]))};})};const target=process.argv[2]||'/tmp/wanderer-e26.json';fs.writeFileSync(target,JSON.stringify(result));console.log('E26_SUMMARY '+JSON.stringify(result.summary));if(result.summary.some(x=>x.errors||x.timeouts))process.exitCode=1;
