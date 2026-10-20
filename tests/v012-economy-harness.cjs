// Execute the actual integrated HTML runtime with an inert DOM, seeded RNG and manual clock.
// Never boots account modules, reads local saves, or substitutes combat/loot formulas.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
module.exports=function createHarness(seed=1,source=fs.readFileSync(path.join(root,'index.html'),'utf8'),moduleOverrides={},options={}){
 const boot='phase1Init();render();';
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
 const sandbox={Math:math,...(options.now===undefined?{}:{Date:class extends Date{static now(){return options.now;}}}),URLSearchParams,location:{search:'?expeditionPhase1=1'},console,
  document:{body:node(),visibilityState:'visible',getElementById:getNode,querySelector:()=>null,querySelectorAll:queryAll,createElement:node},
  localStorage:{getItem(){throw Error('Unexpected save read');},setItem(){throw Error('Unexpected save write');}},
  setTimeout:fn=>{callbacks.push(fn);return callbacks.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){}};
 const inject=String.raw`
 const auditForge=renderForge,auditMerchant=renderMerchant;
 let auditConfirmation=null,auditFeedback=null;
 showConfirm=(title,body,fn)=>{auditConfirmation=fn;};showModal=()=>document.createElement('dialog');showPendingRuneReward=()=>{};
 render=renderCombat=renderPhase1=renderForge=renderMerchant=wallet=bannerMessage=animateStrike=animateDefense=animateEnemyStrike=updateBars=resetDungeonEntryScroll=()=>{};
 addLog=(text,type)=>{if(auditFeedback)auditFeedback.logs.push({text,type});};floatText=(value,target)=>{if(auditFeedback)auditFeedback.floats.push({value,target});};
 const measured={healed:0,barrier:0,absorbed:0,dot:0,burst:0,crit:0,attacks:0,blocks:0,incoming:0};
 if(${!!options.measure}){
  const healNative=setHeal,barrierNative=setBarrier,dotNative=tickDots,directNative=setDirectEnemyDamage,attackNative=weaponAttack,contextNative=phase2Context;
  setHeal=(...args)=>{const n=healNative(...args);measured.healed+=n;return n;};
  setBarrier=(...args)=>{const n=barrierNative(...args);measured.barrier+=n;return n;};
  tickDots=(...args)=>{const n=dotNative(...args);measured.dot+=n;return n;};
  setDirectEnemyDamage=(...args)=>{const n=directNative(...args);measured.burst=Math.max(measured.burst,n);return n;};
  weaponAttack=(...args)=>{measured.attacks++;return attackNative(...args);};
  phase2Context=(...args)=>{const c=contextNative(...args),native=c.dotDamage;c.dotDamage=(n,label)=>{measured.dot+=Math.min(Math.max(0,c.enemy.hp),Math.round(n));return native(n,label);};return c;};
  floatText=(value,target,critical)=>{if(target==='enemy'&&critical)measured.crit++;};
  animateEnemyStrike=()=>{measured.incoming++;};
  addLog=text=>{if(text.includes('BLOCK!'))measured.blocks++;if(text.includes('Barrier absorbs '))measured.absorbed+=Number(text.match(/absorbs ([0-9.]+)/)?.[1]||0);};
 }
 phase1Init();
 globalThis.audit={measured,
  potions:{supplies:()=>phase3Supplies,select:phase6SelectPotion,use:phase6UsePotion,inventory:phase6PotionInventory,start:phase6StartPotions,finish:phase6ReturnPotions,tick:phase6TickDurations,shop:(E=1,rng=gameRandom)=>WandererV012Consumables.shop(E,rng,makeId),buy:phase6BuyPotion,reroll:phase6RerollPotions},
  events:{open:phase6OpenEvent,choose:phase6EventChoice,run:()=>phase6Run},
  back:phase6BackToCamp,markAllSeen:markAllAsSeen,
  state:()=>state,results:()=>phase5Results,exitResult:phase5ExitResult,recordItem:item=>phase5Results.earned.push(phase5Item(item)),controller:()=>phase1Controller,build:()=>phase1Build,draft:()=>phase1Draft,
  start:phase1Begin,initial:phase2ChooseInitial,select:phase1Choose,enter:phase1Enter,passive:phase2ChoosePassive,element:phase2ChooseElement,
  passiveIcons:phase2PassiveIcons,initialPassive:WandererV012Buildcraft.initial,
  tick:updateFight,potion:phase3UsePotion,reroll:phase3Reroll,win:phase1WaveWon,death:phase1Death,abandon:phase1Abandon,
  now:setNow,ready:setReady,heal:setHeal,
  bag:{items:phase3BagItems,overflow:phase3BagOverflow,discard:phase3DiscardLoot,active:phase3ExpeditionActive,
   mark(item,overflow=false){(overflow?state.expeditionOverflow:state.stash).push(item);phase3LootIds.add(item.id);},
   ids:()=>Array.from(phase3LootIds),markup:phase3BagMarkup,passives:phase3PassivesMarkup},
  checkpoint:{capture:()=>phase4Entry?phase4Clone(phase4Entry):{profile:phase4Clone({...state,run:null}),session:phase4Session(),ledger:[]},
   restore(cp){state=phase4Clone(cp.profile);phase4Restore(phase4Clone(cp.session));},resume:phase4ResumeRealm,extract:phase4Extract,
   seed:()=>phase4Seed,random:gameRandom},
  feedback:()=>auditFeedback={logs:[],floats:[]},rng:value=>{Math.random=()=>value;gameRandom=()=>value;},
  stats:phase2Stats,baseStats:totalStats,makeItem,
  gear:{evasionChance,gearEvasionRating,tryDodge,enemyAttackType,statsWidget,itemComparison,setCounts,setBonuses,itemSource,itemImg,detailEffectHtml,affinityBadge,legendaryDescription,
   weaponAttack,legendaryReady,legendaryAttackBonus,enemyDebuffMarkup,dungeonEquipmentOdds,placeholderIcon,renderStash,
   renderForge:()=>auditForge(),renderMerchant:()=>auditMerchant(),
   screen:()=>document.getElementById('screen').innerHTML},slots:SLOTS,types:TYPES,offhandTypes:OFFHAND_TYPES,
  equip:equipItem,unequip:unequipItem,sale:saleFragments,craftCost,merchantCost,
  rollShop,refresh:refreshMerchantStock,economyCanAct,offerBossRunes,claimRune:claimPendingRuneChoice,
  runes:{unequip:unequipRune,salvage:salvageRune,recycle:salvageDuplicateRunes,equip:equipRune,confirm(){const fn=auditConfirmation;auditConfirmation=null;fn?.();}},
  runeValue,makeRune,validRune,safeRunes,safePendingRune,qualityOdds:WandererEconomyV0101.qualityOdds,rarityOdds,
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
 const files=['economy/v0101.js','combat/legendary.js','combat/v012-combat-core.js','combat/v012-gear-stats.js','combat/v012-runes.js','economy/v012-loot-rules.js','combat/v012-buildcraft.js','online/v012-expedition-controller.js','online/v012-expedition-events.js','online/v012-consumables.js'];
 files.push(...[...source.matchAll(/<script[^>]+src="([^"]+-runtime\.js)"/g)].map(m=>m[1]));
 vm.runInNewContext(files.map(f=>moduleOverrides[f]??fs.readFileSync(path.join(root,f),'utf8')).join('\n')+'\n'+main.replace(boot,inject),sandbox,{timeout:20000});
 sandbox.audit.flush=()=>{for(let i=0;callbacks.length;i++){if(i>10000)throw Error('Callback loop');callbacks.shift()();}};
 sandbox.audit.buildcraft=sandbox.WandererV012Buildcraft;
 sandbox.audit.catalog=sandbox.WandererV012Buildcraft.CATALOG;
 return sandbox.audit;
};
