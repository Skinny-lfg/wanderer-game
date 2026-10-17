// Persistent offline progression over the production combat and town rules.
// Policy choices are explicit assumptions; no browser save or Firebase is opened.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {harness}=require('./simulate-v091.cjs');
const {variants}=require('./v010-balance-ab.cjs');
variants.finalCandidate=[...variants.bowBarrier8,...variants.heavyFactor185,...variants.frost40];
variants.finalBow8=[...variants.bowBarrier8];
variants.finalFrost40=[...variants.frost40];
const TARGETS=[20,40,60,100,160,200];
const STYLES=['Mace','Sword','Bow','Two-Handed','Staff','Wand','Daggers'];
const RULES={
 casual:{shopEvery:8,extractAt:.50,protect:false,preferTheme:false,shopReserve:0,craftLimit:1,farmWins:6},
 experienced:{shopEvery:3,extractAt:.45,protect:true,preferTheme:true,shopReserve:.4,craftLimit:2,farmWins:8},
 speed:{shopEvery:2,extractAt:.38,protect:true,preferTheme:true,shopReserve:.3,craftLimit:2,farmWins:5}
};
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;};
function harnessFor(name){
 if(name==='newAbilities')return harness('index.html',{legendary:true,transform:require('./v010-abilities-sim.cjs').compose(['shatter30','ignition4','doubleB'])});
 if(name==='newAbilitiesConservative')return harness('index.html',{legendary:true,transform:require('./v010-abilities-sim.cjs').compose(['shatter30','ignition4','doubleA'])});
 if(name==='newAbilitiesNarrow')return harness('index.html',{legendary:true,transform:require('./v010-abilities-sim.cjs').compose(['shatter30','doubleB'])});
 const transforms=variants[name]||[];
 return harness('index.html',{legendary:true,transform:transforms.length?s=>transforms.reduce((v,f)=>f(v),s):undefined});
}
function equipView(state,item,target){
 const eq={...state.equip,[target]:item};
 if(['Bow','Staff','Two-Handed'].includes(item.subtype)&&target==='weapon')eq.offhand=null;
 if(target==='offhand'&&['Bow','Staff','Two-Handed'].includes(eq.weapon?.subtype))return null;
 return eq;
}
function score(c,equipment,policy,style){
 const s=c.campaign.stats(equipment),weapon=equipment.weapon;
 let n=s.power;
 if(policy==='experienced')n+=s.maxhp*.16+s.defense*2+s.blockChance*2.5+(s.counts.drain>=2?Math.min(140,s.attack*.3):0);
 if(policy==='speed')n+=s.attack*1.5+s.spellPower*1.4+s.attacksPerSec*45+s.maxhp*.08+s.defense;
 if(policy==='casual')n+=s.maxhp*.06+s.defense*.5;
 if(weapon?.subtype===style)n+=Math.min(220,Math.max(30,n*.055));
 return n;
}
function bestSwap(c,policy,style){
 const s=c.campaign.state();let best=null,base=score(c,s.equip,policy,style);
 for(const item of s.stash){
  for(const target of ['ring1','ring2'].includes(item.slot)?['ring1','ring2']:[item.slot]){
   const eq=equipView(s,item,target);if(!eq)continue;
   const next=score(c,eq,policy,style),gain=next-base;
   if(gain>Math.max(2,base*.003)&&(!best||gain>best.gain))best={id:item.id,target,gain};
  }
 }
 return best;
}
function equipUpgrades(c,policy,style){
 let changed=0;
 for(let step=0;step<15;step++){
  const swap=bestSwap(c,policy,style);if(!swap||!c.campaign.equip(swap.id,swap.target))break;
  changed++;
 }
 return changed;
}
function recycle(c,ledger){
 const s=c.campaign.state(),bySlot=new Map();
 for(const item of s.stash){const key=['ring1','ring2'].includes(item.slot)?'ring':item.slot,items=bySlot.get(key)||[];items.push(item);bySlot.set(key,items);}
 for(const items of bySlot.values()){
  items.sort((a,b)=>b.tier-a.tier||({Legendary:5,Epic:4,Rare:3,Uncommon:2,Common:1}[b.rarity]-{Legendary:5,Epic:4,Rare:3,Uncommon:2,Common:1}[a.rarity]));
  for(const item of items.slice(2))ledger.salvage+=c.campaign.salvage(item.id);
 }
 if(s.stash.length>20){const extra=[...s.stash].sort((a,b)=>a.tier-b.tier).slice(0,s.stash.length-20);for(const item of extra)ledger.salvage+=c.campaign.salvage(item.id);}
}
function weakSlot(c,style){
 const s=c.campaign.state(),slots=['weapon','armor','offhand','helm','gloves','boots','amulet','ring1','ring2'].filter(slot=>slot!=='offhand'||!['Bow','Staff','Two-Handed'].includes(s.equip.weapon?.subtype));
 slots.sort((a,b)=>(s.equip[a]?.tier||0)-(s.equip[b]?.tier||0));
 const slot=slots[0];return {slot,subtype:slot==='weapon'?style:slot==='offhand'?'Shield':'random'};
}
function town(c,policy,style,attempt,ledger){
 const p=c.campaign,s=p.state();ledger.treasureSold+=p.sellTreasure();
 equipUpgrades(c,policy,style);recycle(c,ledger);
 const rule=RULES[policy];
 if(attempt%rule.shopEvery!==0&&attempt!==1)return;
 for(let count=0;count<rule.craftLimit;count++){
  const tier=Math.max(1,s.maxDungeon-1),cost=c.inspect.craftCost(tier);
  if(s.fragments<cost*(1+rule.shopReserve))break;
  const {slot,subtype}=weakSlot(c,style),item=p.craft(tier,slot,subtype);
  if(!item)break;ledger.fragmentsSpent+=cost;ledger.crafts++;equipUpgrades(c,policy,style);recycle(c,ledger);
 }
 p.shop();
 let best=null,base=score(c,s.equip,policy,style);
 for(const item of s.merchant.stock){if(item.goldPrice>s.gold*(1-rule.shopReserve))continue;
  const targets=['ring1','ring2'].includes(item.slot)?['ring1','ring2']:[item.slot];
  for(const target of targets){const eq=equipView(s,item,target);if(!eq)continue;const gain=score(c,eq,policy,style)-base;
   if(gain>Math.max(4,base*.01)&&(!best||gain>best.gain))best={item,gain};}
 }
 if(best&&p.buy(best.item.id)){ledger.goldSpent+=best.item.goldPrice;ledger.purchases++;equipUpgrades(c,policy,style);}
}
function snapshot(s){return JSON.parse(JSON.stringify({maxDungeon:s.maxDungeon,equip:s.equip,runes:s.runes,runeSlots:s.runeSlots,gold:s.gold,fragments:s.fragments}));}
function chooseTheme(c,ids,policy,style){
 if(!RULES[policy].preferTheme)return ids[0];
 const effects={Bow:'crit','Two-Handed':'bleed',Staff:'slow',Wand:'drain',Mace:'shield',Sword:'poison',Daggers:'crit'};
 return ids.find(id=>c.inspect.THEMES.find(t=>t.id===id)?.effect===effects[style])||ids[0];
}
function chooseRune(options){return options.find(r=>r.family==='vitality')||options.find(r=>r.family==='warding')||options[0];}
function runPlayer({policy,seed,variant='baseline',attempts=600,style=STYLES[seed%STYLES.length],snapshots=true}){
 const c=harnessFor(variant),p=c.campaign,s=p.reset(hash(seed)),ledger={goldSpent:0,fragmentsSpent:0,salvage:0,treasureSold:0,crafts:0,purchases:0};
 const row={policy,seed,variant,style,attempts:0,clears:0,deaths:0,earlyExtracts:0,farmRuns:0,combatSeconds:0,lostEquipment:0,checkpoints:{},snapshots:{},ledger};
 let recoverWins=0,recoveryLevel=1;
 for(let attempt=1;attempt<=attempts&&!s.attemptCompleted;attempt++){
  town(c,policy,style,attempt,ledger);
  const frontier=s.maxDungeon,level=recoverWins>0?Math.min(frontier,recoveryLevel):frontier;
  if(level<frontier)row.farmRuns++;
  if(RULES[policy].protect)p.protect(['weapon','armor']);else p.protect([]);
  const ids=p.offerIds(level),theme=chooseTheme(c,ids,policy,style);
  assert(ids.includes(theme));assert(p.start(level,theme));
  let outcome='unknown',waves=0;
  while(s.run){
   if(s.run.status==='ready'&&s.run.enc>0)assert(p.continue());
   const step=p.boundary();row.combatSeconds+=step.ticks*.11;waves++;
   if(step.status==='dead'){row.deaths++;row.lostEquipment+=step.death?.unprotected||0;outcome='dead';break;}
   if(step.status==='win'){
    const options=p.runeOptions();if(options.length){const rune=chooseRune(options);assert(p.claimRune(rune.id));}else assert(p.extract());
    row.clears++;outcome='clear';break;
   }
   const threshold=RULES[policy].extractAt;
   if(s.run.hp/s.run.maxhp<threshold){assert(p.extract());row.earlyExtracts++;outcome='extract';break;}
  }
  assert(outcome!=='unknown');row.attempts++;
  if(outcome==='dead'){recoveryLevel=Math.max(1,Math.floor(frontier/2));recoverWins=RULES[policy].farmWins;}
  else if(outcome==='clear'&&recoverWins>0)recoverWins--;
  if(outcome==='extract'&&recoverWins===0&&frontier>1){recoveryLevel=Math.max(1,frontier-1);recoverWins=2;}
  if(attempt%50===0)row.checkpoints[attempt]={maxDungeon:s.maxDungeon,clears:row.clears,deaths:row.deaths,gold:s.gold,fragments:s.fragments,power:p.stats().power};
  if(snapshots&&TARGETS.includes(s.maxDungeon))row.snapshots[s.maxDungeon]=snapshot(s);
  if(s.gold<0||s.fragments<0)throw Error('Negative currency');
 }
 row.deepestCleared=Math.max(0,s.maxDungeon-1,Number(s.onlineProgress?.deepestCleared)||0);row.completed=!!s.attemptCompleted;row.gold=s.gold;row.fragments=s.fragments;row.power=p.stats().power;
 row.equipped=Object.values(s.equip).filter(Boolean).map(x=>({slot:x.slot,tier:x.tier,rarity:x.rarity,subtype:x.subtype,effect:x.effect}));
 row.runes=s.runes.length;row.stash=s.stash.length;return row;
}
function main(){const mode=process.argv[2]||'pilot';
 if(mode==='pilot'){
  const rows=[['casual',930101,'Sword'],['experienced',930102,'Mace'],['speed',930103,'Bow']].map(([policy,seed,style])=>runPlayer({policy,seed,style,attempts:150}));
  console.log(JSON.stringify(rows.map(({policy,style,attempts,deepestCleared,deaths,earlyExtracts,gold,fragments,crafts,completed})=>({policy,style,attempts,deepestCleared,deaths,earlyExtracts,gold,fragments,crafts,completed})),null,2));
  return;
 }
 if(['baseline','finalCandidate','finalBow8','finalFrost40','newAbilities','newAbilitiesConservative','newAbilitiesNarrow'].includes(mode)){
  const rows=[];for(const policy of Object.keys(RULES))for(let i=0;i<20;i++)rows.push(runPlayer({policy,seed:931000+i,style:STYLES[i%STYLES.length],variant:mode,snapshots:mode==='baseline'}));
  fs.writeFileSync('docs/v010-progression-'+mode+'.json',JSON.stringify({sourceCommit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),players:rows})+'\n');
  console.log(JSON.stringify(Object.fromEntries(Object.keys(RULES).map(p=>[p,{finish:rows.filter(x=>x.policy===p&&x.completed).length,max:Math.max(...rows.filter(x=>x.policy===p).map(x=>x.deepestCleared))}]))));
  return;
 }
 throw Error('Unknown mode');
}
if(require.main===module)main();
module.exports={runPlayer,harnessFor,score,TARGETS,RULES};
