const assert=require('node:assert/strict');
const {context,aggregate,fixtures}=require('./v010-abilities-sim.cjs');
const {harness}=require('./simulate-v091.cjs');
const {gear}=require('./v010-balance-ab.cjs');
const all=context('baseline'),defs=all.WandererLegendary.DEFINITIONS;
const specs=[
 ['winterheart-spire','frost','weapon','Staff'],
 ['tome-of-the-eternal-flame','wand','offhand','Tome'],
 ['pendant-of-the-first-flame','fire','amulet','Amulet'],
 ['starweaver-relic','wand','weapon','Wand'],
 ['fang-of-the-sunbreaker','daggers','weapon','Daggers'],
 ['crescent-of-the-emberveil','daggers','offhand','Off-Hand Dagger']
];
function makeIdentity(c,id,slot,subtype,level=100){let item;for(let i=0;i<300;i++){item=c.inspect.makeItem(level,slot,null,'loot',subtype,'Legendary');if(item.legendaryId===id)return item;}throw Error('Cannot generate '+id);}
function makeExample(c,build,id,slot,subtype){const specs=gear(c.inspect,100,build,'mid',0),equip={};for(const x of specs){let item;for(let i=0;i<1000;i++){item=c.inspect.makeItem(x.tier,x.slot,x.effect,'loot',x.subtype,x.rarity);if(item.effect===x.effect)break;}equip[x.slot]=item;}equip[slot]=makeIdentity(c,id,slot,subtype);assert.equal(equip[slot].effect,defs[id].affinity);return [{s:{equip,runes:[],runeSlots:[]},generated:true}];}
function audit(){const rows=[];for(const [id,build,slot,subtype] of specs){const examples=makeExample(all,build,id,slot,subtype),enabled=aggregate(all,examples,100,80),disabled=aggregate(context('baseline',[id]),examples,100,80);rows.push({id,ability:defs[id].name,affinity:defs[id].affinity,cooldown:defs[id].cooldown,enabled,disabled});}
 const plain=harness('index.html',{legendary:true}),example=fixtures(all,'Frost',40)[0].s,options={level:40,weapon:example.equip.weapon.subtype,equipment:example.equip,seed:13513,theme:'frost',elite:'tank'};const before=plain.trial(options),instrumented=all.trial(options);for(const key of ['win','hp','seconds','damageIn','damageOut','gold','fragments','loot'])assert.equal(before[key],instrumented[key],key);
 return {identityCount:all.inspect.LEGENDARY_CATALOG.length,definedCount:Object.keys(defs).length,baselineReproduced:true,rows};}
if(require.main===module){const r=audit();console.log(JSON.stringify({identityCount:r.identityCount,definedCount:r.definedCount,baselineReproduced:r.baselineReproduced,rows:r.rows.map(x=>({id:x.id,procs:x.enabled.legendaryProcs,winOn:x.enabled.wins,winOff:x.disabled.wins,hpOn:x.enabled.hp,hpOff:x.disabled.hp}))}));}
module.exports={audit,makeIdentity,makeExample};
