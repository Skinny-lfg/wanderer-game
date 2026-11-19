// Execute the actual integrated HTML runtime with an inert DOM, seeded RNG and manual clock.
// Never boots account modules, reads local saves, or substitutes combat/loot formulas.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
require('../combat/v012-buildcraft.js');require('../combat/talent-catalog.js');require('../combat/talent-graph-next.js');require('../combat/talent-graph-bridge.js');require('../combat/talent-graph-runtime.js');
const root=path.resolve(__dirname,'..');
module.exports=function createHarness(seed=1,source=fs.readFileSync(path.join(root,'index.html'),'utf8'),moduleOverrides={},options={}){
 const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
 if(!source.includes(boot))throw Error('Integrated bootstrap not found');
 let next=seed>>>0;const math=Object.create(Math);math.random=()=>{next=(Math.imul(next,1664525)+1013904223)>>>0;return next/4294967296;};
 const callbacks=[],nodes=new Map(),isolatedSessionStorage=options.sessionStorage??new Map(),fixtureRoot=options.root||root;
 const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){},querySelectorAll:()=>[],before(){},close(){}});
 const getNode=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const queryAll=selector=>{
  if(selector!=='[data-buy]')return [];
  return [...getNode('screen').innerHTML.matchAll(/data-buy="([^"]+)"/g)].map(m=>{
   const n=getNode('buy-'+m[1]);n.dataset.buy=m[1];return n;
  });
 };
 const sandbox={Math:math,...(options.now===undefined?{}:{Date:class extends Date{static now(){return options.now;}}}),URL,URLSearchParams,location:{href:'http://localhost/?expeditionPhase1=1',search:'?expeditionPhase1=1'},history:{replaceState(){}},console,
  document:{body:node(),visibilityState:'visible',getElementById:getNode,querySelector:()=>null,querySelectorAll:queryAll,createElement:node,addEventListener(){}},
  localStorage:options.validationStorage?{getItem:key=>options.validationStorage.get(String(key))??null,setItem:(key,value)=>options.validationStorage.set(String(key),String(value)),removeItem:key=>options.validationStorage.delete(String(key))}:{getItem(){throw Error('Unexpected real save read');},setItem(){throw Error('Unexpected real save write');}},
  // The local preview deliberately persists only to sessionStorage. Keep that
  // slot isolated per harness; omitting it makes preview startup fail closed
  // and blocks otherwise valid economy actions in unit fixtures.
  sessionStorage:{getItem(key){return isolatedSessionStorage.has(String(key))?isolatedSessionStorage.get(String(key)):null;},setItem(key,value){isolatedSessionStorage.set(String(key),String(value));},removeItem(key){isolatedSessionStorage.delete(String(key));}},
  setTimeout:fn=>{callbacks.push(fn);return callbacks.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){}};
 sandbox.window=sandbox;sandbox.addEventListener=()=>{};
 if(options.validationStorage)sandbox.navigator={locks:{request(_key,_options,callback){return Promise.resolve(callback({}));}}};
 const inject=String.raw`
 const auditForge=renderForge,auditMerchant=renderMerchant,auditCombat=renderCombat;
 let auditConfirmation=null,auditFeedback=null;
 showConfirm=(title,body,fn)=>{auditConfirmation=fn;};showModal=()=>document.createElement('dialog');showPendingRuneReward=()=>{};
 render=renderCombat=renderPhase1=renderForge=renderMerchant=wallet=bannerMessage=animateStrike=animateDefense=animateEnemyStrike=updateBars=resetDungeonEntryScroll=()=>{};
 addLog=(text,type)=>{if(auditFeedback)auditFeedback.logs.push({text,type});};floatText=(value,target,critical,source)=>{if(auditFeedback)auditFeedback.floats.push({value,target,...(source?{source}:{})});};
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
 // Synthetic event unit fixtures deliberately override generated Realm metadata;
 // persistence is covered independently by the full lifecycle and browser suites.
 if(${!!options.skipPersistence})phase5Persist=()=>true;
 let harnessCombatActive=false,harnessControlRandom=gameRandom,harnessCombatRandom=null;
 const harnessPrng=initial=>{let value=initial>>>0;return()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);};
 function harnessStreams(routeSeed,draftSeed,controlSeed,combatSeed){
  const route=harnessPrng(routeSeed),draft=harnessPrng(draftSeed);harnessControlRandom=harnessPrng(controlSeed);harnessCombatRandom=harnessPrng(combatSeed);
  phase1Controller.setSimulationRandomStreams(route,draft);gameRandom=()=>harnessCombatActive?harnessCombatRandom():harnessControlRandom();
 }
 globalThis.audit={talents:WandererAutomaticTalents,measured,debug:()=>({phase5Ready,saveBlocked,message:phase5Message,validation:PHASE5_VALIDATION,preview:PHASE1_PREVIEW,active:phase3ExpeditionActive(),run:!!state.run,stage:phase1Controller?.state.stage}),
  potions:{catalog:WandererV012Consumables.CATALOG,supplies:()=>phase3Supplies,select:phase6SelectPotion,use:phase6UsePotion,inventory:phase6PotionInventory,start:phase6StartPotions,finish:phase6ReturnPotions,tick:phase6TickDurations,shop:(E=1,rng=gameRandom)=>WandererV012Consumables.shop(E,rng,makeId),buy:phase6BuyPotion,reroll:phase6RerollPotions},
  events:{open:phase6OpenEvent,choose:phase6EventChoice,run:()=>phase6Run},
  back:phase6BackToCamp,markAllSeen:markAllAsSeen,
  // Mirrors the live Camp Talent Tree API transactions; neither XP nor points
  // are injected. Valid only when the user could open the Talent Tree.
  talentActions:{
   available(){return ['camp','finished','failed'].includes(phase1Controller.state.stage)&&!state.run;},
   allocate(id){if(!this.available())return false;const before=state.automaticTalents,next=WandererAutomaticTalents.allocate(before,id);if(!next)return false;state.automaticTalents=next;if(!phase5Persist()){state.automaticTalents=before;return false;}return true;},
   prepare(id){if(!this.available())return false;const before=state.automaticTalents;
    if(id&&(!before.nodes.includes(id)||!WandererAutomaticTalents.NODES.find(n=>n.id===id)?.advanced))return false;
    const next={...before,prepared:id||null};if(!WandererAutomaticTalents.valid(next))return false;
    state.automaticTalents=next;if(!phase5Persist()){state.automaticTalents=before;return false;}return true;
   },
   element(id){if(!this.available())return false;const before=state.automaticTalents,next=WandererAutomaticTalents.selectElement(before,id);
    if(!next)return false;state.automaticTalents=next;if(!phase5Persist()){state.automaticTalents=before;return false;}return true;
   },
   reset(){if(!this.available())return false;const before=state.automaticTalents;
    const next=WandererAutomaticTalents.reset(before);state.automaticTalents=next;if(!phase5Persist()){state.automaticTalents=before;return false;}return true;
   }
  },
  state:()=>state,results:()=>phase5Results,exitResult:phase5ExitResult,recordItem:item=>phase5Results.earned.push(phase5Item(item)),controller:()=>phase1Controller,build:()=>phase1Build,
  treasures:{bag:phase3BagMarkup,stash:phase6ValuablesMarkup,result(){phase5RenderResult();return $('screen').innerHTML;},combat(){auditCombat();return $('screen').innerHTML;},sell:sellValuables},
  start:phase1Begin,enter:phase1Enter,
  passiveIcons:phase2PassiveIcons,initialPassive:WandererV012Buildcraft.initial,
  tick(...args){harnessCombatActive=true;try{return updateFight(...args);}finally{harnessCombatActive=false;}},streams:harnessStreams,potion:phase3UsePotion,win:phase1WaveWon,death:phase1Death,abandon:phase1Abandon,
  selectCombatTarget,now:setNow,ready:setReady,heal:setHeal,
  bag:{items:phase3BagItems,overflow:phase3BagOverflow,capacity:()=>PHASE3_BAG_CAPACITY,discard:phase3DiscardLoot,active:phase3ExpeditionActive,
   mark(item,overflow=false){(overflow?state.expeditionOverflow:state.stash).push(item);phase3LootIds.add(item.id);},
   ids:()=>Array.from(phase3LootIds),markup:phase3BagMarkup,passives:phase3PassivesMarkup},
  checkpoint:{capture:()=>phase4Entry?phase4Clone(phase4Entry):{profile:phase4Clone({...state,run:null}),session:phase4Session(),ledger:[]},
   restore(cp){state=phase4Clone(cp.profile);phase4Restore(phase4Clone(cp.session));},resume:phase4ResumeRealm,extract:phase4Extract,
   seed:()=>phase4Seed,random:gameRandom},
  feedback:()=>auditFeedback={logs:[],floats:[]},rng:value=>{Math.random=()=>value;gameRandom=()=>value;},
  encounter({count=3,boss=false,elite=false}={}){const g=phase1Controller.state;Object.assign(g.selected,{mobCount:count,boss,elite:elite||boss});state.run.status="ready";phase1StartWave();return state.run;},
  stats:phase2Stats,baseStats:totalStats,statSources:stats=>WandererV012GearStats.breakdown(state.equip,state.runes,state.runeSlots,statContext(),stats),statMarkup:phase3StatValue,makeItem,
  gear:{evasionChance,gearEvasionRating,tryDodge,enemyAttackType,statsWidget,itemComparison,setCounts,setBonuses,itemSource,itemImg,detailEffectHtml,affinityBadge,legendaryDescription,
   weaponAttack,legendaryReady,legendaryAttackBonus,enemyDebuffMarkup,dungeonEquipmentOdds,placeholderIcon,renderStash,
   renderForge:()=>auditForge(),renderMerchant:()=>auditMerchant(),
   screen:()=>document.getElementById('screen').innerHTML},slots:SLOTS,types:TYPES,offhandTypes:OFFHAND_TYPES,
  equip:equipItem,unequip:unequipItem,sale:saleFragments,craftCost,merchantCost,
  rollShop,refresh:refreshMerchantStock,economyCanAct,offerBossRunes,claimRune:claimPendingRuneChoice,
  // Simulator-only adapter for the exact v0.13 Forge rule and settlement used
  // by renderV013Forge. Does not grant items or bypass costs/recipe unlocks.
  forge:{
   preview(id,tier,focus='none'){return WandererV013Crafting.previewCraft(id,tier,(...args)=>makeItem(...args,true),focus);},
   progress(id,tier,focus='none'){return WandererV013Crafting.progress(state,id,tier,focus);},
   recipes:WandererV013Crafting.RECIPES,focuses:WandererV013Crafting.FOCUSES,
   refine(family){
    if(!economyCanAct())return false;
    const before=state.crafting,next=WandererV013Crafting.refine(before,family);
    if(!next)return false;
    state.crafting=next;
    if(!phase5Persist()){state.crafting=before;return false;}
    return true;
   },
   reinforceCost(id){
    const item=[...state.stash,...Object.values(state.equip).filter(Boolean)].find(x=>x?.id===id);
    if(!item||item.rarity!=='Legendary'||(item.upgradeRank||0)>=10)return null;
    return WandererEconomyV0101.upgradeCost(item.tier,item.upgradeRank||0);
   },
   reinforce(id){
    const item=[...state.stash,...Object.values(state.equip).filter(Boolean)].find(x=>x?.id===id);
    return !!item&&reinforceEquipment(item);
   },
   // Match the live named-tier Forge upgrade: same preview/prepare, same
   // ownership check, materials, unlock gate, item identity and rollback.
   tierPreview(id){return WandererV013TierUpgrade.preview(state,id,phase1Controller.state.unlocked);},
   tierUpgrade(id){
    if(!economyCanAct())return null;
    const result=WandererV013TierUpgrade.prepare(state,id,phase1Controller.state.unlocked);
    if(!result)return null;
    const before={fragments:state.fragments,crafting:state.crafting,stash:state.stash,equip:state.equip};
    state.fragments=result.fragments;state.crafting=result.crafting;
    if(result.location.kind==='stash')
     state.stash=state.stash.map((x,i)=>i===result.location.index&&x.id===result.item.id?result.item:x);
    else state.equip={...state.equip,[result.location.slot]:result.item};
    if(!phase5Persist()){Object.assign(state,before);return null;}
    return result.item;
   },
   craft(id,tier,focus='none'){
    if(!economyCanAct()||!stashHasRoom())return null;
    const result=WandererV013Crafting.prepareCraft(state,id,tier,makeItem,focus);
    if(!result)return null;
    const before={fragments:state.fragments,crafting:state.crafting,stash:state.stash};
    state.fragments=result.fragments;state.crafting=result.crafting;
    state.stash=[...state.stash,result.item];
    if(!phase5Persist()){Object.assign(state,before);return null;}
    return result.item;
   }
  },
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
  purchaseNative(index){const m=state.merchant,item=m?.stock?.[index];return !!item&&purchaseEquipment(m,index,item);},
  setupPreview(){phase1Init();},
  setUnlocked(level){
   phase1Controller.state.unlocked=level;
   if(phase5Snapshot?.expedition){
    phase5Snapshot.expedition.completed=level-1;
    phase5Snapshot.expedition.unlocked=level;
    phase5Snapshot.expedition.attempts=level-1;
    phase5Snapshot.expedition.active=null;
    phase5Snapshot.expedition.awardKeys=[];
    phase5Snapshot.expedition.lastOutcome=level>1?'victory':'new';
   }
   return level;
  },
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
 const files=['combat/expedition-progression.js','economy/v013-crafting.js','economy/v013-gear-rolls.js','economy/v013-tier-upgrade.js','online/v012-treasures.js','online/v012-save.js','economy/v0101.js','combat/legendary.js','combat/v012-combat-core.js','combat/v012-gear-stats.js','combat/v012-runes.js','economy/v012-loot-rules.js','combat/v012-buildcraft.js','combat/talent-catalog.js','combat/v013-expedition-foundation.js','online/v013-map-intelligence.js','online/v013-expedition-conditions.js','online/v013-expedition-boons.js','online/v013-expedition-contracts.js','online/v013-encounter-traits.js','online/v013-boss-modifiers.js','online/v013-boss-preparation.js','online/v013-enemy-roster.js','online/v013-enemy-abilities.js','online/v013-elite-abilities.js','online/v013-boss-infrastructure.js','online/v013-boss-abilities.js','online/v012-expedition-controller.js','online/v012-expedition-events.js','online/v012-consumables.js'];
 files.push('combat/talent-graph-next.js','combat/talent-graph-bridge.js');
 files.push(...[...source.matchAll(/<script[^>]+src="([^"?]+-runtime\.js)(?:\?[^\"]*)?"/g)].map(m=>m[1]));
 const units=files.map(file=>({file,source:moduleOverrides[file]??fs.readFileSync(path.join(fixtureRoot,file),'utf8'),overridden:Object.hasOwn(moduleOverrides,file)}));
 units.push({file:'index.html',source:main.replace(boot,inject+'\nconst phase3RestoredScroll=null;'),overridden:true});
 if(options.captureEntry)options.captureEntry(units.at(-1).source);
 vm.runInNewContext(units.map(unit=>unit.source).join('\n'),sandbox,{timeout:20000});
 if(options.recordModules){
  const {createHash}=require('node:crypto');
  options.recordModules(units.map(({file,source,overridden})=>({file,overridden,sha256:createHash('sha256').update(source).digest('hex')})));
 }
 sandbox.audit.flush=()=>{for(let i=0;callbacks.length;i++){if(i>10000)throw Error('Callback loop');callbacks.shift()();}};
 sandbox.audit.buildcraft=sandbox.WandererV012Buildcraft;
 sandbox.audit.catalog=sandbox.WandererV012Buildcraft.CATALOG;
 return sandbox.audit;
};
