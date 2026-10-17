// Execute production combat with a deterministic RNG; replace only rendering/persistence/reward callbacks.
const fs=require('node:fs'),vm=require('node:vm');
module.exports=function harness(html=fs.readFileSync('index.html','utf8')){
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1],boot='load();if(!state.merchant)rollShop();save();render();';
 const store=new Map(),node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){}});
 const ctx={document:{getElementById:()=>node(),querySelectorAll:()=>[],createElement:node},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},alert(){},confirm:()=>true,console};
 const injected=`
 fresh();animateStrike=animateDefense=animateEnemyStrike=floatText=updateBars=render=renderCombat=save=()=>{};
 let battleEvents=[];addLog=(text)=>battleEvents.push(text);
 winEncounter=()=>{state.run.status='ready'};die=()=>{state.run.status='dead'};
 let seed=1;const reseed=n=>{seed=n>>>0};Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 globalThis.simulate=({level=10,weapon='Sword',affinity='poison',hybrid=false,seed:inputSeed=1,speed=1,gearScale=.8,legendaryIds=[]}={})=>{
  fresh();reseed(inputSeed);battleEvents=[];clockSpeed=speed;selectedPath=THEMES[0].id;
  const tier=Math.max(1,Math.round(level*gearScale)),equipment=makeSlots();
  for(const slot of SLOTS){if(slot==='offhand'&&['Staff','Two-Handed','Bow'].includes(weapon))continue;const subtype=slot==='weapon'?weapon:slot==='offhand'?(weapon==='Wand'?'Orb':weapon==='Daggers'?'Off-Hand Dagger':'Shield'):'random';equipment[slot]=makeItem(tier,slot,null,'loot',subtype,'Rare');equipment[slot].effect=null;equipment[slot].magic=null;}
  const ordered=['weapon','offhand',...SLOTS.filter(x=>!['weapon','offhand'].includes(x))].filter(x=>equipment[x]);
  ordered.slice(0,5).forEach((slot,i)=>{equipment[slot].effect=hybrid&&i>=3?(affinity==='crit'?'regen':'crit'):affinity;if(['Staff','Wand','Orb'].includes(equipment[slot].subtype))equipment[slot].magic=equipment[slot].effect;});
  for(const id of legendaryIds){const entry=LEGENDARY_BY_ID[id],slot=entry.slot==='ring'?'ring1':entry.slot;let item;for(let i=0;i<200;i++){item=makeItem(tier,slot,null,'loot',entry.subtype,'Legendary');if(item.legendaryId===id)break;}if(item.legendaryId!==id)throw Error('Legendary fixture missing '+id);equipment[slot]=item;}
  state.equip=equipment;const stats=totalStats(),r=state.run={tier:level,path:selectedPath,enc:0,status:'fight',stats,hp:stats.maxhp,maxhp:stats.maxhp,mp:stats.mana,maxmp:stats.mana,barrier:0};
  const durations=[];let steps=0;
  for(let enc=1;enc<=3;enc++){r.enc=enc;r.enemy=enemyFor(level,enc);r.tPlayer=r.tEnemy=r.tDot=0;r.status='fight';if(globalThis.WandererAffinities&&typeof Affinity!=='undefined')Affinity.beginEncounter(r);let n=0;while(r.status==='fight'&&n<2728){updateFight();n++;}steps+=n;durations.push(+(n*.11).toFixed(2));if(r.status!=='ready')break;}
  return {won:r.status==='ready'&&r.enc===3,hp:+Math.max(0,r.hp).toFixed(3),seconds:+(steps*.11).toFixed(2),durations,power:stats.power,events:battleEvents,counts:stats.counts,equipment,affinityState:r.affinityState};
 };
 globalThis.combatAccess={totalStats,weaponAttack,setCounts,setPreview,makeSlots,makeItem,legendarySignature,legendaryAttackBonus,legendaryDefensiveEffects,legendaryAffinity,legendaryRuntime,legendaryOffhand,legendaryKill,legendaryTick,setHeal,applyAffinity,updateFight,playerStatusMarkup,enemyDebuffMarkup,legendaryDescription,migrateItem,legendaryHuntChance,THEMES,LEGENDARY_CATALOG,affinityProcChance,setRandom:fn=>{Math.random=fn},state,getState:()=>state,completedAttempt,startDungeon,extract,stashVisible,setFilters:({affinity='all',slot='all',sortBy='level',order='desc'}={})=>{affinityFilter=affinity;slotFilter=slot;sort=sortBy;direction=order;}};
 `;
 vm.runInNewContext(fs.readFileSync('combat/affinities.js','utf8')+'\n'+fs.readFileSync('combat/legendary.js','utf8')+'\n'+script.replace(boot,injected),ctx,{timeout:10000});return ctx;
};
