// Wanderer v0.12 — authoritative equipment drop and crafting costs.
// The RNG and slot sampler are injected by the active Expedition runtime.
(function(root){'use strict';
function craftCost(tier){return 10+10*tier}

const WAVE_TABLE=[
 {drop:.04,rarities:{Common:.45,Uncommon:.45,Rare:.095,Epic:.005,Legendary:0}},
 {drop:.04,rarities:{Common:.35,Uncommon:.50,Rare:.14,Epic:.01,Legendary:0}},
 {drop:.04,rarities:{Common:.25,Uncommon:.55,Rare:.18,Epic:.02,Legendary:0}},
 {drop:.18,rarities:{Common:0,Uncommon:.65,Rare:.30,Epic:.048,Legendary:.002}},
 {drop:.45,rarities:{Common:0,Uncommon:.60,Rare:.35,Epic:.048,Legendary:.002}}
];


function waveLootOdds(wave,cha=5){
 const base=WAVE_TABLE[Math.max(0,Math.min(4,(Number(wave)||1)-1))];
 const rarities={...base.rarities},boost=Math.min(.01,Math.max(0,(Number(cha)||5)-5)*.0002);
 if(wave>=4){rarities.Uncommon-=boost;rarities.Epic+=boost*.65;rarities.Legendary+=boost*.35;}
 else{rarities.Common-=boost;rarities.Rare+=boost*.65;rarities.Epic+=boost*.35;}
 const drop=Math.min(1,base.drop+Math.min(.01,Math.max(0,(Number(cha)||5)-5)*.0003));
 return {drop,rarities};
}

function randomFromOdds(odds,rng){
 let remaining=rng();
 for(const [key,probability]of Object.entries(odds)){remaining-=probability;if(remaining<0)return key;}
 return Object.keys(odds).at(-1);
}

function dungeonEquipmentOdds(theme,favored=[],TYPES,OFFHAND_TYPES){
 const categories=[
 ...TYPES.map(kind=>({kind,slot:'weapon',subtype:kind,weight:15/TYPES.length})),
 ...OFFHAND_TYPES.map(kind=>({kind,slot:'offhand',subtype:kind,weight:13/OFFHAND_TYPES.length})),
 {kind:'Helm',slot:'helm',subtype:'Helm',weight:13},
 {kind:'Amulet',slot:'amulet',subtype:'Amulet',weight:9},
 {kind:'Armor',slot:'armor',subtype:'Armor',weight:13},
 {kind:'Gloves',slot:'gloves',subtype:'Gloves',weight:13},
 {kind:'Ring',slot:'ring',subtype:'Ring',weight:11},
 {kind:'Boots',slot:'boots',subtype:'Boots',weight:13},
 {kind:'Belt',slot:'belt',subtype:'Belt',weight:13}
 ];
 // Each offer has three independently rolled preferred types (including weapons).
 // Boost selected types within their gear group, without changing the total
 // 15% weapon / 85% non-weapon split or any wave/rarity drop rate.
 const weighted=categories.map(item=>{
  const index=favored.indexOf(item.kind);
  return {...item,weight:item.weight*(index<0?1:[3,2.5,2][index])};
 });
 const weaponTotal=weighted.filter(x=>x.slot==='weapon').reduce((sum,x)=>sum+x.weight,0);
 const otherTotal=weighted.filter(x=>x.slot!=='weapon').reduce((sum,x)=>sum+x.weight,0);
 return weighted.map(item=>({...item,prob:item.weight/(item.slot==='weapon'?weaponTotal:otherTotal)*(item.slot==='weapon'?.15:.85)}));
}

function dungeonEquipmentPick(theme,favored=[],TYPES,OFFHAND_TYPES,rng,sample){
 const options=dungeonEquipmentOdds(theme,favored,TYPES,OFFHAND_TYPES);
 let rand=rng(),found=options[options.length-1];
 for(const option of options){rand-=option.prob;if(rand<0){found=option;break;}}
 return {slot:found.slot==='ring'?sample(['ring1','ring2']):found.slot,subtype:found.subtype};
}
root.WandererV012LootRules=Object.freeze({craftCost,waveLootOdds,randomFromOdds,dungeonEquipmentOdds,dungeonEquipmentPick});
})(globalThis);
