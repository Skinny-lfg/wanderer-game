// Bounded gameplay matrix using the integrated HTML engine and real economy actions.
// Synthetic RAM profiles only. No Firebase, browser/account storage or prototype formulas.
const fs=require('node:fs'),crypto=require('node:crypto'),create=require('../tests/v012-economy-harness.cjs');
const rows=[];const priorities={blood:['bleeding_edge','deep_cuts','blood_drinker','executioner'],decay:['toxic_touch','virulent_rot','wither','blight'],vitality:['renewal','strong_heart','second_breath','life_bloom'],aegis:['fortified','iron_skin','barrier_pulse','guarded_block'],fury:['quick_hands','precision','double_strike','brutal_crit'],magic:['overcharge','arcane_focus','mana_spring','efficient_cast']};
function run(E,ratio,family,seed,weapon,fortune=false,variant='current'){
 let buildcraft=fs.readFileSync('combat/v012-buildcraft.js','utf8');
 if(variant==='static25')buildcraft=buildcraft.replace('power*.32*','power*.25*');
 if(variant==='static40')buildcraft=buildcraft.replace('power*.32*','power*.40*');
 if(variant==='legacy65'){const start=buildcraft.indexOf(" }else if(b.element==='lightning'&&rank(b,'overcharge')&&activated(b,'overcharge')){"),end=buildcraft.indexOf(" if(rank(b,'arcane_echo')",start);if(start<0||end<start)throw Error("Missing Lightning comparison anchor");buildcraft=buildcraft.slice(0,start)+" }else if(b.element==='lightning'&&rank(b,'overcharge')){e.v012Shock=Math.min(4,(e.v012Shock||0)+1);if(e.v012Shock>=4&&ready(b,'shockBurst',c.now,2)){e.v012Shock=0;c.damage(Math.min(power*.65*(1+.20*rank(b,'overcharge')),e.maxhp*.035),'⚡ Lightning Burst');}}\n"+buildcraft.slice(end);}
 const a=create(seed,undefined,{'combat/v012-buildcraft.js':buildcraft}),s=a.state(),g=a.controller().state,tier=Math.max(1,Math.min(200,Math.round(E*ratio))),armor=['Cloth','Leather','Plate'][seed%3];a.setup(tier,weapon,seed%3===0?'Epic':'Rare');
 for(const slot of ['helm','armor','gloves','boots','belt'])s.equip[slot]=a.makeItem(tier,slot,null,'loot',armor,seed%3===0?'Epic':'Rare');
 if(seed%4===0)s.equip.weapon=a.makeItem(tier,'weapon',null,'loot',weapon,'Legendary');
 if(E>1){s.runes=['vitality','warding',weapon==='Staff'||weapon==='Wand'?'wisdom':'might'].map(f=>a.makeRune(f,E-1));s.runeSlots=s.runes.map(r=>r.id);}
 g.unlocked=E;s.gold=400+E*10;const initialGold=s.gold,initialFragments=s.fragments;let potionCost=0;
 s.apothecary=a.potions.shop(E);for(const kind of ['health','mana']){const item=s.apothecary.stock.find(p=>p.kind===kind);if(item&&s.gold>=item.price){potionCost+=item.price;a.potions.buy(item.id);a.potions.select(kind);}}
 if(fortune){const offered=a.potions.shop(E,()=>.8).stock.find(p=>p.kind==='fortune');s.apothecary.stock=[offered,...s.apothecary.stock].slice(0,4);const item=offered;if(s.gold>=item.price){potionCost+=item.price;a.potions.buy(item.id);a.potions.select('fortune');}}
 a.start(E);a.initial(family);if(family==='magic')a.element(['fire','frost','lightning'][seed%3]);
 let ticks=0,events=0,timeout=false,picks=[],lootObserved=0,lastWave=0,lateWaves=0;
 for(let action=0;action<800;action++){
  if(['failed','finished'].includes(g.stage))break;
  if(s.run?.status==='fight'){const r=s.run,enemy=r.enemy,plane=g.planeIndex;let n=0;while(s.run===r&&r.status==='fight'&&r.enemy===enemy&&n++<5000){a.tick();ticks++;}if(n>=5000){timeout=true;break;}if(enemy.hp<=0){if(plane>=12)lateWaves++;lastWave=plane;}a.flush();continue;}
  if(a.events.run()?.event){const id=a.events.run().event.id,item=a.bag.items()[0],passive=a.build().picks.find(id=>id!==a.build().initialPassive),familyHint=a.controller().allowed()[0],target=Object.values(s.equip).find(Boolean);let ok=a.events.choose(0,item?.id,passive,familyHint,target?.id);if(!ok)ok=a.events.choose(1,item?.id,passive,familyHint,target?.id);if(!ok)a.events.choose(2);events++;continue;}
  if(a.draft()?.kind==='reward'){const order=[...priorities[family],'renewal','fortified','strong_heart'],options=a.draft().options;const pick=[...options].sort((x,y)=>(order.includes(x.id)?order.indexOf(x.id):99)-(order.includes(y.id)?order.indexOf(y.id):99))[0];picks.push(pick.id);a.passive(pick.id);continue;}
  if(a.draft()?.step==='element'){a.element(['fire','frost','lightning'][seed%3]);continue;}
  if(a.results().review){a.exitResult();continue;}
  if(g.stage==='choice'){
   lootObserved=Math.max(lootObserved,a.results().earned.length);while(a.bag.overflow()>0)a.bag.discard(a.bag.items().at(-1).id);
   for(const item of [...a.bag.items()]){if(item.slot==='weapon'&&item.subtype!==weapon)continue;if(item.slot==='offhand'&&['Bow','Staff','Two-Handed'].includes(weapon))continue;const equip={...s.equip,[item.slot]:item};if(a.baseStats(equip).power>a.baseStats().power)a.equip(item.id);}
   const v=a.vitals();for(const [i,p]of (a.events.run().potions||[]).entries())if(!p.used&&(p.kind==='health'&&v.hp<v.maxhp*.65||p.kind==='mana'&&v.mp<v.maxmp*.5))a.potions.use(i);
   const fav=[family,'vitality','aegis','magic','blood','decay','fury'],offers=[...g.offers].sort((x,y)=>fav.indexOf(x.family)-fav.indexOf(y.family)||x.waves-y.waves);const selected=g.planeIndex===1?offers.find(p=>p.family===family):offers[0];a.select(selected.id);a.enter();continue;
  }
  throw Error('Unresolved simulation state '+g.stage);
 }
 const summary=a.results().summary,metrics=summary?.metrics||a.events.run()?.metrics||{},seconds=+(ticks*.11).toFixed(2);
 if(!timeout&&!['failed','finished'].includes(g.stage))throw Error('Simulation did not reach an outcome');
 return {passiveTelemetry:summary?.passiveTelemetry||a.build()?.runtime.passiveTelemetry||{},variant,E,ratio,family,seed,weapon,armor,rarity:seed%3===0?'Epic':'Rare',legendary:seed%4===0,fortune,won:g.stage==='finished',realms:g.history.length,lastWave,lateWaves,events,seconds,timeout,goldNet:s.gold-initialGold,goldPotionCost:potionCost,fragments:s.fragments-initialFragments,gearFound:a.results().earned.length,gearKept:summary?.kept.length||0,runeOffered:!!s.pendingRuneReward,damageDealt:Math.round(metrics.damageDealt||0),damageTaken:Math.round(metrics.damageTaken||0),dps:seconds?+((metrics.damageDealt||0)/seconds).toFixed(2):0,fundedCasts:metrics.fundedCasts||0,manaSpent:metrics.manaSpent||0,staticDischarges:metrics.procs?.['⚡ Static Discharge']||0,procs:metrics.procs||{},picks};
}
const weapons=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'];let seed=0;
for(const E of [1,2,10,50,100,200])for(const ratio of [.75,1,1.25])for(const family of Object.keys(priorities)){seed++;rows.push(run(E,ratio,family,seed,weapons[seed%7]));}
// Paired Fortune cases share seed/gear/strategy; subsequent RNG may diverge after a new drop.
for(const E of [1,50,200])for(const fortune of [false,true])rows.push(run(E,1,'magic',900+E,'Staff',fortune));
for(const E of [50,200])for(const weapon of ['Staff','Wand','Sword'])for(const variant of ['current','static25','static40','legacy65'])rows.push(run(E,1,'magic',1203+E,weapon,false,variant));
for(const E of [50,200])for(const weapon of ['Sword','Staff','Wand'])for(const family of Object.keys(priorities))rows.push({...run(E,1,family,2203+E,weapon),group:'matched-affinity'});
const result={engine:'index.html native updateFight, weaponAttack, rewards, events and potion transactions',htmlSha256:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),cases:rows.length,timeouts:rows.filter(r=>r.timeout).length,rows};
fs.writeFileSync(process.argv[2]||'/tmp/v012-complete-sim.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({cases:result.cases,timeouts:result.timeouts,wins:rows.filter(r=>r.won).length,byGear:[.75,1,1.25].map(ratio=>({ratio,cases:rows.filter(r=>r.ratio===ratio).length,wins:rows.filter(r=>r.ratio===ratio&&r.won).length})),byFamily:Object.keys(priorities).map(family=>{const r=rows.filter(r=>r.family===family);return {family,cases:r.length,wins:r.filter(x=>x.won).length,meanRealms:+(r.reduce((n,x)=>n+x.realms,0)/r.length).toFixed(1)};})}));
