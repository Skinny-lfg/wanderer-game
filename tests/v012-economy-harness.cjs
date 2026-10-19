// Execute the actual integrated HTML runtime with an inert DOM, seeded RNG and manual clock.
// Never boots account modules, reads local saves, or substitutes combat/loot formulas.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
module.exports=function createHarness(seed=1,source=fs.readFileSync(path.join(root,'index.html'),'utf8')){
 const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';
 if(!source.includes(boot))throw Error('Integrated bootstrap not found');
 let next=seed>>>0;const math=Object.create(Math);math.random=()=>{next=(Math.imul(next,1664525)+1013904223)>>>0;return next/4294967296;};
 const callbacks=[],nodes=new Map();
 const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){},querySelectorAll:()=>[],close(){}});
 const getNode=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const queryAll=selector=>{
  if(selector!=='[data-buy]')return [];
  return [...getNode('screen').innerHTML.matchAll(/data-buy="([^"]+)"/g)].map(m=>{
   const n=getNode('buy-'+m[1]);n.dataset.buy=m[1];return n;
  });
 };
 const sandbox={Math:math,URLSearchParams,location:{search:'?expeditionPhase1=1'},console,
  document:{body:node(),visibilityState:'visible',getElementById:getNode,querySelector:()=>null,querySelectorAll:queryAll,createElement:node},
  localStorage:{getItem(){throw Error('Unexpected save read');},setItem(){throw Error('Unexpected save write');}},
  setTimeout:fn=>{callbacks.push(fn);return callbacks.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){}};
 const inject=String.raw`
 const auditForge=renderForge,auditMerchant=renderMerchant;
 let auditConfirmation=null;
 showConfirm=(title,body,fn)=>{auditConfirmation=fn;};showModal=()=>document.createElement('dialog');showPendingRuneReward=()=>{};
 render=renderCombat=renderPhase1=renderForge=renderMerchant=wallet=addLog=bannerMessage=animateStrike=animateDefense=animateEnemyStrike=updateBars=floatText=resetDungeonEntryScroll=()=>{};
 phase1Init();
 globalThis.audit={
  state:()=>state,controller:()=>phase1Controller,build:()=>phase1Build,draft:()=>phase1Draft,
  start:phase1Begin,select:phase1Choose,passive:phase2ChoosePassive,element:phase2ChooseElement,
  tick:updateFight,potion:phase3UsePotion,reroll:phase3Reroll,win:phase1WaveWon,death:phase1Death,abandon:phase1Abandon,
  now:setNow,ready:setReady,heal:setHeal,
  stats:phase2Stats,baseStats:totalStats,makeItem,slots:SLOTS,types:TYPES,offhandTypes:OFFHAND_TYPES,
  gearFamily:typeof gearFamily==='function'?gearFamily:()=>null,
  equip:equipItem,unequip:unequipItem,sale:saleFragments,craftCost,merchantCost,
  rollShop,refresh:refreshMerchantStock,economyCanAct,offerBossRunes,claimRune:claimPendingRuneChoice,
  runeValue,makeRune,validRune,qualityOdds:WandererEconomyV0101.qualityOdds,rarityOdds,
  economy:WandererEconomyV0101,renderForge,renderMerchant,
  vitals:phase3Vitals,setVitals:v=>{phase1Vitals=v;},setView:v=>{view=v;},
  claimOverflow:()=>typeof phase4ClaimOverflow==='function'?phase4ClaimOverflow():0,
  salvage(ids){chosenItems=new Set(ids);bulkSell();if(auditConfirmation){const fn=auditConfirmation;auditConfirmation=null;fn();}},
  craft(tier,quality=0,slot='weapon',subtype='Sword'){
   forgeTier=tier;forgeQuality=quality;forgeSlot=slot;forgeSubtype=subtype;
   auditForge();$('craft').onclick();
  },
  buy(index){auditMerchant();const buttons=Q('[data-buy]');buttons[index]?.onclick();if(auditConfirmation){const fn=auditConfirmation;auditConfirmation=null;fn();}},
  setupPreview(){phase1Init();},
  setup(tier,weapon,rarity='Rare'){
   state.stash=[];state.equip=makeSlots();state.gold=state.fragments=0;
   for(const slot of SLOTS){
    if(slot==='offhand'&&['Bow','Staff','Two-Handed'].includes(weapon))continue;
    const subtype=slot==='weapon'?weapon:slot==='offhand'?(weapon==='Wand'?'Orb':weapon==='Daggers'?'Off-Hand Dagger':'Shield'):'random';
    state.equip[slot]=makeItem(tier,slot,null,'loot',subtype,rarity);
   }
  }
 };
 `;
 const main=source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 const files=['combat/legendary.js','combat/v012-buildcraft.js','online/v012-expedition-controller.js'];
 vm.runInNewContext(files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n')+'\n'+main.replace(boot,inject),sandbox,{timeout:20000});
 sandbox.audit.flush=()=>{for(let i=0;callbacks.length;i++){if(i>10000)throw Error('Callback loop');callbacks.shift()();}};
 sandbox.audit.catalog=sandbox.WandererV012Buildcraft.CATALOG;
 return sandbox.audit;
};
