// Wanderer v0.13 Stage 8.0 — deterministic, Realm-specific enemy roster.
// Pure planning only: no combat RNG consumption, no map topology changes.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation;
if(!F)throw Error('Stage 8.0 requires the Expedition foundation');
const ROLES=Object.freeze(['minion','tank','skirmisher','caster']);
const FAMILY_WEIGHTS=Object.freeze({
 blood:Object.freeze({tank:1,skirmisher:5,caster:2}),
 decay:Object.freeze({tank:1,skirmisher:3,caster:4}),
 vitality:Object.freeze({tank:4,skirmisher:2,caster:3}),
 aegis:Object.freeze({tank:6,skirmisher:2,caster:2}),
 fury:Object.freeze({tank:1,skirmisher:6,caster:2}),
 magic:Object.freeze({tank:1,skirmisher:2,caster:6})
});
// Each entry: [display name, existing animated sprite index (0 or 1)].
// Keep the original 24 creatures as primary roles or role-compatible variants.
const CATALOG=Object.freeze({
 temple:  {minion:['Blightling',0],tank:['Mireback',0],skirmisher:['Blight Mantis',0],caster:['Spore Toad',1]},
 void:    {minion:['Shade Fragment',0],tank:['Gravewarden',1],skirmisher:['Grave Lantern',1],caster:['Hollow Shade',0]},
 forge:   {minion:['Blood Thrall',1],tank:['Crimson Bastion',0],skirmisher:['Crimson Courtier',0],caster:['Hemalurgist',0]},
 bloodscar:{minion:['Bloodling',0],tank:['Bonewaste Burrower',1],skirmisher:['Sanguine Leech',0],caster:['Gore Seer',0]},
 grove:   {minion:['Root Sprout',1],tank:['Thornback Stag',0],skirmisher:['Canopy Stalker',1],caster:['Grove Hexer',1]},
 shrine:  {minion:['Bloom Seedling',1],tank:['Heartwood Sentinel',0],skirmisher:['Briar Lurker',1],caster:['Rootbound Hermit',0]},
 ward:    {minion:['Ward Fragment',1],tank:['Sigil Squire',0],skirmisher:['Glyphstrider',0],caster:['Oath Scribe',0]},
 drowned: {minion:['Brine Whelp',1],tank:['Barnacle Legionnaire',0],skirmisher:['Undertow Marauder',0],caster:['Brinecaller',1]},
 crypt:   {minion:['Carrion Whelp',1],tank:['Gravebound Husk',1],skirmisher:['Carrion Harrier',0],caster:['Mourning Cantor',1]},
 bastion: {minion:['Chainling',0],tank:['Chainmaw Brute',0],skirmisher:['Chainrunner',1],caster:['Ironbound Warcaller',0]},
 ash:     {minion:['Emberling',1],tank:['Ashen Sentinel',1],skirmisher:['Ashstrider',1],caster:['Cinder Hexer',0]},
 storm:   {minion:['Spark Fragment',0],tank:['Glassguard',1],skirmisher:['Glasswing Striker',0],caster:['Tempest Prism',1]}
});
function catalogFor(realm,base){
 const table=CATALOG[realm];
 if(!table||!Array.isArray(base)||base.length!==2||base.some(item=>!item?.name||!item.image))throw Error('Invalid Stage 8.0 Realm catalog');
 const out=ROLES.map(role=>({name:table[role][0],image:base[table[role][1]].image,role}));
 for(const item of base){
  if(!['tank','skirmisher','caster'].includes(item.role)||out.some(entry=>entry.name===item.name))continue;
  out.push({name:item.name,image:item.image,role:item.role});
 }
 return out;
}
function chooseWeighted(weights,random,used){
 const choices=['tank','skirmisher','caster'].filter(role=>!used.includes(role));
 const pool=choices.length?choices:['tank','skirmisher','caster'];
 const total=pool.reduce((sum,role)=>sum+weights[role],0);
 let pick=random()*total;
 for(const role of pool){pick-=weights[role];if(pick<0)return role;}
 return pool[pool.length-1];
}
function plan({seed,realm,family,node=0,count,catalog}){
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!CATALOG[realm]||!FAMILY_WEIGHTS[family]||
    !Number.isInteger(node)||node<0||!Number.isInteger(count)||count<1||count>22||
    !Array.isArray(catalog)||ROLES.some(role=>!catalog.some(m=>m.role===role)))throw Error('Invalid Stage 8.0 encounter roster');
 const random=F.rng(seed,'stage8_roster_'+realm+'_'+node+'_'+count);
 // Stage 6.18: keep principal roles in the first four visible slots while
 // swarms remain Minion-heavy; avoid the abrupt drop to ~1 principal at 6.
 const normalCount=count===1?1:count<=4?count-(count===4&&random()<.5?2:1):
   count===5?2+(random()<.5?1:0):
   count===6?2+(random()<.6?1:0):
   count<=8?3:
   count<=12?3+(random()<.25?1:0):
   count<=17?3+(random()<.35?1:0):
   3+(random()<.5?1:0);
 const roles=Array(count).fill('minion'),positions=Array.from({length:Math.min(count,4)},(_,i)=>i);
 for(let i=positions.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
 const selected=positions.slice(0,normalCount);
 const weights=FAMILY_WEIGHTS[family],used=[];
 for(const index of selected){const role=chooseWeighted(weights,random,used);roles[index]=role;used.push(role);}
 return roles.map(role=>{
  const candidates=catalog.filter(m=>m.role===role),chosen=candidates[Math.floor(random()*candidates.length)];
  return {name:chosen.name,image:chosen.image,role};
 });
}
// Choose only artwork from the paired Realm, without consuming combat or roster RNG.
function shareAffinityArt(roster,peerCatalog,{seed,realm,node=0}={}){
 if(!Array.isArray(roster)||!Array.isArray(peerCatalog)||roster.length<2||!Number.isSafeInteger(seed)||!CATALOG[realm])return roster;
 const random=F.rng(seed,'stage8_shared_art_'+realm+'_'+node),offset=Math.floor(random()*2);
 return roster.map((enemy,index)=>{
  if((index+offset)%2===0)return enemy;
  const choices=peerCatalog.filter(candidate=>candidate.role===enemy.role&&candidate.image&&candidate.image!==enemy.image);
  if(!choices.length)return enemy;
  return {...enemy,image:choices[Math.floor(random()*choices.length)].image};
 });
}
function scaleFor(enemy,count,base){
 const role=enemy?.role;
 if(!ROLES.includes(role)||count<=1)return null;
 const baseHp=base.hp,baseAtk=base.atk;
 if(count>=6){
  if(role==='minion')return {hp:baseHp*.95,atk:baseAtk*.92,def:count<=12?.25:.18};
  // Stage 6.18: explicit principal-role scales restore some real threat
  // without copying full small-room stats onto 6+ foes. Gradually taper
  // through larger swarms; never buff Minions, Elites or Bosses here.
  const t=Math.max(0,Math.min(1,(count-6)/6));
  const u=Math.max(0,Math.min(1,(count-12)/8));
  const between=(a,b,f)=>a+(b-a)*f;
  return count<=12?
   {hp:between(.47,.34,t),atk:between(.38,.28,t),def:between(.70,.64,t)}:
   {hp:between(.34,.23,u),atk:between(.28,.20,u),def:between(.64,.60,u)};
 }
 if(role==='minion')return {hp:baseHp*.95,atk:baseAtk*.90,def:.35};
 return {hp:Math.max(.57,baseHp*1.35),atk:Math.max(.50,baseAtk*1.35),def:.72};
}
const API=Object.freeze({ROLES,CATALOG,FAMILY_WEIGHTS,catalogFor,plan,shareAffinityArt,scaleFor});
root.WandererV013EnemyRoster=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
