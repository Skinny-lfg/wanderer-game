// v0.13 directed equipment projects. Pure rules; persistence and inventory insertion belong to the caller.
(function(root){'use strict';
const FAMILIES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']),LIMIT=1000000000;
const TRAITS=Object.freeze({
 blood_transfer:Object.freeze({name:'Sanguine Legacy',description:'Transfer one Bleed on death to a living enemy or reinforcement; transferred Bleed cannot transfer again.'}),
 focused:Object.freeze({name:'Focused Edge',description:'Deal 10% more direct damage to the last enemy when no reinforcements remain.'}),
 ward:Object.freeze({name:'Arcane Ward',description:'Funded casts grant Barrier equal to 2% maximum Health, once every 6 seconds.'}),
 conflagration:Object.freeze({name:'Emberwake',description:'Funded Fire casts spread Burn to one additional enemy at 35% potency for up to 2 seconds.'}),
 efficient:Object.freeze({name:'Measured Casting',description:'Elemental casts cost 10% less Mana, saving at least 1 Mana per paid cast.'})
});
const recipes=[];
function add(id,name,slot,subtype,rarity,family,trait=null){recipes.push(Object.freeze({id,name,slot,subtype,rarity,family,trait,description:trait?TRAITS[trait].description:'A '+rarity+' '+subtype+' with a weighted random selection of attributes. The recipe controls type and rarity, not the individual stat roll.',source:rarity==='Uncommon'?'Known Blueprint. Gather crafting materials from completed Realms.':'Earn this '+rarity+' Blueprint from an optional Dungeon Contract.'}));}
const weapons=[['sword','Sword','blood','fury'],['mace','Mace','aegis','vitality'],['bow','Bow','fury','decay'],['daggers','Daggers','fury','blood'],['greatsword','Two-Handed','blood','fury'],['staff','Staff','magic','vitality'],['wand','Wand','magic','aegis']];
for(const [id,type,family,other] of weapons){add('green_'+id,'Apprentice '+type,'weapon',type,'Uncommon',family);add('blue_'+id,({blood:'Crimson',decay:'Blighted',vitality:'Verdant',aegis:'Warded',fury:'Keen',magic:'Runic'}[family])+' '+type,'weapon',type,'Rare',family);add('blue_'+id+'_'+other,({blood:'Crimson',decay:'Blighted',vitality:'Verdant',aegis:'Warded',fury:'Keen',magic:'Runic'}[other])+' '+type,'weapon',type,'Rare',other);}
const armor=[['helm','Helm'],['armor','Armor'],['gloves','Gloves'],['boots','Boots'],['belt','Belt']];
for(const [slot,label] of armor)for(const [type,family] of [['Plate','aegis'],['Leather','fury'],['Cloth','magic']]){add('green_'+slot+'_'+type.toLowerCase(),'Apprentice '+type+' '+label,slot,type,'Uncommon',family);add('blue_'+slot+'_'+type.toLowerCase(),({Plate:'Bastion',Leather:'Tracker',Cloth:'Aetherweave'}[type])+' '+label,slot,type,'Rare',family);}
for(const [id,slot,type,family] of [['shield','offhand','Shield','aegis'],['orb','offhand','Orb','magic'],['tome','offhand','Tome','magic'],['charm','offhand','Charm','vitality'],['amulet','amulet','Amulet','vitality'],['ring','ring1','Ring','fury'],['ring2','ring2','Ring','fury']])for(const rarity of ['Uncommon','Rare'])add((rarity==='Uncommon'?'green_':'blue_')+id,(rarity==='Uncommon'?'Apprentice ':'Artisan ')+type,slot,type,rarity,family);
// Alternative recipes vary by family; actual
// Forge item affixes are independently rolled from the same v0.13 pools.
for(const [id,name,subtype,family] of [
 ['sword_insight','Runic Sword','Sword','magic'],
 ['mace_guard','Warden Mace','Mace','vitality'],
 ['bow_might','War Bow','Bow','blood'],
 ['daggers_might','Butcher Daggers','Daggers','blood'],
 ['daggers_insight','Hex Daggers','Daggers','decay']
])add('blue_'+id,name,'weapon',subtype,'Rare',family);
for(const [family,label] of [
 ['blood','Crimson'],['fury','Keen'],['magic','Runic'],
 ['vitality','Verdant'],['aegis','Warded']
])for(const [slot,type]of [['ring1','Ring'],['ring2','Ring'],['amulet','Amulet']])
 add('blue_'+slot+'_'+family,label+' '+type,slot,type,'Rare',family);
for(const row of [
 ['oathkeeper','Oathkeeper','weapon','Mace','aegis','focused'],['wardens_promise',"Warden's Promise",'offhand','Shield','aegis','focused'],
 ['sanguine_edge','Sanguine Edge','weapon','Sword','blood','blood_transfer'],['gravecleaver','Gravecleaver','weapon','Two-Handed','blood','blood_transfer'],
 ['hunters_oath',"Hunter's Oath",'weapon','Bow','fury','focused'],['silent_verdict','Silent Verdict','weapon','Daggers','fury','focused'],
 ['ember_branch','Ember Branch','weapon','Staff','magic','conflagration'],['measured_staff','Measured Staff','weapon','Staff','magic','efficient'],
 ['lifewoven_wand','Lifewoven Wand','weapon','Wand','vitality','efficient'],['venomglass','Venomglass','weapon','Wand','decay','efficient'],
 ['warded_mantle','Warded Mantle','armor','Cloth','aegis','ward'],['aether_orb','Aether Orb','offhand','Orb','magic','ward']
]){const [id,name,slot,type,family,trait]=row;add('epic_'+id,name,slot,type,'Epic',family,trait);}
// Only current blueprints are valid. Historical Off-Hand Dagger recipes are not part of the fresh collection.
const RECIPES=Object.freeze(recipes);
const byId=new Map(RECIPES.map(r=>[r.id,r]));
function integer(v){return Number.isSafeInteger(v)&&v>=0&&v<=LIMIT;}
function create(){return {version:1,essence:0,dryRooms:{},cores:Object.fromEntries(FAMILIES.map(f=>[f,0])),realmFamilies:[],bossFamilies:[],learnedRecipes:[]};}
function valid(p){return !!p&&p.version===1&&integer(p.essence)&&(p.dryRooms===undefined||(p.dryRooms&&typeof p.dryRooms==="object"&&!Array.isArray(p.dryRooms)&&Object.entries(p.dryRooms).every(([family,n])=>FAMILIES.includes(family)&&integer(n)&&n<=3)))&&p.cores&&typeof p.cores==='object'&&!Array.isArray(p.cores)&&Object.keys(p.cores).length===FAMILIES.length&&FAMILIES.every(f=>integer(p.cores[f]))&&['realmFamilies','bossFamilies'].every(k=>Array.isArray(p[k])&&new Set(p[k]).size===p[k].length&&p[k].every(f=>FAMILIES.includes(f)))&&(p.mythicFamilies===undefined||(Array.isArray(p.mythicFamilies)&&new Set(p.mythicFamilies).size===p.mythicFamilies.length&&p.mythicFamilies.every(f=>p.bossFamilies.includes(f))))&&p.bossFamilies.every(f=>p.realmFamilies.includes(f))&&Array.isArray(p.learnedRecipes)&&new Set(p.learnedRecipes).size===p.learnedRecipes.length&&p.learnedRecipes.every(id=>byId.has(id)&&byId.get(id).rarity!=='Uncommon');}
function checked(p){if(!valid(p))throw Error('Invalid crafting progress');return p;}
function clone(p){checked(p);return {...p,dryRooms:{...p.dryRooms},cores:{...p.cores},realmFamilies:[...p.realmFamilies],bossFamilies:[...p.bossFamilies],learnedRecipes:[...p.learnedRecipes]};}
function tierBand(tier){if(!Number.isSafeInteger(tier)||tier<1)throw Error('Invalid crafting tier');if(root.WandererExpeditionProgression)return tier<=5?tier:root.WandererExpeditionProgression.gearTier(tier).minimum;return tier<=5?tier:1+5*Math.floor((tier-1)/5);}
function cost(id,tier=1){const r=byId.get(id);if(!r)throw Error('Unknown recipe');const band=tierBand(tier),row={Uncommon:[12,2,4,0],Rare:[40,4,35,0],Epic:[100,8,55,4]}[r.rarity];return {fragments:row[0]+row[1]*band,essence:row[2],coreFamily:r.family,cores:row[3],tier:band};}
function unlocked(p,id){checked(p);const r=byId.get(id);return !!r&&(r.rarity==='Uncommon'||p.learnedRecipes.includes(id));}
function discover(p,id){
 const next=clone(p),r=byId.get(id);
 if(!r||r.rarity==='Uncommon'||next.learnedRecipes.includes(id))return null;
 next.learnedRecipes.push(id);return next;
}
function award(p,encounter){const next=clone(p);if(!encounter||!FAMILIES.includes(encounter.family))throw Error('Invalid crafting encounter');if(encounter.completed===false)return next;const family=encounter.family;next.dryRooms[family]=encounter.reagent||encounter.boss?0:Math.min(3,(next.dryRooms[family]||0)+1);next.essence=Math.min(LIMIT,next.essence+(encounter.boss?5:encounter.elite?2:1));if(!next.realmFamilies.includes(family))next.realmFamilies.push(family);if(encounter.reagent&&!encounter.boss)next.cores[family]=Math.min(LIMIT,next.cores[family]+1);if(encounter.boss){next.cores[family]=Math.min(LIMIT,next.cores[family]+1);if(!next.bossFamilies.includes(family))next.bossFamilies.push(family);}return next;}
function refine(p,family){
 if(!FAMILIES.includes(family)||!(p.dryRooms?.[family]>=3)||p.essence<6||p.cores[family]>=LIMIT)return null;
 const next=clone(p);next.essence-=6;next.cores[family]++;next.dryRooms[family]=0;return next;
}
function progress(state,id,tier=1){
 const p=state?.crafting||create(),r=byId.get(id);checked(p);if(!r)return null;
 const price=cost(id,tier);
 const requirements=[
  {key:'fragments',name:'Fragments',have:state?.fragments||0,need:price.fragments,source:'Combat rewards and salvaged equipment.'},
  {key:'essence',name:'Essence',have:p.essence,need:price.essence,source:'Crafting material from completed Realms; no extra Essence for particular stats.'}
 ];
 if(price.cores)requirements.push({key:'cores',name:r.family[0].toUpperCase()+r.family.slice(1)+' Reagents',have:p.cores[r.family],need:price.cores,source:'Search '+r.family+' rooms. Elites have better odds; bosses guarantee one.'});
 return {recipe:r,cost:price,unlocked:unlocked(p,id),ready:unlocked(p,id)&&requirements.every(x=>x.have>=x.need),requirements};
}
function craftItem(generated,r,price){
 if(!generated||typeof generated.id!=='string'||generated.slot!==r.slot||generated.rarity!==r.rarity)return null;
 const item={...generated,name:r.name,recipeId:r.id,tier:price.tier,crafted:true,craftPrice:price.fragments,source:'forge',isNew:true};
 // The same source roll is preserved for Forge, drops and Merchant: rarity and
 // blueprint trait are guaranteed, but attributes never become predetermined.
 if(r.trait)item.v013Trait=r.trait;
 else delete item.v013Trait;
 return item;
}
function previewCraft(id,tier,makePreview){
 const r=byId.get(id);if(!r||typeof makePreview!=='function')return null;
 const price=cost(id,tier);
 return craftItem(makePreview(price.tier,r.slot,null,'forge',r.subtype,r.rarity),r,price);
}
function prepareCraft(state,id,tier,makeItem){
 if(!state||!Number.isSafeInteger(state.fragments)||state.fragments<0||typeof makeItem!=='function')return null;
 const result=progress(state,id,tier);if(!result?.ready)return null;
 const r=result.recipe,price=result.cost,item=craftItem(makeItem(price.tier,r.slot,null,'forge',r.subtype,r.rarity),r,price);
 if(!item)return null;
 const p=clone(state.crafting||create());p.essence-=price.essence;p.cores[r.family]-=price.cores;
 return {item,fragments:state.fragments-price.fragments,crafting:p};
}
root.WandererV013Crafting=Object.freeze({FAMILIES,RECIPES,TRAITS,refine,create,valid,tierBand,cost,unlocked,discover,progress,award,previewCraft,prepareCraft});
})(globalThis);
