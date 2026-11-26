(function(root){'use strict';
const rows=[['health','Health Potion','Common',14],['mana','Mana Potion','Common',14],['might','Potion of Might','Uncommon',22],['arcane','Arcane Elixir','Uncommon',22],['ironhide','Ironhide Tonic','Uncommon',22],['haste','Haste Draught','Rare',36],['fortune','Potion of Fortune','Epic',42],['barrier','Barrier Flask','Rare',36],['trail','Trail Draught','Uncommon',22],['scout','Scout Tonic','Uncommon',22],['purifying','Purifying Tincture','Uncommon',24],['veilsight','Veilsight Elixir','Rare',38],['fate','Fate Distillate','Rare',40],['wisdom','Elixir of Wisdom','Epic',42],['rejuvenation','Rejuvenation Potion','Rare',36],['withering','Withering Elixir','Rare',36],['precision','Precision Draught','Rare',36],['phantom','Phantom Tonic','Rare',36],['prospector',"Prospector's Elixir",'Epic',42],['executioner',"Executioner's Draught",'Rare',40],['renewal','Elixir of Renewal','Uncommon',24]];
const CATALOG=rows.map(([id,name,rarity,base])=>Object.freeze({id,name,rarity,base}));
// R5: retain R4 total rarity bucket weights, split each bucket evenly among its expanded catalog.
const AUTO=Object.freeze(['fortune','wisdom','prospector']);
const UNIQUE=Object.freeze([...AUTO,'trail']);
const RARITY_OFFER_WEIGHTS=Object.freeze({Common:43500,Uncommon:26100,Rare:11600,Epic:2800});
const OFFER_WEIGHT_TOTAL=Object.values(RARITY_OFFER_WEIGHTS).reduce((sum,weight)=>sum+weight,0);
const OFFER_PROBABILITIES=Object.freeze(Object.fromEntries(CATALOG.map(p=>[p.id,RARITY_OFFER_WEIGHTS[p.rarity]/OFFER_WEIGHT_TOTAL/CATALOG.filter(q=>q.rarity===p.rarity).length])));
function validateStock(stock){if(!stock||typeof stock!=='object'||Array.isArray(stock)||Object.keys(stock).some(id=>!rows.some(r=>r[0]===id))||Object.values(stock).some(q=>!Number.isSafeInteger(q)||q<0||q>99999))throw Error('Invalid consumable inventory');return stock;}
function selection(stock,ids){validateStock(stock);if(!Array.isArray(ids)||ids.length>3||UNIQUE.some(kind=>ids.filter(id=>id===kind).length>1))throw Error('Invalid potion selection');for(const id of new Set(ids))if(!rows.some(r=>r[0]===id)||(stock[id]||0)<ids.filter(x=>x===id).length)throw Error('Potion selection unavailable');return ids;}
function offer(rng){let roll=rng()*OFFER_WEIGHT_TOTAL,rarity='Epic';for(const [name,weight]of Object.entries(RARITY_OFFER_WEIGHTS)){roll-=weight;if(roll<0){rarity=name;break;}}const choices=CATALOG.filter(p=>p.rarity===rarity);return choices[Math.min(choices.length-1,Math.floor(rng()*choices.length))].id;}
function shop(E,rng,id){const ids=Array.from({length:4},()=>offer(rng));return {stock:ids.map(kind=>({id:id(),kind,price:Math.ceil(CATALOG.find(p=>p.id===kind).base*(1+E*.12))})),refreshCost:12+Math.ceil(E*.5)};}
root.WandererV012Consumables=Object.freeze({CATALOG,AUTO,UNIQUE,RARITY_OFFER_WEIGHTS,OFFER_PROBABILITIES,validateStock,selection,offer,shop});
})(globalThis);
