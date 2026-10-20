// v0.12 Expedition events. No account, network, inventory or permanent Rune writes.
(function(root){
'use strict';
const EVENTS=Object.freeze([
 {id:'traveling_merchant',group:'trade',name:'Traveling Merchant',description:'A trader offers provisions at a steep price.'},
 {id:'smugglers_caravan',group:'trade',name:"Smuggler's Caravan",description:'Exiles trade fragments for supplies.'},
 {id:'relic_collector',group:'trade',name:'Relic Collector',description:'A scavenger searches for ancient relics.'},
 {id:'cursed_altar',group:'pact',name:'Cursed Altar',description:'Sacrifice a little life for a temporary blessing.'},
 {id:'soul_mirror',group:'pact',name:'Soul Mirror',description:'Your reflection offers might or protection.'},
 {id:'whispering_idol',group:'pact',name:'Whispering Idol',description:'The idol whispers of power and sacrifice.'},
 {id:'cursed_chest',group:'treasure',name:'Cursed Chest',description:'A sinister chest tempts you to gamble.'},
 {id:'forgotten_arsenal',group:'treasure',name:'Forgotten Arsenal',description:'Discarded weapons lie beneath the dust.'},
 {id:'runic_vault',group:'treasure',name:'Runic Vault',description:'A sealed chamber pulses with temporary runic energy.'},
 {id:'restless_spring',group:'survival',name:'Restless Spring',description:'A spring offers strength or clarity.'},
 {id:'fallen_wanderer',group:'survival',name:'Fallen Wanderer',description:'A lost traveller needs help.'},
 {id:'oracle_of_paths',group:'survival',name:'Oracle of Paths',description:'An oracle reveals competing futures.'}
]);
const BY_ID=Object.fromEntries(EVENTS.map(e=>[e.id,e]));
// Amounts are additive percentages of base combat stats. No permanent item modifiers.
const choices={
 traveling_merchant:[['provisions','Buy healing supplies',{gold:-1,heal:.28}],['scroll','Buy a warding scroll',{gold:-1,defense:.035}]],
 smugglers_caravan:[['mana','Trade fragments for Mana',{fragments:-1,mana:.35}],['strength','Trade fragments for strength',{fragments:-1,attack:.035}]],
 relic_collector:[['materials','Sell an old relic for fragments',{gold:1,fragments:1}],['relic','Buy a mysterious equipment find',{gold:-2,loot:1}]],
 cursed_altar:[['blood','Sacrifice HP for offensive power',{hp:-.11,attack:.055}],['shelter','Sacrifice HP for protection',{hp:-.07,defense:.055}]],
 soul_mirror:[['edge','Gain strength but lose resilience',{attack:.07,defense:-.035}],['guard','Gain resilience but lose strength',{defense:.07,attack:-.035}]],
 whispering_idol:[['whisper','Take a cursed blessing',{hp:-.08,mana:1,attack:.025}],['resist','Resist the voice',{fragments:1}]],
 cursed_chest:[['safe','Take the safe offering',{gold:1,fragments:1}],['risk','Open the cursed lock',{gamble:1}]],
 forgotten_arsenal:[['gear','Claim one item for your Expedition bag',{loot:1}],['scrap','Take salvage instead',{fragments:2}]],
 runic_vault:[['pulse','Gain a temporary runic surge',{attack:.04,mana:.25}],['dust','Collect runic dust',{fragments:2}]],
 restless_spring:[['health','Drink to recover Health',{heal:.32}],['mana','Drink to recover Mana',{mana:.40}]],
 fallen_wanderer:[['help','Help the traveller for a ward',{gold:-1,defense:.045}],['search','Gather abandoned supplies',{gold:1,fragments:1}]],
 oracle_of_paths:[['foresight','Follow the dangerous vision',{attack:.045,hp:-.05}],['safety','Take the safer path',{defense:.035,heal:.12}]]
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function options(eventId){
 if(!BY_ID[eventId])throw Error('Unknown Expedition event');
 return choices[eventId].map(([id,label])=>({id,label}));
}
function resolve(eventId,id,state,rng=Math.random){
 if(!BY_ID[eventId]||!Array.isArray(choices[eventId]))throw Error('Unknown Expedition event');
 if(typeof rng!=='function')throw Error('Invalid event random');
 const picked=choices[eventId].find(x=>x[0]===id);
 if(!picked)throw Error('Event choice not offered');
 const spec=picked[2],level=clamp(Math.floor(Number(state.level)||1),1,200);
 const coin=Math.round(10+level*.55),fragment=Math.round(5+level*.18);
 const gold=Number(state.gold)||0,fragments=Number(state.fragments)||0;
 const maxhp=Math.max(1,Number(state.maxhp)||1),hp=clamp(Number(state.hp)||0,0,maxhp);
 const maxmp=Math.max(0,Number(state.maxmp)||0),mp=clamp(Number(state.mp)||0,0,maxmp);
 const priceGold=spec.gold<0?Math.abs(spec.gold)*coin:0,priceFragments=spec.fragments<0?Math.abs(spec.fragments)*fragment:0;
 const hpCost=spec.hp<0?Math.ceil(maxhp*Math.abs(spec.hp)):0;
 if(gold<priceGold||fragments<priceFragments||hp-hpCost<Math.max(1,Math.ceil(maxhp*.1)))throw Error('Not enough resources for event choice');
 let deltaHP=-hpCost, deltaMP=0, loot=Number(spec.loot)||0,attack=spec.attack||0,defense=spec.defense||0;
 if(spec.heal)deltaHP+=Math.min(maxhp-(hp+deltaHP),Math.ceil(maxhp*spec.heal));
 if(spec.mana)deltaMP+=Math.min(maxmp-mp,Math.ceil(maxmp*spec.mana));
 let deltaGold=(spec.gold>0?spec.gold*coin:0)-priceGold;
 let deltaFragments=(spec.fragments>0?spec.fragments*fragment:0)-priceFragments;
 if(spec.gamble){
  const good=rng()<.48;
  if(good){loot=1;deltaFragments+=fragment;}
  else deltaHP-=Math.min(Math.max(0,hp+deltaHP-1),Math.ceil(maxhp*.08));
 }
 return {eventId,id,name:BY_ID[eventId].name,label:picked[1],gold:deltaGold,fragments:deltaFragments,
  hp:deltaHP,mp:deltaMP,attack,defense,loot};
}
root.WandererV012Events=Object.freeze({CATALOG:EVENTS,options,resolve});
})(globalThis);
