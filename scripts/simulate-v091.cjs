// Offline harness: production gear, stats, encounters, rewards and fixed-step combat.
const fs=require('node:fs'),vm=require('node:vm');
function harness(file='index.html'){
 const source=fs.readFileSync(file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){}});
 const ctx={document:{getElementById:node,querySelectorAll:()=>[],createElement:node},localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>0,clearInterval(){},setTimeout:()=>0,clearTimeout(){},console,alert(){}};
 const injected=`
 fresh();animateStrike=animateDefense=animateEnemyStrike=updateBars=render=renderCombat=save=showPendingRuneReward=addLog=()=>{};
 die=()=>{state.run.status='dead'};
 let damageIn=0,damageOut=0;const productionDots=tickDots;tickDots=e=>{const n=productionDots(e);damageOut+=n;return n;};
 floatText=(n,target)=>{if(typeof n==='number'&&n>0){if(target==='hero')damageIn+=n;else if(target==='enemy')damageOut+=n;}};
 let seed=1;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 globalThis.trial=({level,weapon,affinity,rarity='Rare',scale=1,seed:inputSeed=1,elite='tank',speed=1,gearPlan=null,diagnostics=false})=>{
 fresh();seed=inputSeed;damageIn=damageOut=0;clockSpeed=speed;
 const tier=Math.max(1,Math.round(level*scale));
 if(gearPlan){
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
 state.chosen=state.maxDungeon=level;selectedPath=state.selectedPath=THEMES[0].id;startDungeon();
 const r=state.run;r.eliteType=elite;if(gearPlan)seed=(inputSeed^0x9e3779b9)>>>0;let ticks=0;const encounters=[];
 const productionAttack=weaponAttack;let attacks=0,casts=0,fallbacks=0;
 weaponAttack=run=>{attacks++;if(run.stats.caster){if(run.mp>=(run.stats.main.subtype==='Staff'?13:9))casts++;else fallbacks++;}return productionAttack(run);};
 while(ticks<18000&&['ready','fight'].includes(r.status)){if(r.status==='ready'){nextEncounter();encounters.push({wave:r.enc,hp:r.enemy.hp,atk:r.enemy.atk,def:r.enemy.def,interval:r.enemy.attackEvery});}updateFight();ticks++;}
 weaponAttack=productionAttack;
 return {...(diagnostics?{equipment:state.equip,counts:r.stats.counts,stats:{attack:r.stats.attack,spell:r.stats.spellPower,aps:r.stats.attacksPerSec,crit:r.stats.crit,maxhp:r.maxhp,defense:r.stats.defense,mana:r.maxmp,manaRegen:r.stats.manaRegen},attacks,casts,fallbacks,encounters}:{}),win:r.status==='win',alive:r.hp>0,timeout:ticks>=18000,hp:Math.max(0,r.hp)/r.maxhp*100,seconds:ticks*.11,damageIn,damageOut,gold:r.status==='win'?r.gold:0,fragments:r.status==='win'?r.fragments:0,loot:r.status==='win'?r.loot.length:0,power:r.stats.power};
 };
 globalThis.inspect={weaponAttack,applyAffinity,totalStats,makeItem,makeSlots,elementPool,SLOTS,isTwoHanded,setCounts,getState:()=>state};
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
