// Offline harness: production gear, stats, encounters, rewards and fixed-step combat.
const fs=require('node:fs'),vm=require('node:vm');
function harness(file='index.html',options={}){
 const match=fs.readFileSync(file,'utf8').match(/<script>([\s\S]*?)<\/script>/);
 const boot='load();if(!state.merchant)rollShop();save();render();';
 if(!match||match[1].split(boot).length!==2)throw Error('Simulation bootstrap changed; review the production harness before running.');
 const source=options.transform?options.transform(match[1]):match[1];
 const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){}});
 const ctx={document:{getElementById:node,querySelectorAll:()=>[],createElement:node},localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>0,clearInterval(){},setTimeout:()=>0,clearTimeout(){},console,alert(){}};
 if(options.transform&&typeof source!=='string')throw Error('Invalid simulation transform');
 if(options.legendary){const legendary=fs.readFileSync(options.legendary===true?'combat/legendary.js':options.legendary,'utf8');vm.runInNewContext(legendary,ctx);}
 const injected=`
 fresh();animateStrike=animateDefense=animateEnemyStrike=updateBars=render=renderCombat=renderStash=save=showPendingRuneReward=showDeathPopup=bannerMessage=addLog=()=>{};
 const productionDie=die;let campaignMode=false,campaignDeath=null;
 die=()=>{if(campaignMode){const run=state.run;campaignDeath={tier:run.tier,wave:run.enc,unprotected:Object.values(state.equip).filter(item=>item&&!new Set(run.protectedItemIds).has(item.id)).length};productionDie();}else state.run.status='dead'};
 let healing=0,barrierGained=0,blockedDamage=0,legendaryProcs={};
 const productionHeal=setHeal,productionBarrier=setBarrier;
 setHeal=(...args)=>{const n=productionHeal(...args);healing+=n;return n;};
 setBarrier=(...args)=>{const n=productionBarrier(...args);barrierGained+=n;return n;};
 addLog=(line)=>{let hit=String(line).match(/(?:Shield prevents|Barrier absorbs) (\\d+) damage/);if(hit)blockedDamage+=Number(hit[1]);if(String(line).startsWith('✦ ')){const name=String(line).slice(2);if(Object.values(globalThis.WandererLegendary?.DEFINITIONS||{}).some(d=>d.name===name))legendaryProcs[name]=(legendaryProcs[name]||0)+1;}};
 let damageIn=0,damageOut=0,dotDamage=0;const productionDots=tickDots;tickDots=e=>{const n=productionDots(e);damageOut+=n;dotDamage+=n;return n;};
 floatText=(n,target)=>{if(typeof n==='number'&&n>0){if(target==='hero')damageIn+=n;else if(target==='enemy')damageOut+=n;}};
 let seed=1;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 globalThis.trial=({level,weapon,affinity,rarity='Rare',scale=1,seed:inputSeed=1,elite='tank',theme='temple',speed=1,gearPlan=null,equipment=null,runes=null,runeSlots=null,diagnostics=false})=>{
 fresh();campaignMode=false;seed=inputSeed;damageIn=damageOut=dotDamage=healing=barrierGained=blockedDamage=0;legendaryProcs={};clockSpeed=speed;
 const tier=Math.max(1,Math.round(level*scale));
 if(equipment){
  if(gearPlan)throw Error('Cannot combine acquired equipment and generated plan');
  state.equip={...makeSlots(),...JSON.parse(JSON.stringify(equipment))};
  if(isTwoHanded(state.equip.weapon)&&state.equip.offhand)throw Error('Acquired two-handed offhand conflict');
  if(runes){state.runes=JSON.parse(JSON.stringify(runes));state.runeSlots=JSON.parse(JSON.stringify(runeSlots||[null,null,null]));}
 }else if(gearPlan){
 const used=new Set();
 for(const spec of gearPlan){
  if(!SLOTS.includes(spec.slot)||used.has(spec.slot)||!elementPool(spec.slot,spec.subtype).includes(spec.effect))throw Error('Invalid gear plan');
  used.add(spec.slot);let item;
  for(let attempts=0;attempts<1000;attempts++){item=makeItem(spec.tier,spec.slot,spec.effect,'loot',spec.subtype,spec.rarity);if(item.effect===spec.effect)break;}
  if(item.effect!==spec.effect||item.subtype!==spec.subtype)throw Error('Gear plan not generated');state.equip[spec.slot]=item;
 }
 if(isTwoHanded(state.equip.weapon)&&state.equip.offhand)throw Error('Two-handed offhand conflict');
 }
 // Legacy synthetic mode is retained for reproducibility, not legal-build validation.
 else for(const slot of SLOTS){if(slot==='offhand'&&['Staff','Bow','Two-Handed'].includes(weapon))continue;
 const subtype=slot==='weapon'?weapon:slot==='offhand'?(weapon==='Wand'?'Orb':weapon==='Daggers'?'Off-Hand Dagger':'Shield'):'random';
 const item=makeItem(tier,slot,null,'loot',subtype,rarity);item.effect=affinity;item.magic=['Staff','Wand','Orb'].includes(subtype)?affinity:null;state.equip[slot]=item;}
 const path=THEMES.find(t=>t.id===theme);if(!path)throw Error('Unknown simulation theme');
 state.chosen=state.maxDungeon=level;selectedPath=state.selectedPath=path.id;startDungeon();
 const r=state.run;r.eliteType=elite;if(gearPlan||equipment)seed=(inputSeed^0x9e3779b9)>>>0;let ticks=0;const encounters=[];
 const productionAttack=weaponAttack;let attacks=0,casts=0,fallbacks=0;
 weaponAttack=run=>{attacks++;if(run.stats.caster){if(run.mp>=(run.stats.main.subtype==='Staff'?13:9))casts++;else fallbacks++;}return productionAttack(run);};
 while(ticks<18000&&['ready','fight'].includes(r.status)){if(r.status==='ready'){nextEncounter();encounters.push({wave:r.enc,hp:r.enemy.hp,atk:r.enemy.atk,def:r.enemy.def,interval:r.enemy.attackEvery});}updateFight();ticks++;}
 weaponAttack=productionAttack;
 return {...(diagnostics?{equipment:state.equip,counts:r.stats.counts,stats:{attack:r.stats.attack,spell:r.stats.spellPower,aps:r.stats.attacksPerSec,crit:r.stats.crit,maxhp:r.maxhp,defense:r.stats.defense,mana:r.maxmp,manaRegen:r.stats.manaRegen},attacks,casts,fallbacks,encounters,protoMetrics:r.protoMetrics||{},legendaryProcs}:{}),win:r.status==='win',alive:r.hp>0,timeout:ticks>=18000,deathWave:r.status==='dead'?r.enc:null,hp:Math.max(0,r.hp)/r.maxhp*100,seconds:ticks*.11,damageIn,damageOut,dotDamage,healing,barrierGained,blockedDamage,gold:r.status==='win'?r.gold:0,fragments:r.status==='win'?r.fragments:0,loot:r.status==='win'?r.loot.length:0,power:r.stats.power};
 };
 // Reward-only sampling runs the real victory handler; it does not simulate combat or extraction.
 globalThis.sampleRewards=({level,wave,theme,cha,seed:inputSeed})=>{
  fresh();seed=inputSeed>>>0;const path=THEMES.find(t=>t.id===theme)?.id;
  if(!path||wave<1||wave>wavesForDungeon(level))throw Error('Invalid reward sample');
  const r=state.run={tier:level,path,enc:wave,stats:{cha},enemy:{name:'Reward sample',boss:wave===5,miniboss:wave===4},gold:0,fragments:0,loot:[],valuables:[]};
  winEncounter();return {loot:r.loot,gold:r.gold,fragments:r.fragments};
 };
 // Persistent town/run adapter: uses production transitions and item formulas.
 // UI-only Forge and Merchant callbacks are mirrored here with their exact guards/costs.
 globalThis.campaign={
  reset(inputSeed){fresh();campaignMode=true;campaignDeath=null;seed=inputSeed>>>0;damageIn=damageOut=healing=barrierGained=blockedDamage=0;return state;},
  state(){return state;},
  offerIds(level){state.chosen=level;return [...getPaths().ids];},
  equip(id,target){equipItem(id,target);return Object.values(state.equip).some(x=>x?.id===id);},
  protect(slots){state.protectedItemIds=slots.map(slot=>state.equip[slot]?.id).filter(Boolean).slice(0,2);return chosenProtectionIds();},
  sellTreasure(){const gold=state.valuables.reduce((n,x)=>n+(Number(x.worth)||0),0);state.gold+=gold;state.valuables=[];return gold;},
  salvage(id){const i=state.stash.findIndex(x=>x.id===id&&!x.locked);if(i<0)return 0;const item=state.stash.splice(i,1)[0],value=saleFragments(item);state.fragments+=value;return value;},
  shop(){if(!state.merchant)rollShop();return state.merchant.stock;},
  refresh(){const cost=state.merchant?.refreshCost;if(!cost||state.gold<cost)return false;state.gold-=cost;rollShop();return true;},
  buy(id){const m=state.merchant,i=m?.stock?.findIndex(x=>x.id===id);if(i<0||!stashHasRoom())return false;const item=m.stock[i];if(state.gold<item.goldPrice)return false;state.gold-=item.goldPrice;item.isNew=true;state.stash.push(item);const replacement=makeItem(Math.max(1,state.maxDungeon-1),rollEquipmentSlot(),null,'merchant');replacement.goldPrice=merchantCost(replacement);m.stock[i]=replacement;return true;},
  craft(tier,slot,subtype='random'){const cost=craftCost(tier);if(tier<1||tier>state.maxDungeon||state.fragments<cost||!stashHasRoom())return null;state.fragments-=cost;const item=makeItem(tier,slot,null,'forge',subtype);item.isNew=true;state.stash.push(item);return item;},
  start(level,theme){if(state.run||level<1||level>state.maxDungeon)return false;campaignDeath=null;damageIn=damageOut=healing=barrierGained=blockedDamage=0;state.chosen=level;selectedPath=state.selectedPath=theme;startDungeon();return !!state.run;},
  boundary(maxTicks=18000){let ticks=0;while(state.run?.status==='fight'||state.run?.status==='ready'&&state.run.enc===0){if(state.run.status==='ready')nextEncounter();updateFight();ticks++;if(ticks>=maxTicks)throw Error('Campaign combat timeout');if(state.run?.status!=='fight')break;}return {status:state.run?.status||'dead',ticks,death:campaignDeath};},
  continue(){if(state.run?.status!=='ready')return false;nextEncounter();return state.run?.status==='fight';},
  extract(){if(!state.run||state.run.status==='fight')return false;extract();return true;},
  runeOptions(){return state.pendingRuneReward?.options||[];},
  claimRune(id){return claimPendingRuneChoice(id);},
  metrics(){return {damageIn,damageOut,healing,barrierGained,blockedDamage,death:campaignDeath};},
  stats(equipment=state.equip){return totalStats(equipment);}
 };
 globalThis.inspect={weaponAttack,applyAffinity,totalStats,makeItem,makeSlots,elementPool,SLOTS,isTwoHanded,setCounts,setBonuses,setOnAttack,comparisonEquip,THEMES,waveLootOdds,rarityOdds,dungeonEquipmentOdds,estimateEnemy,wavesForDungeon,legendaryMatches,LEGENDARY_CATALOG,craftCost,saleFragments,getState:()=>state};
 `;
 vm.runInNewContext(source.replace('load();if(!state.merchant)rollShop();save();render();',injected),ctx);return ctx;
}
const builds=[['offense','Daggers','crit'],['defense','Mace','shield'],['sustain','Wand','drain'],['balanced','Sword','poison'],['heavy','Two-Handed','bleed'],['caster','Staff','burn'],['ranged','Bow','crit']];
function run(file){const ctx=harness(file),rows=[];
 for(const level of [10,50,100,200])for(const [build,weapon,affinity]of builds)for(const [rarity,scale]of [['Rare',.8],['Rare',1],['Epic',1],['Legendary',1]]){
 const sum={win:0,alive:0,timeout:0,hp:0,seconds:0,damageIn:0,damageOut:0,gold:0,fragments:0,loot:0,power:0},elites={};
 for(let i=0;i<100;i++){const elite=['tank','berserker','vampire','caster'][i%4],r=ctx.trial({level,weapon,affinity,rarity,scale,elite,seed:1001+i});for(const k in sum)sum[k]+=Number(r[k]);elites[elite]=(elites[elite]||0)+Number(r.win);}
 for(const k in sum)sum[k]=+(sum[k]/100).toFixed(2);for(const k in elites)elites[k]/=25;
 rows.push({level,build,weapon,rarity,scale,...sum,elites});}
 return rows;}
function boundaries(file){
 const ctx=harness(file),rows=[];
 for(const level of [9,49,99,199])for(const [weapon,affinity]of [['Daggers','crit'],['Two-Handed','bleed'],['Staff','burn']]){
  const sum={win:0,seconds:0,gold:0,fragments:0};
  for(let i=0;i<100;i++){const r=ctx.trial({level,weapon,affinity,rarity:'Epic',seed:1001+i,elite:['tank','berserker','vampire','caster'][i%4]});for(const k in sum)sum[k]+=Number(r[k]);}
  for(const k in sum)sum[k]=+(sum[k]/100).toFixed(2);rows.push({level,weapon,...sum});
 }return rows;
}
if(require.main===module&&process.argv[2]==='--boundaries'){console.log(JSON.stringify(boundaries(process.argv[3]||'index.html'),null,2));process.exit(0);}
if(require.main===module)console.log(JSON.stringify(run(process.argv[2]||'index.html'),null,2));
module.exports={harness,run};
