// Representative full 15-Plane runs using original combat, loot and vendor primitives.
const fs=require('node:fs'),create=require('../tests/v012-economy-harness.cjs');
const output=process.argv[2]||'/tmp/v012-economy.json';
const source=process.argv[3]?fs.readFileSync(process.argv[3],'utf8'):undefined;
const priorities={
 sustain:{families:['vitality','aegis','blood'],picks:['renewal','second_breath','blood_drinker','strong_heart','fortified','sanctuary','hemovore'],route:'safe'},
 offense:{families:['fury','blood','decay'],picks:['quick_hands','bleeding_edge','toxic_touch','deep_cuts','executioner','double_strike','precision'],route:'waves'},
 elemental:{families:['magic','decay','aegis'],picks:['arcane_focus','toxic_touch','mana_spring','efficient_cast','barrier_pulse','wasting_curse'],route:'safe'}
};
function equipBest(a,weapon){
 const s=a.state();
 for(const item of [...s.stash]){
  if(item.slot==='weapon'&&item.subtype!==weapon)continue;
  if(item.slot==='offhand'&&['Bow','Staff','Two-Handed'].includes(weapon))continue;
  if(a.baseStats({...s.equip,[item.slot]:item}).power>a.baseStats().power*1.01)a.equip(item.id);
 }
}
function play(a,{level,strategy,seed,weapon,adaptive=false}){
 const s=a.state(),g=a.controller().state,p=priorities[strategy];
 const existing=new Set([...s.stash,...Object.values(s.equip).filter(Boolean)].map(i=>i.id));
 const goldBefore=s.gold,fragmentsBefore=s.fragments;
 const startPower=a.baseStats().power;
 let ticks=0,waves=0,elites=0,bosses=0,bossReached=false,lastHp=0,minHp=1,initialPicks=[],timeouts=0;
 a.start(level);
 for(let step=0;step<150000;step++){
  if(['finished','failed'].includes(g.stage)&&!s.run)break;
  if(a.draft()){
   const d=a.draft();
   if(d.step==='element')a.element(['fire','frost','lightning'][seed%3]);
   else{const sorted=[...d.options].sort((x,y)=>{const ix=p.picks.indexOf(x.id),iy=p.picks.indexOf(y.id);return (ix<0?99:ix)-(iy<0?99:iy);});initialPicks.push(sorted[0].id);a.passive(sorted[0].id);}
  }else if(g.stage==='choice'&&!s.run){
   if(adaptive)equipBest(a,weapon);
   if(p.route==='safe'){a.potion('health');a.potion('mana');}
   const offers=[...g.offers].sort((x,y)=>{
    const ix=p.families.indexOf(x.family),iy=p.families.indexOf(y.family);
    const family=(ix<0?9:ix)-(iy<0?9:iy);
    return family||(p.route==='waves'?y.waves-x.waves:Number(x.elite)-Number(y.elite)||x.waves-y.waves);
   });
   a.select(offers[0].id);
  }else if(s.run?.status==='fight'){
   const r=s.run,enemy=r.enemy;bossReached=bossReached||!!enemy.boss;let n=0;
   while(s.run===r&&r.status==='fight'&&r.enemy===enemy&&n<4000){a.tick();ticks++;n++;}
   if(n===4000){timeouts++;break;}
   if(enemy.hp<=0){waves++;elites+=Number(!!enemy.miniboss);bosses+=Number(!!enemy.boss);}
   lastHp=r.hp;minHp=Math.min(minHp,Math.max(0,r.hp/r.maxhp));a.flush();
  }else a.flush();
 }
 const gold=s.gold-goldBefore,fragments=s.fragments-fragmentsBefore;
 const loot=[...s.stash,...Object.values(s.equip).filter(Boolean),...(s.expeditionOverflow||[])].filter(i=>!existing.has(i.id)&&i.source==='loot');
 const salvage=loot.reduce((n,i)=>n+a.sale(i),0),cost=a.craftCost(Math.min(200,level));
 if(!s.merchant)a.rollShop();
 const prices=s.merchant.stock.map(i=>i.goldPrice);
 return {level,weapon,strategy,seed,adaptive,won:g.stage==='finished',planes:g.history.length,waves,elites,bosses,bossReached,timeouts,
  seconds:+(ticks*.11).toFixed(2),gold,fragments,loot:loot.length,legendary:loot.filter(i=>i.rarity==='Legendary').length,
  salvage,standardCrafts:+((fragments+salvage)/cost).toFixed(2),craftCost:cost,
  merchantTier:s.merchant.stock[0].tier,merchantMeanPrice:+(prices.reduce((a,b)=>a+b,0)/prices.length).toFixed(1),
  finalPower:a.baseStats().power,startPower,minHp:+minHp.toFixed(3),lastHp:+lastHp.toFixed(1),runes:s.runes.length,pendingRunes:s.pendingRuneReward?.options.length||0,
  selectedPassives:initialPicks};
}
function run(options){
 const a=create(options.seed,source),gearTier=Math.max(1,Math.min(200,Math.round(options.level*options.ratio)));
 a.setup(gearTier,options.weapon);a.controller().state.unlocked=options.level;
 if(options.permanentBuild){
  const s=a.state(),item=a.makeItem(gearTier,'weapon',null,'loot',options.weapon,'Legendary');
  for(let rank=0;rank<10;rank++)a.economy.upgradeLegendary(item);
  s.equip.weapon=item;
  s.runes=['fury','warding','vitality'].map(f=>a.makeRune(f,Math.max(10,Math.floor(gearTier/10)*10)));
  s.runeSlots=s.runes.map(r=>r.id);
 }
 return {...play(a,options),ratio:options.ratio,gearTier,permanentBuild:!!options.permanentBuild};
}
function campaign(policy,seed){
 const a=create(seed,source),s=a.state(),g=a.controller().state;
 let crafts=0,purchases=0,spentGold=0,spentFragments=0,salvaged=0,earnedGold=0,earnedFragments=0,loot=0,wins=0;
 const attempts=[];
 for(let attempt=0;attempt<24;attempt++){
  if(s.pendingRuneReward)a.claimRune(s.pendingRuneReward.options[0].id);
  equipBest(a,'Sword');
  const spare=s.stash.filter(i=>!i.locked&&i.rarity!=='Legendary').map(i=>i.id),before=s.fragments;
  a.salvage(spare);salvaged+=s.fragments-before;a.claimOverflow();
  // Spend only earned resources, using native Forge / Merchant transaction handlers.
  if(['forge','both'].includes(policy)){
   for(let count=0;count<4&&s.fragments>=a.craftCost(g.unlocked)&&s.stash.length<40;count++){
    const slot=[...a.slots].filter(x=>x!=='offhand').sort((x,y)=>{
     const px=a.baseStats({...s.equip,[x]:null}).power,py=a.baseStats({...s.equip,[y]:null}).power;
     return py-px;
    })[0];
    const before=s.fragments;
    a.craft(g.unlocked,0,slot,slot==='weapon'?'Sword':'random');
    spentFragments+=before-s.fragments;crafts+=Number(s.fragments<before);equipBest(a,'Sword');
   }
  }
  if(['merchant','both'].includes(policy)){
   if(!s.merchant)a.rollShop();
   for(let count=0;count<4;count++){
    const index=s.merchant.stock.findIndex(i=>s.gold>=i.goldPrice&&(i.slot!=='weapon'||i.subtype==='Sword')&&a.baseStats({...s.equip,[i.slot]:i}).power>a.baseStats().power*1.01);
    if(index<0)break;
    const before=s.gold;a.buy(index);spentGold+=before-s.gold;purchases+=Number(s.gold<before);equipBest(a,'Sword');
   }
   // One paid refresh per attempt; no free reopening/entry stock resets.
   if(s.gold>=s.merchant.refreshCost){const before=s.gold;a.refresh('gear');spentGold+=before-s.gold;}
  }
  const result=play(a,{level:g.unlocked,strategy:seed%2?'sustain':'elemental',seed,weapon:'Sword',adaptive:true});
  earnedGold+=result.gold;earnedFragments+=result.fragments;loot+=result.loot;wins+=Number(result.won);
  attempts.push({attempt:attempt+1,level:result.level,won:result.won,waves:result.waves,power:result.finalPower});
  if(result.timeouts)throw Error('Campaign combat timeout');
 }
 return {policy,seed,unlocked:g.unlocked,wins,crafts,purchases,spentGold,spentFragments,salvaged,earnedGold,earnedFragments,loot,gold:s.gold,fragments:s.fragments,power:a.baseStats().power,runes:s.runes.length,attempts};
}
const cases=[];
for(const level of [1,20,80,200])for(const ratio of [.25,.75,1,1.5])for(const strategy of Object.keys(priorities))for(let seed=1;seed<=6;seed++){
 const weapon=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'][(seed-1+level)%7];
 cases.push(run({level,ratio,strategy,seed,weapon}));
}
for(const level of [20,80])for(const strategy of Object.keys(priorities))for(let seed=1;seed<=3;seed++)cases.push(run({level,ratio:.75,strategy,seed,weapon:'Sword',adaptive:true}));
for(const level of [20,80,200])for(const weapon of ['Sword','Staff'])for(let seed=1;seed<=3;seed++)cases.push(run({level,ratio:1,strategy:'sustain',seed,weapon,permanentBuild:true}));
const groups=[];
for(const level of [1,20,80,200])for(const ratio of [.25,.75,1,1.5]){
 const rows=cases.filter(x=>x.level===level&&x.ratio===ratio&&!x.adaptive&&!x.permanentBuild);
 const avg=k=>+(rows.reduce((n,r)=>n+r[k],0)/rows.length).toFixed(2);
 groups.push({level,ratio,n:rows.length,wins:rows.filter(r=>r.won).length,waves:avg('waves'),gold:avg('gold'),fragments:avg('fragments'),loot:avg('loot'),craftsWithSalvage:avg('standardCrafts'),merchantTier:avg('merchantTier')});
}
const campaigns=[];
for(const policy of ['loot','forge','merchant','both'])for(let seed=1;seed<=3;seed++)campaigns.push(campaign(policy,seed));
const crypto=require('node:crypto');
const sourceHash=crypto.createHash('sha256').update(source||fs.readFileSync('index.html','utf8')).digest('hex');
const result={sourceHtmlSha256:sourceHash,node:process.version,engine:'integrated index.html updateFight + phase1WaveWon + native Forge/Merchant handlers; no prototype tick',seedCount:6,cases:cases.length,timeouts:cases.reduce((n,r)=>n+r.timeouts,0),groups,runs:cases,campaigns};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({cases:result.cases,timeouts:result.timeouts,groups,campaigns:campaigns.map(({attempts,...r})=>r)},null,2));
