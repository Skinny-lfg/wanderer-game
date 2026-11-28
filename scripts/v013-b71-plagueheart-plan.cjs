'use strict';
const assert=require('node:assert/strict'),G=require('./v013-b6-affinity-plan.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const IDS=['decay-focus-daggers','decay-focus-sword','decay-focus-twohand','decay-focus-bow','decay-focus-wand','decay-focus-staff','decay-focus-sword-leather','decay-focus-wand-plate','decay-cycle-sword','hybrid-decay-fury'];
const CONTROLS=['decay-cycle-sword','hybrid-decay-fury'],ARMOR_PAIRS=[['decay-focus-sword-leather','decay-focus-sword'],['decay-focus-wand','decay-focus-wand-plate']];
const SC=[...[1,4,12,22].map(size=>({id:'normal-'+size,kind:'normal',size})),{id:'elite-tank',kind:'elite',elite:'tank'},{id:'boss-aegis',kind:'boss',family:'aegis'},{id:'boss-other',kind:'boss',exclude:'aegis'}];
function profile(id){
 assert(IDS.includes(id),id);
 const base=id==='decay-focus-sword-leather'?'decay-focus-sword':id==='decay-focus-wand-plate'?'decay-focus-wand':id;
 const p=G.profile(base),variant=id.endsWith('-leather')?'Leather':id.endsWith('-plate')?'Plate':null;
 const result={...p,id,...(variant?{baseArmor:p.armorType,armorType:variant}:{}),control:CONTROLS.includes(id)};
 assert(T.valid(p.t)&&p.t.nodes.length===30);assert.equal(p.t.nodes.includes('plagueheart'),!result.control,id+' Plagueheart eligibility');
 if(!result.control)assert.deepEqual(p.families,['decay']);
 return result;
}
function family(sc,i){const f=G.FAMILIES.filter(x=>x!==sc.exclude);return sc.family||f[(i+SC.findIndex(s=>s.id===sc.id))%f.length];}
module.exports={IDS,SC,CONTROLS,ARMOR_PAIRS,profile,family,N:50};
