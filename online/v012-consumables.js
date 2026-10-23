(function(root){'use strict';
const rows=[['health','Health Potion','Common',14],['mana','Mana Potion','Common',14],['might','Potion of Might','Uncommon',22],['arcane','Arcane Elixir','Uncommon',22],['ironhide','Ironhide Tonic','Uncommon',22],['haste','Haste Draught','Rare',36],['fortune','Potion of Fortune','Rare',42],['barrier','Barrier Flask','Rare',36]];
const CATALOG=rows.map(([id,name,rarity,base])=>Object.freeze({id,name,rarity,base}));
const RARITY_OFFER_WEIGHTS=Object.freeze({Common:50,Uncommon:30,Rare:20});
function validateStock(stock){if(!stock||typeof stock!=='object'||Array.isArray(stock)||Object.keys(stock).some(id=>!rows.some(r=>r[0]===id))||Object.values(stock).some(q=>!Number.isSafeInteger(q)||q<0||q>99999))throw Error('Invalid consumable inventory');return stock;}
function selection(stock,ids){validateStock(stock);if(!Array.isArray(ids)||ids.length>3||ids.filter(id=>id==='fortune').length>1)throw Error('Invalid potion selection');for(const id of new Set(ids))if(!rows.some(r=>r[0]===id)||(stock[id]||0)<ids.filter(x=>x===id).length)throw Error('Potion selection unavailable');return ids;}
function offer(rng){let roll=rng()*100,rarity='Rare';for(const [name,weight]of Object.entries(RARITY_OFFER_WEIGHTS)){roll-=weight;if(roll<0){rarity=name;break;}}const choices=CATALOG.filter(p=>p.rarity===rarity);return choices[Math.min(choices.length-1,Math.floor(rng()*choices.length))].id;}
function shop(E,rng,id){const ids=Array.from({length:4},()=>offer(rng));return {stock:ids.map(kind=>({id:id(),kind,price:Math.ceil(CATALOG.find(p=>p.id===kind).base*(1+E*.12))})),refreshCost:12+Math.ceil(E*.5)};}
root.WandererV012Consumables=Object.freeze({CATALOG,RARITY_OFFER_WEIGHTS,validateStock,selection,offer,shop});
})(globalThis);
