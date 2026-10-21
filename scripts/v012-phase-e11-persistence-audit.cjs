'use strict';
// Isolated audit: retain the same synthetic player across attempts; the native runtime owns all rewards.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..'),file=path.join(root,'scripts/v012-affinity-combat-sim.cjs');
let source=fs.readFileSync(file,'utf8');
for(const [from,to] of [['a.setup(E,weapon,rarity)','void 0'],['g.unlocked=E;','void 0;'],["if(runes){s.runes=['vitality','warding',['Staff','Wand'].includes(weapon)?'wisdom':'might'].map(f=>a.makeRune(f,E));s.runeSlots=s.runes.map(r=>r.id);}",'void 0;']]){
 if(!source.includes(from))throw Error('Missing harness anchor '+from);source=source.replace(from,to);
}
const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(source,file);
const {run}=mod.exports,create=require(path.join(root,'tests/v012-economy-harness.cjs'));
const profiles=['A','B','C'],requestedRuns=Number(process.env.WANDERER_E11_RUNS||30),maxRuns=Number.isInteger(requestedRuns)&&requestedRuns>=1&&requestedRuns<=270?requestedRuns:30,rows=[],agents=[],start=performance.now();
const rank={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
function snapshot(a){const s=a.state(),eq=Object.values(s.equip).filter(Boolean),rr=s.runes.filter(r=>s.runeSlots.includes(r.id));return {meanGearTier:+(eq.reduce((v,o)=>v+o.tier,0)/eq.length).toFixed(1),rarities:Object.fromEntries(['Common','Uncommon','Rare','Epic','Legendary'].map(k=>[k,eq.filter(o=>o.rarity===k).length])),affinities:Object.fromEntries(eq.map(o=>[o.slot,o.affinity||null])),runeTiers:rr.map(r=>r.tier).sort((a,b)=>a-b),runes:JSON.parse(JSON.stringify(s.runes)),runeSlots:[...s.runeSlots],equip:JSON.parse(JSON.stringify(s.equip)),stashIds:s.stash.map(x=>x.id),bagIds:a.bag.ids(),gold:s.gold,fragments:s.fragments,unlocked:a.controller().state.unlocked,power:a.baseStats(s.equip).power};}
function setup(profile,seedIndex){const a=create(84100+seedIndex),s=a.state(),g=a.controller().state;
 a.setup(200,'Bow','Epic');let slotIndex=0;
 for(const [slot,item]of Object.entries(s.equip))if(item){const tier=196+((slotIndex*3+seedIndex)%5),rarity=slotIndex%5===0?'Rare':'Epic';const armor=['helm','armor','gloves','belt','boots'].includes(slot);const subtype=slot==='weapon'?'Bow':armor?'Leather':item.subtype;s.equip[slot]=a.makeItem(tier,slot,null,'loot',subtype,rarity);slotIndex++;}
 s.runes=['vitality','warding','might'].map((f,i)=>a.makeRune(f,[190,195,199][i]));s.runeSlots=s.runes.map(r=>r.id);s.gold=4000;s.fragments=3000;g.unlocked=200;
 const gear=Object.values(s.equip).filter(Boolean),armorSlots=['helm','armor','gloves','belt','boots'];
 if(s.equip.weapon?.subtype!=='Bow'||s.equip.offhand||armorSlots.some(slot=>s.equip[slot]?.armorType!=='Leather')||gear.some(item=>item.tier<196||item.tier>200)||s.runeSlots.length!==3||s.runes.some((r,i)=>r.tier!==[190,195,199][i]))throw Error('E.1.3 invalid starting Bow/Leather E200 build');
 return {profile,seedIndex,a,attempt:0,losses:0,farmNext:false,repeats:0,wins:0,defeats:0,initial:snapshot(a),goldEarned:0,goldSpent:0,fragmentsEarned:0,fragmentsSpent:0,crafts:0,upgrades:0,merchantBuys:0,salvages:0,runeClaims:0,lootLost:0,combatSeconds:0,stopped:false};}
for(const p of profiles)for(let i=0;i<3;i++)agents.push(setup(p,i));
function clearOverflow(a){let n=0;while(a.bag.overflow()){const items=a.bag.items(),score=x=>x.kind==='valuable'?(x.worth||0):rank[x.rarity]*100+(x.tier||0)/10;const worst=[...items].sort((x,y)=>score(x)-score(y))[0];if(!worst||!a.bag.discard(worst.id))throw Error('Bag overflow could not be resolved');if(++n>30)throw Error('Unbounded bag overflow');}return n;}
function equipUpgrades(agent){const {a,profile}=agent,s=a.state();let upgraded=0;
 for(let step=0;step<12;step++){
  const baseline=a.baseStats(s.equip).power;
  let best=null,bestGain=0;
  for(const item of s.stash){const slot=item.slot;if(slot==='offhand'&&s.equip.weapon?.subtype==='Bow')continue;
   const old=s.equip[slot];if(!old||old.subtype!==item.subtype||old.armorType!==item.armorType)continue;
   const candidate=a.baseStats({...s.equip,[slot]:item}).power,delta=(candidate-baseline)/Math.max(1,baseline);
   const threshold=profile==='B'?.003:profile==='A'?.01:.015;
   if(delta>threshold&&delta>bestGain){best=item;bestGain=delta;}
  }
  if(!best||!a.equip(best.id))break;upgraded++;agent.upgrades++;
 }
 return upgraded;
}
function claimRune(agent){const a=agent.a,s=a.state(),reward=s.pendingRuneReward;if(!reward)return;
 const priority=['might','vitality','warding'];let best=null,bestGain=-Infinity;
 for(const r of reward.options){const existing=s.runes.find(x=>s.runeSlots.includes(x.id)&&x.family===r.family);const gain=(existing?r.value-existing.value:r.value*.7)+(priority.includes(r.family)?20-priority.indexOf(r.family)*2:0);if(gain>bestGain){best=r;bestGain=gain;}}
 if(!a.claimRune(best.id))throw Error('Rune claim failed');agent.runeClaims++;
 const target=s.runeSlots.findIndex(id=>s.runes.find(r=>r.id===id)?.family===best.family);if(target>=0){const old=s.runes.find(r=>r.id===s.runeSlots[target]);if(best.value>old.value)a.runes.equip(best.id,target);}
 else{const free=s.runeSlots.indexOf(null);if(free>=0)a.runes.equip(best.id,free);}
}
function economy(agent){const a=agent.a,s=a.state(),profile=agent.profile;
 clearOverflow(a);claimRune(agent);equipUpgrades(agent);
 if(s.valuables.length){const before=s.gold;if(!a.treasures.sell())throw Error('Valuables sale failed');agent.goldEarned+=s.gold-before;}
 // Target a real Forge offer at the currently unlocked tier, never a future tier.
 const shouldCraft=profile==='B'?agent.attempt%2===0:profile==='A'?agent.attempt%4===0:agent.losses>=2&&agent.attempt%2===0;
 if(shouldCraft){const choices=profile==='B'?[['weapon','Bow'],['armor','Leather'],['gloves','Leather']]:[['weapon','Bow'],['armor','Leather']];const [slot,type]=choices[agent.attempt%choices.length];const quality=profile==='B'?1:0,cost=a.craftCost(a.controller().state.unlocked)*(1+quality);
  if(s.fragments>=cost&&s.stash.length<35){const before=s.fragments,n=s.stash.length;a.craft(a.controller().state.unlocked,quality,slot,type);if(s.stash.length>n){agent.crafts++;agent.fragmentsSpent+=before-s.fragments;equipUpgrades(agent);}}
 }
 // Sell unused gear through the real salvage action to keep Stash capacity free.
 if(s.stash.length){const ids=s.stash.filter(o=>!o.locked).map(o=>o.id),before=s.fragments;if(ids.length){a.salvage(ids);agent.salvages+=ids.length;agent.fragmentsEarned+=s.fragments-before;}}
}
for(let turn=0;turn<maxRuns;turn++){
 const agent=agents[(turn%3)*3+Math.floor(turn/3)%3],{a,profile,seedIndex}=agent,s=a.state(),g=a.controller().state;
 if(agent.stopped)continue;
 economy(agent);
 const level=profile==='C'&&agent.farmNext&&g.unlocked>200?Math.max(200,g.unlocked-1):g.unlocked;
 if(level<g.unlocked)agent.repeats++;
 const seed=(851000+seedIndex*10007+agent.attempt*137)>>>0;
 const beforeGold=s.gold,beforeFragments=s.fragments,before=snapshot(a);
 let result;try{result=run({E:level,weapon:'Bow',rarity:'Epic',family:'fury',strategy:profile==='A'?'random':'triple',routeMode:profile==='B'?'planned':undefined,runes:true,seed,controlSeed:seed,harnessFactory:()=>a});}
 catch(error){result={error:String(error?.stack||error),timeout:false,reached:0,win:false,seconds:0};}
 agent.attempt++;agent.combatSeconds+=result.seconds||0;
 const summary=a.results().summary,earnedGold=summary?.gold||0,earnedFragments=summary?.fragments||0;
 agent.goldEarned+=earnedGold;agent.fragmentsEarned+=earnedFragments;
 if(result.win){agent.wins++;agent.losses=0;agent.farmNext=false;}else{agent.defeats++;agent.losses++;agent.farmNext=profile==='C'&&agent.losses%2===0;agent.lootLost+=(summary?.lost?.length||0)+(summary?.treasuresLost?.length||0);}
 const after=snapshot(a);if(!result.win&&(JSON.stringify(before.runes)!==JSON.stringify(after.runes)||JSON.stringify(before.runeSlots)!==JSON.stringify(after.runeSlots)))throw Error('Rune changed without victory');
 const row={profile,seedIndex,attempt:agent.attempt,level,unlocked:g.unlocked,repeat:level<before.unlocked,win:result.win,reached:result.reached,seconds:result.seconds,error:result.error,timeout:result.timeout,before,after,goldEarned:earnedGold,fragmentsEarned:earnedFragments,lootKept:summary?.kept?.length||0,lootLost:summary?.lost?.length||0,treasuresKept:summary?.treasuresKept?.length||0,treasuresLost:summary?.treasuresLost?.length||0,runestone:summary?.runeTier||null,deathCause:result.deathCause,fatalFight:result.fatalFight,damage:result.damage,damageReceived:result.damageReceived,dps:result.dps,firstFight:result.firstFight,unlockedFamilies:result.unlockedFamilies,allPicks:result.allPicks,routes:result.routes,legitimateActions:{crafts:agent.crafts,upgrades:agent.upgrades,runeClaims:agent.runeClaims,salvages:agent.salvages}};rows.push(row);
 if(result.error||result.timeout){console.error('STOP '+JSON.stringify(row));break;}
 if(rows.length%5===0){process.stderr.write('Completed '+rows.length+'/'+maxRuns+'; max '+Math.max(...agents.map(x=>x.a.controller().state.unlocked))+'\n');global.gc?.();}
}
const output={base:'e2-representative-e200',maxRuns,completed:rows.length,wallSeconds:(performance.now()-start)/1000,rows,agents:agents.map(x=>({profile:x.profile,seedIndex:x.seedIndex,initial:x.initial,final:snapshot(x.a),unlocked:x.a.controller().state.unlocked,attempt:x.attempt,wins:x.wins,defeats:x.defeats,repeats:x.repeats,goldEarned:x.goldEarned,goldSpent:x.goldSpent,fragmentsEarned:x.fragmentsEarned,fragmentsSpent:x.fragmentsSpent,crafts:x.crafts,upgrades:x.upgrades,merchantBuys:x.merchantBuys,salvages:x.salvages,runeClaims:x.runeClaims,lootLost:x.lootLost,combatSeconds:x.combatSeconds}))};
fs.writeFileSync(process.argv[2]||'/tmp/wanderer-e11-results.json',JSON.stringify(output));console.log(JSON.stringify({completed:rows.length,wallSeconds:+output.wallSeconds.toFixed(1),errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timeout).length,agents:output.agents.map(a=>[a.profile,a.seedIndex,a.unlocked,a.wins,a.defeats,a.crafts,a.upgrades])}));
