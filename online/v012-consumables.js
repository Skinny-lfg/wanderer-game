(function(root){'use strict';
const rows=[['health','Health Potion','Common',14],['mana','Mana Potion','Common',14],['might','Potion of Might','Uncommon',22],['arcane','Arcane Elixir','Uncommon',22],['ironhide','Ironhide Tonic','Uncommon',22],['haste','Haste Draught','Rare',30],['fortune','Potion of Fortune','Rare',42],['barrier','Barrier Flask','Rare',30]];
const CATALOG=rows.map(([id,name,rarity,base])=>Object.freeze({id,name,rarity,base}));
function validateStock(stock){if(!stock||typeof stock!=='object'||Array.isArray(stock)||Object.keys(stock).some(id=>!rows.some(r=>r[0]===id))||Object.values(stock).some(q=>!Number.isSafeInteger(q)||q<0||q>99999))throw Error('Invalid consumable inventory');return stock;}
function selection(stock,ids){validateStock(stock);if(!Array.isArray(ids)||ids.length>3||ids.filter(id=>id==='fortune').length>1)throw Error('Invalid potion selection');for(const id of new Set(ids))if(!rows.some(r=>r[0]===id)||(stock[id]||0)<ids.filter(x=>x===id).length)throw Error('Potion selection unavailable');return ids;}
function shop(E,rng,id){const ids=Array.from({length:4},()=>rows[Math.min(rows.length-1,Math.floor(rng()*rows.length))][0]);return {stock:ids.map(kind=>({id:id(),kind,price:Math.ceil(CATALOG.find(p=>p.id===kind).base*(1+E*.12))})),refreshCost:12+Math.ceil(E*.5)};}
root.WandererV012Consumables=Object.freeze({CATALOG,validateStock,selection,shop});
})(globalThis);
