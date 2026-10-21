(function(root){'use strict';
const CATALOG=Object.freeze([
 {id:'gem-pouch',name:'Gem Pouch',worth:8,image:'assets/loot/treasure_gem_pouch.webp'},
 {id:'jeweled-chalice',name:'Jeweled Chalice',worth:16,image:'assets/loot/treasure_jeweled_chalice.webp'},
 {id:'golden-lion-statuette',name:'Golden Lion Statuette',worth:24,image:'assets/loot/treasure_golden_lion_statuette.webp'},
 {id:'jeweled-gold-platter',name:'Jeweled Gold Platter',worth:32,image:'assets/loot/treasure_jeweled_gold_platter.webp'},
 {id:'royal-crown',name:'Royal Crown',worth:40,image:'assets/loot/treasure_royal_crown.webp'},
 {id:'ornate-chest',name:'Ornate Chest',worth:55,image:'assets/loot/treasure_ornate_chest.webp'}
].map(item=>Object.freeze(item)));
const BY_ID=Object.freeze(Object.fromEntries(CATALOG.map(item=>[item.id,item])));
const LEGACY=Object.freeze({'Antique Coins':'gem-pouch','Golden Chalice':'jeweled-chalice','Runic Gem':'gem-pouch','Ancient Idol':'golden-lion-statuette','Jeweled Crown':'royal-crown',...Object.fromEntries(CATALOG.map(item=>[item.name,item.id]))});
function byDropId(value){const s=String(value||'');let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return CATALOG[(h>>>0)%CATALOG.length];}
function resolve(item){return BY_ID[item?.treasureType]||BY_ID[LEGACY[item?.name]]||CATALOG[0];}
function displayName(item){return resolve(item).name;}
function image(item){return resolve(item).image;}
function normalize(item){const variant=resolve(item);return {...item,kind:'valuable',treasureType:variant.id,name:variant.name,image:variant.image};}
function create(id,tier){const variant=byDropId(id);return {id,kind:'valuable',treasureType:variant.id,name:variant.name,image:variant.image,tier,worth:variant.worth,isNew:true};}
root.WandererV012Treasures=Object.freeze({CATALOG,byDropId,resolve,displayName,image,normalize,create});
})(globalThis);
