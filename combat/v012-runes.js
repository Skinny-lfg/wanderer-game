// Wanderer v0.12 — canonical Rune definitions, reward values and validation.
// Pure module: no DOM, storage, Firebase or player-state mutation.
(function(root){'use strict';
const FAMILIES=[
 {id:'might',name:'Rune of Might',field:'str',icon:'⚔️'},
 {id:'swiftness',name:'Rune of Swiftness',field:'agi',icon:'💨'},
 {id:'wisdom',name:'Rune of Wisdom',field:'int',icon:'✨'},
 {id:'fortitude',name:'Rune of Fortitude',field:'end',icon:'🛡️'},
 {id:'fortune',name:'Rune of Fortune',field:'cha',icon:'🍀'},
 {id:'fury',name:'Rune of Fury',field:'atkFlat',icon:'🔥'},
 {id:'warding',name:'Rune of Warding',field:'defFlat',icon:'🔰'},
 {id:'vitality',name:'Rune of Vitality',field:'hpFlat',icon:'❤️'}
];
function runeValue(family,tier){const base=+(1+Math.min(tier,200)/10).toFixed(2),value=family==='fury'?base*3:family==='warding'?base*2:family==='vitality'?base*10:base;return tier>200?+(value*(1+.004*(tier-200))).toFixed(2):value;}
function makeRune(family,tier,makeId,expedition=true){
 const type=FAMILIES.find(x=>x.id===family);
 return {id:makeId(),family,tier,...(expedition?{progression:'expedition'}:{}),value:runeValue(family,tier),name:type.name};
}
function validRune(r,maxTier=Number.MAX_SAFE_INTEGER,expedition=true){
 return r&&typeof r==='object'&&FAMILIES.some(x=>x.id===r.family)&&Number.isInteger(r.tier)&&r.tier>=1&&r.tier<=maxTier&&(r.progression==='expedition'&&expedition||r.tier>=10&&r.tier%10===0)&&typeof r.id==='string'&&r.id.length>0&&r.id.length<120;
}
function safeRunes(raw,maxTier=Number.MAX_SAFE_INTEGER,expedition=true){
 const seen=new Set();
 return (Array.isArray(raw)?raw:[]).filter(r=>validRune(r,maxTier,expedition)).filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true}).slice(0,300).map(r=>({id:r.id,family:r.family,tier:r.tier,...(r.progression==='expedition'?{progression:r.progression}:{}),value:runeValue(r.family,r.tier),name:FAMILIES.find(x=>x.id===r.family).name,isNew:r.isNew===true}));
}
function safePendingRune(raw,maxTier=Number.MAX_SAFE_INTEGER,expedition=true){
 const tier=Number(raw?.tier),options=Array.isArray(raw?.options)?raw.options:[];
 if(!Number.isInteger(tier)||tier<1||tier>maxTier||!expedition&&(tier<10||tier%10!==0)||options.length!==3)return null;
 if(options.some(r=>!validRune(r,maxTier,expedition)||r.tier!==tier)||new Set(options.map(r=>r.family)).size!==3)return null;
 return {tier,options:safeRunes(options,maxTier,expedition)};
}
function runeSalvageValue(r,maxTier=Number.MAX_SAFE_INTEGER,expedition=true){
 const tier=Number(r?.tier);
 if(!Number.isInteger(tier)||tier<1||tier>maxTier||!expedition&&(tier<10||tier%10!==0))return 0;
 return 5+2*Math.floor(tier/10);
}
function duplicateRuneCandidates(runes=[],runeSlots=[],maxTier=Number.MAX_SAFE_INTEGER,expedition=true){
 const equipped=new Set(runeSlots||[]),strongest=new Map();
 for(const r of runes||[]){
  if(!runeSalvageValue(r,maxTier,expedition))continue;
  const old=strongest.get(r.family);
  if(!old||r.tier>old.tier)strongest.set(r.family,r);
 }
 return (runes||[]).filter(r=>!equipped.has(r.id)&&strongest.get(r.family)?.id!==r.id&&runeSalvageValue(r,maxTier,expedition)>0);
}
root.WandererV012Runes=Object.freeze({FAMILIES,runeValue,makeRune,validRune,safeRunes,safePendingRune,runeSalvageValue,duplicateRuneCandidates});
})(globalThis);
