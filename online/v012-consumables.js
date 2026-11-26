(function(root){'use strict';
const rows=[['health','Health Potion','Common',14],['mana','Mana Potion','Common',14],['might','Potion of Might','Uncommon',22],['arcane','Arcane Elixir','Uncommon',22],['ironhide','Ironhide Tonic','Uncommon',22],['haste','Haste Draught','Rare',36],['fortune','Potion of Fortune','Epic',42],['barrier','Barrier Flask','Rare',36],['trail','Trail Draught','Uncommon',22],['scout','Scout Tonic','Uncommon',22],['purifying','Purifying Tincture','Uncommon',24],['veilsight','Veilsight Elixir','Rare',38],['fate','Fate Distillate','Rare',40],['wisdom','Elixir of Wisdom','Epic',42],['rejuvenation','Rejuvenation Potion','Rare',36],['withering','Withering Elixir','Rare',36],['precision','Precision Draught','Rare',36],['phantom','Phantom Tonic','Rare',36],['prospector',"Prospector's Elixir",'Epic',42],['executioner',"Executioner's Draught",'Rare',40],['renewal','Elixir of Renewal','Uncommon',24]];
const CATALOG=rows.map(([id,name,rarity,base])=>Object.freeze({id,name,rarity,base}));
// R7B: increase Rare and Epic availability; each rarity bucket is still split evenly.
const AUTO=Object.freeze(['fortune','wisdom','prospector']);
const UNIQUE=Object.freeze([...AUTO,'trail']);
const RARITY_OFFER_WEIGHTS=Object.freeze({Common:4800,Uncommon:3000,Rare:1600,Epic:600});
const OFFER_WEIGHT_TOTAL=Object.values(RARITY_OFFER_WEIGHTS).reduce((sum,weight)=>sum+weight,0);
const OFFER_PROBABILITIES=Object.freeze(Object.fromEntries(CATALOG.map(p=>[p.id,RARITY_OFFER_WEIGHTS[p.rarity]/OFFER_WEIGHT_TOTAL/CATALOG.filter(q=>q.rarity===p.rarity).length])));
function validateStock(stock){if(!stock||typeof stock!=='object'||Array.isArray(stock)||Object.keys(stock).some(id=>!rows.some(r=>r[0]===id))||Object.values(stock).some(q=>!Number.isSafeInteger(q)||q<0||q>99999))throw Error('Invalid consumable inventory');return stock;}
function selection(stock,ids){validateStock(stock);if(!Array.isArray(ids)||ids.length>3||UNIQUE.some(kind=>ids.filter(id=>id===kind).length>1))throw Error('Invalid potion selection');for(const id of new Set(ids))if(!rows.some(r=>r[0]===id)||(stock[id]||0)<ids.filter(x=>x===id).length)throw Error('Potion selection unavailable');return ids;}
function offer(rng){let roll=rng()*OFFER_WEIGHT_TOTAL,rarity='Epic';for(const [name,weight]of Object.entries(RARITY_OFFER_WEIGHTS)){roll-=weight;if(roll<0){rarity=name;break;}}const choices=CATALOG.filter(p=>p.rarity===rarity);return choices[Math.min(choices.length-1,Math.floor(rng()*choices.length))].id;}
function shop(E,rng,id){const ids=Array.from({length:4},()=>offer(rng));return {stock:ids.map(kind=>({id:id(),kind,price:Math.ceil(CATALOG.find(p=>p.id===kind).base*(1+E*.12))})),refreshCost:12+Math.ceil(E*.5)};}
// R7B: Uncommon uses one thematic Reagent; Prospector trades Essence for a Reagent-gathering opportunity.
const RECIPE_FAMILIES=Object.freeze({health:[],mana:[],might:['blood'],arcane:['arcane'],ironhide:['aegis'],haste:['fury','arcane'],fortune:['radiance','decay'],barrier:['aegis','arcane'],trail:['fury'],scout:['fury'],purifying:['radiance'],veilsight:['arcane','radiance'],fate:['arcane','aegis'],wisdom:['radiance','arcane'],rejuvenation:['radiance','arcane'],withering:['blood','decay'],precision:['fury','blood'],phantom:['fury','aegis'],prospector:[],executioner:['fury','decay'],renewal:['radiance']});
const RECIPE_ESSENCE=Object.freeze({Common:2,Uncommon:3,Rare:5,Epic:8});
const RECIPES=Object.freeze(CATALOG.map(p=>Object.freeze({id:p.id,essence:RECIPE_ESSENCE[p.rarity],reagents:Object.freeze(Object.fromEntries(RECIPE_FAMILIES[p.id].map(f=>[f,1])))})));
function craftProgress(state,id,hasStashRoom){
 const recipe=RECIPES.find(r=>r.id===id),potion=CATALOG.find(p=>p.id===id),craftingSystem=root.WandererV013Crafting;
 if(!recipe||!state||!craftingSystem)return null;
 const stock=state.consumables||{},selected=state.potionSelection||[],crafting=state.crafting||craftingSystem.create();
 try{selection(stock,selected);}catch{return null;}
 if(!craftingSystem.valid(crafting))return null;
 const owned=stock[id]||0,autoSlot=selected.length<3&&!selected.includes(id),stashed=owned-selected.filter(k=>k===id).length;
 const requirements=[{key:'essence',name:'Essence',have:crafting.essence,need:recipe.essence},...Object.entries(recipe.reagents).map(([family,need])=>({key:family,name:family[0].toUpperCase()+family.slice(1)+' Reagent',have:crafting.cores[family],need}))];
 const room=autoSlot||stashed%99!==0||hasStashRoom===true,reason=owned>=99999?'Potion stack limit reached.':!room?'Stash full. Free a slot.':requirements.some(r=>r.have<r.need)?'Missing crafting materials.':null;
 return {recipe,potion,owned,autoSlot,requirements,ready:reason===null,reason};
}
function prepareCraft(state,id,hasStashRoom){
 const project=craftProgress(state,id,hasStashRoom);if(!project?.ready)return null;
 const prior=state.crafting||root.WandererV013Crafting.create(),crafting={...prior,cores:{...prior.cores},essence:prior.essence-project.recipe.essence};
 for(const [family,need] of Object.entries(project.recipe.reagents))crafting.cores[family]-=need;
 const consumables={...(state.consumables||{}),[id]:project.owned+1},potionSelection=[...(state.potionSelection||[])];
 if(project.autoSlot)potionSelection.push(id);
 selection(consumables,potionSelection);return {crafting,consumables,potionSelection};
}
root.WandererV012Consumables=Object.freeze({CATALOG,AUTO,UNIQUE,RARITY_OFFER_WEIGHTS,OFFER_PROBABILITIES,RECIPES,craftProgress,prepareCraft,validateStock,selection,offer,shop});
})(globalThis);
