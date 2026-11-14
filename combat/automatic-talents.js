// Permanent, deliberately bounded progression for the isolated automatic RPG branch.
(function(root){'use strict';
const CORE=Object.freeze([
 {id:'might',name:'Might',description:'Increase Attack and Spell Power by 5%.',attack:.05,spell:.05},
 {id:'precision',name:'Precision',description:'Increase critical chance by 2%.',requires:'might',crit:2},
 {id:'execution',name:'Execution',description:'Increase Attack and Spell Power by 8%.',requires:'precision',attack:.08,spell:.08},
 {id:'vitality',name:'Vitality',description:'Increase maximum Health by 8%.',health:.08},
 {id:'guard',name:'Guard',description:'Increase Defense by 8%.',requires:'vitality',defense:.08},
 {id:'fortitude',name:'Fortitude',description:'Increase maximum Health by 12%.',requires:'guard',health:.12},
 {id:'haste',name:'Haste',description:'Increase attack speed by 5%.',speed:.05},
 {id:'flow',name:'Flow',description:'Increase Mana and Mana regeneration by 8%.',requires:'haste',mana:.08},
 {id:'mastery',name:'Mastery',description:'Increase attack speed by 8%.',requires:'flow',speed:.08},
 ...Array.from({length:15},(_,i)=>{const roots=['might','vitality','haste'],types=['attack','health','speed'],names=['Force','Resilience','Swiftness'],branch=i%3,step=Math.floor(i/3);return {id:'minor_'+types[branch]+'_'+(step+1),name:names[branch],description:'Increase '+(branch===0?'Attack and Spell Power by 2%.':branch===1?'maximum Health by 3%.':'attack speed by 2%.'),requires:step?'minor_'+types[branch]+'_'+step:roots[branch],...(branch===0?{attack:.02,spell:.02}:branch===1?{health:.03}:{speed:.02})};})
].map(Object.freeze));
const FORKS=Object.freeze([
 {id:'fork_cleave_str_1',name:'Strength',family:'blood',attribute:'str',requires:'passive_bleeding_edge',forkAnchor:'passive_bleeding_edge',forkStep:1,description:'+1 Strength.'},
 {id:'fork_cleave_str_2',name:'Strength',family:'blood',attribute:'str',requires:'fork_cleave_str_1',forkAnchor:'passive_bleeding_edge',forkStep:2,description:'+1 Strength.'},
 {id:'cleave_mastery',name:'Sweeping Force',family:'blood',requires:'fork_cleave_str_2',forkAnchor:'passive_bleeding_edge',forkStep:3,description:'Two-Handed cleave deals 60% instead of 40% damage to secondary targets.'},
 {id:'fork_storm_int_1',name:'Intellect',family:'magic',attribute:'int',requires:'passive_arcane_focus',forkAnchor:'passive_arcane_focus',forkStep:1,description:'+1 Intellect.'},
 {id:'fork_storm_int_2',name:'Intellect',family:'magic',attribute:'int',requires:'fork_storm_int_1',forkAnchor:'passive_arcane_focus',forkStep:2,description:'+1 Intellect.'},
 {id:'storm_mastery',excludes:['lightning_focus'],name:'Storm Conductor',family:'magic',requires:'fork_storm_int_2',forkAnchor:'passive_arcane_focus',forkStep:3,description:'With Overcharge, Chain Lightning hits one more enemy for 20% of the primary hit.'},
 {id:'fork_fire_int_1',name:'Intellect',family:'magic',attribute:'int',requires:'passive_kindling',forkAnchor:'passive_kindling',forkStep:1,description:'+1 Intellect.'},
 {id:'fork_fire_int_2',name:'Intellect',family:'magic',attribute:'int',requires:'fork_fire_int_1',forkAnchor:'passive_kindling',forkStep:2,description:'+1 Intellect.'},
 {id:'fire_spread',excludes:['fire_focus'],name:'Wildfire',family:'magic',requires:'fork_fire_int_2',forkAnchor:'passive_kindling',forkStep:3,description:'Funded Fire casts spread one Burn to up to two enemies at 50% damage for up to two seconds.'},
 {id:'fork_frost_int_1',name:'Intellect',family:'magic',attribute:'int',requires:'passive_deep_winter',forkAnchor:'passive_deep_winter',forkStep:1,description:'+1 Intellect.'},
 {id:'fork_frost_int_2',name:'Intellect',family:'magic',attribute:'int',requires:'fork_frost_int_1',forkAnchor:'passive_deep_winter',forkStep:2,description:'+1 Intellect.'},
 {id:'frost_spread',excludes:['frost_focus'],name:'Winter Field',family:'magic',requires:'fork_frost_int_2',forkAnchor:'passive_deep_winter',forkStep:3,description:'Funded Frost casts Chill up to two additional enemies for two seconds.'},
 {id:'fork_plague_agi_1',name:'Agility',family:'decay',attribute:'agi',requires:'passive_toxic_touch',forkAnchor:'passive_toxic_touch',forkStep:1,description:'+1 Agility.'},
 {id:'fork_plague_agi_2',name:'Agility',family:'decay',attribute:'agi',requires:'fork_plague_agi_1',forkAnchor:'passive_toxic_touch',forkStep:2,description:'+1 Agility.'},
 {id:'plague_spread',excludes:['rot_focus'],name:'Contagion',family:'decay',requires:'fork_plague_agi_2',forkAnchor:'passive_toxic_touch',forkStep:3,description:'On kill, spread one active Bleed and Rot to up to two enemies at 50% damage; spread effects cannot spread again.'},
 {id:'fork_bow_agi_1',name:'Agility',family:'fury',attribute:'agi',requires:'passive_precision',forkAnchor:'passive_precision',forkStep:1,description:'+1 Agility.'},
 {id:'fork_bow_agi_2',name:'Agility',family:'fury',attribute:'agi',requires:'fork_bow_agi_1',forkAnchor:'passive_precision',forkStep:2,description:'+1 Agility.'},
 {id:'bow_pierce',name:'Piercing Arrow',family:'fury',requires:'fork_bow_agi_2',forkAnchor:'passive_precision',forkStep:3,description:'Bow attacks hit one additional enemy for 35% damage.'},
 {id:'fork_dagger_agi_1',name:'Agility',family:'fury',attribute:'agi',requires:'passive_double_strike',forkAnchor:'passive_double_strike',forkStep:1,description:'+1 Agility.'},
 {id:'fork_dagger_agi_2',name:'Agility',family:'fury',attribute:'agi',requires:'fork_dagger_agi_1',forkAnchor:'passive_double_strike',forkStep:2,description:'+1 Agility.'},
 {id:'fan_of_blades',name:'Fan of Blades',family:'fury',requires:'fork_dagger_agi_2',forkAnchor:'passive_double_strike',forkStep:3,forkSide:1,description:'Daggers strike up to two additional enemies for 22% damage each.'},
 {id:'fork_sword_end_1',name:'Endurance',family:'aegis',attribute:'end',requires:'passive_iron_skin',forkAnchor:'passive_iron_skin',forkStep:1,description:'+1 Endurance.'},
 {id:'fork_sword_end_2',name:'Endurance',family:'aegis',attribute:'end',requires:'fork_sword_end_1',forkAnchor:'passive_iron_skin',forkStep:2,description:'+1 Endurance.'},
 {id:'sword_sweep',name:'Shielded Sweep',family:'aegis',requires:'fork_sword_end_2',forkAnchor:'passive_iron_skin',forkStep:3,description:'Sword and Shield attacks hit one additional enemy for 25% damage.'},
 {id:'fork_mace_end_1',name:'Endurance',family:'aegis',attribute:'end',requires:'passive_barrier_pulse',forkAnchor:'passive_barrier_pulse',forkStep:1,description:'+1 Endurance.'},
 {id:'fork_mace_end_2',name:'Endurance',family:'aegis',attribute:'end',requires:'fork_mace_end_1',forkAnchor:'passive_barrier_pulse',forkStep:2,description:'+1 Endurance.'},
 {id:'mace_shockwave',name:'Concussive Swing',family:'aegis',requires:'fork_mace_end_2',forkAnchor:'passive_barrier_pulse',forkStep:3,description:'Mace attacks deal 30% damage to one additional enemy and slow its attacks for one second.'},
 {id:'fork_focus_agi_1',name:'Agility',family:'fury',attribute:'agi',requires:'passive_quick_hands',forkAnchor:'passive_quick_hands',forkStep:1,description:'+1 Agility.'},
 {id:'fork_focus_agi_2',name:'Agility',family:'fury',attribute:'agi',requires:'fork_focus_agi_1',forkAnchor:'passive_quick_hands',forkStep:2,description:'+1 Agility.'},
 {id:'single_target_mastery',excludes:['fury_momentum'],name:'Focused Assault',family:'fury',requires:'fork_focus_agi_2',forkAnchor:'passive_quick_hands',forkStep:3,description:'Deal 15% more direct damage when one enemy remains and no reinforcements are waiting.'}
,{"id":"blood_focus","name":"Hemorrhage","family":"blood","requires":"passive_deep_cuts","forkAnchor":"passive_deep_cuts","forkStep":3,"forkSide":-1,"excludes":["blood_transfer"],"description":"Bleed deals 25% more damage; direct attacks deal 10% less."},
{"id":"blood_transfer","name":"Bloodshed","family":"blood","requires":"passive_deep_cuts","forkAnchor":"passive_deep_cuts","forkStep":3,"forkSide":1,"excludes":["blood_focus"],"description":"On death, transfer one Bleed at 50% strength to one living enemy or waiting reinforcement. Transferred Bleeds cannot transfer again."},
{"id":"rot_focus","name":"Concentrated Corruption","family":"decay","requires":"passive_toxic_touch","forkAnchor":"passive_toxic_touch","forkStep":3,"forkSide":-1,"excludes":["plague_spread"],"description":"Rot stacks deal 60% more damage but are limited to three stacks."},
{"id":"vitality_recovery","name":"Recovery","family":"vitality","requires":"passive_strong_heart","forkAnchor":"passive_strong_heart","forkStep":4,"forkSide":-1,"excludes":["vitality_reserve"],"description":"Regeneration heals 25% more; maximum Health is reduced by 10%."},
{"id":"vitality_reserve","name":"Endurance","family":"vitality","requires":"passive_strong_heart","forkAnchor":"passive_strong_heart","forkStep":3,"forkSide":1,"excludes":["vitality_recovery"],"description":"Gain 20% maximum Health; regeneration heals 25% less."},
{"id":"aegis_bulwark","name":"Bulwark","family":"aegis","requires":"passive_fortified","forkAnchor":"passive_fortified","forkStep":4,"forkSide":-1,"excludes":["aegis_reprisal"],"description":"Gain 18% Defense; direct attacks deal 10% less damage."},
{"id":"aegis_reprisal","name":"Reprisal","family":"aegis","requires":"passive_fortified","forkAnchor":"passive_fortified","forkStep":3,"forkSide":1,"excludes":["aegis_bulwark"],"description":"Blocking empowers your next hit by 25% base damage (3s cooldown); gain 10% less Defense."},
{"id":"fury_momentum","name":"Momentum","family":"fury","requires":"passive_quick_hands","forkAnchor":"passive_quick_hands","forkStep":4,"forkSide":-1,"excludes":["single_target_mastery"],"description":"Kills grant 15% attack speed for four seconds; cannot combine with Focused Assault."},
{"id":"fire_focus","name":"Smoldering Heart","family":"magic","requires":"passive_kindling","forkAnchor":"passive_kindling","forkStep":3,"forkSide":-1,"excludes":["fire_spread"],"description":"Burn deals 35% more damage; direct spells deal 10% less. Cannot combine with Wildfire."},
{"id":"frost_focus","name":"Biting Cold","family":"magic","requires":"passive_deep_winter","forkAnchor":"passive_deep_winter","forkStep":3,"forkSide":-1,"excludes":["frost_spread"],"description":"Deal 20% more direct spell damage to your chilled target. Cannot combine with Winter Field."},
{"id":"lightning_focus","name":"Focused Discharge","family":"magic","requires":"passive_arcane_focus","forkAnchor":"passive_arcane_focus","forkStep":3,"forkSide":-1,"excludes":["storm_mastery"],"description":"Lightning direct spells deal 35% more damage but no longer chain."}
].map(Object.freeze));
// Intentional routes: the first rank opens the next ability; optional ranks stay on a side branch.
const ROUTES={blood:[['bleeding_edge','deep_cuts','executioner'],['blood_drinker'],['sanguine_fury']],decay:[['toxic_touch','virulent_rot','blight'],['wasting_curse'],['wither']],vitality:[['strong_heart','life_bloom'],['renewal'],['second_breath','last_stand']],aegis:[['iron_skin','fortified'],['guarded_block','retaliation'],['barrier_pulse']],fury:[['quick_hands','adrenaline'],['precision','brutal_crit'],['double_strike']],magic:[['arcane_focus','arcane_echo'],['mana_spring','elemental_force'],['efficient_cast']]};
const CHOICES=[['deep_cuts','str','blood_style','blood_focus','blood_transfer'],['toxic_touch','agi','plague','rot_focus','plague_spread'],['strong_heart','end','vitality_style','vitality_recovery','vitality_reserve'],['fortified','end','aegis_style','aegis_bulwark','aegis_reprisal'],['quick_hands','agi','focus','single_target_mastery','fury_momentum'],['kindling','int','fire','fire_focus','fire_spread'],['deep_winter','int','frost','frost_focus','frost_spread'],['overcharge','int','storm','lightning_focus','storm_mastery']];
const ATTRIBUTES=Object.freeze(['str','agi','int','end','cha']);
const OLD_ROOTS={blood:'might',decay:'might',vitality:'vitality',aegis:'vitality',fury:'haste',magic:'haste'};
const POINT_XP=100,MAX_POINTS=100,ROOTS={blood:'might',decay:'haste',vitality:'vitality',aegis:'vitality',fury:'haste',magic:'haste'};
const AFFINITY_BONUSES={blood:{description:'Your attacks can inflict Bleed: 42% chance, dealing 16% of hit damage per tick (0.9s cooldown).'},decay:{description:'Your attacks can inflict Rot: 42% chance, dealing 6.5% of hit damage per tick (1.3s cooldown).'},vitality:{health:.10,description:'Increase maximum Health by 10%.'},aegis:{description:'Gain Barrier equal to 5% of maximum Health at the start of each encounter.'},fury:{speed:.08,description:'Increase attack speed by 8%.'},magic:{spell:.08,description:'Increase Spell Power by 8% and unlock the three elemental paths.'}};
const STATS={blood:'str',decay:'agi',vitality:'end',aegis:'end',fury:'agi',magic:'int'},LABELS={str:'Strength',agi:'Agility',end:'Endurance',int:'Intellect'};
let cachedCatalog=null,cachedNodes=CORE;
function nodes(){
 const catalogue=root.WandererV012Buildcraft?.CATALOG;if(!catalogue)return CORE;
 if(catalogue!==cachedCatalog){cachedCatalog=catalogue;const branches=[];
 for(const family of Object.keys(ROOTS)){
  const affinity='affinity_'+family,lanes=[affinity,affinity,affinity],oldLanes=[ROOTS[family],ROOTS[family],ROOTS[family]];let previous=ROOTS[family],index=0,normalIndex=0;
  branches.push(Object.freeze({id:affinity,family,affinity:family,name:'Choose '+family[0].toUpperCase()+family.slice(1),...AFFINITY_BONUSES[family],requires:ROOTS[family]}));
  if(family==='magic')for(const element of ['fire','frost','lightning'])branches.push(Object.freeze({id:'element_'+element,family,elementBranch:element,name:element[0].toUpperCase()+element.slice(1)+' Path',description:'Unlock '+element+' talents. Select your active element above.',requires:affinity}));
  for(const p of catalogue.filter(x=>x.family===family)){
   const base='passive_'+p.id,other=(p.requires||[]).find(f=>f!==family),hybrid=!!other,oldLane=index%3,lane=normalIndex%3,oldBranch=oldLanes[oldLane],oldPrevious=previous;
   const branchLane=p.element?['fire','frost','lightning'].indexOf(p.element):ROUTES[family].findIndex(route=>route.includes(p.id)),branchDepth=p.element?2:ROUTES[family][branchLane]?.indexOf(p.id)||0,route=ROUTES[family][branchLane],oldParent=hybrid?affinity:p.element?'element_'+p.element:lanes[lane];
   let parent=hybrid?affinity:p.element?'element_'+p.element:branchDepth?'passive_'+route[branchDepth-1]:affinity;
   for(let i=1;i<=2;i++){const id='path_'+p.id+'_'+i,stat=STATS[family];branches.push(Object.freeze({id,family,pathFor:p.id,pathStep:i,pathLane:lane,branchLane,branchDepth,...(hybrid?{hybridFor:p.id}:{}),name:LABELS[stat],description:'+1 '+LABELS[stat]+'.',attribute:stat,requires:parent,...(i===1?{legacyRequires:oldPrevious,legacyBranchRequires:oldBranch,legacyV5Requires:oldParent,legacyV4Requires:hybrid?affinity:lanes[lane]}:{})}));parent=id;}
   let bridge=null;if(hybrid){bridge='affinity_'+other;for(let i=1;i<=2;i++){const id='bridge_'+p.id+'_'+i,stat=STATS[other];branches.push(Object.freeze({id,family:other,hybridFor:p.id,bridgeStep:i,name:LABELS[stat],description:'+1 '+LABELS[stat]+'.',attribute:stat,requires:bridge}));bridge=id;}}
   const starterUpgrade=['bleeding_edge','toxic_touch'].includes(p.id),ranks=starterUpgrade?p.max-1:p.max;
   for(let i=0;i<ranks;i++){const rank=i+1,id=rank===1?base:base+'_rank'+rank,required=rank===1?[parent,...(bridge?[bridge]:[])]:[rank===2?base:base+'_rank'+(rank-1)];branches.push(Object.freeze({id,passiveId:p.id,rank,maxRank:ranks,family,branchLane,branchDepth,...(hybrid?{hybridFor:p.id,hybridOther:other}:{}),name:starterUpgrade?'Improve '+p.name:p.name,description:starterUpgrade?'Improve the application chance granted by your affinity by 4 percentage points per rank.':p.description,prerequisites:required}));}
   previous=base;oldLanes[oldLane]=base;index++;if(!hybrid){lanes[lane]=base;normalIndex++;}
  }
 }
 const forks=FORKS.map(node=>({...node}));
 for(const [anchor,stat,prefix,first,second]of CHOICES){
  const a='passive_'+anchor,family=catalogue.find(p=>p.id===anchor).family;
  for(let step=1;step<=2;step++){
   const id='fork_'+prefix+'_'+stat+'_'+step,requires=step===1?a:'fork_'+prefix+'_'+stat+'_1';let n=forks.find(n=>n.id===id);
   if(n){n.legacyRequires=n.requires;n.requires=requires;n.forkAnchor=a;}else forks.push({id,name:LABELS[stat],description:'+1 '+LABELS[stat]+'.',attribute:stat,family,requires,forkAnchor:a,forkStep:step});
  }
  for(const [id,side]of [[first,-1],[second,1]]){const n=forks.find(n=>n.id===id);n.legacyRequires=n.requires;n.requires='fork_'+prefix+'_'+stat+'_2';n.forkAnchor=a;n.forkStep=3;n.forkSide=side;}
 }
 cachedNodes=Object.freeze([...CORE,...branches,...forks.map(Object.freeze)]);}return cachedNodes;
}
function cap(v){return v.treeVersion>=4?Math.max(MAX_POINTS,v.legacyTalentCap||0):Math.max(MAX_POINTS,v.nodes.length);}

function requirements(node){return node.prerequisites||[node.requires].filter(Boolean);}
function valid(v){
 if(!v||!Number.isSafeInteger(v.xp)||v.xp<0||v.xp>Number.MAX_SAFE_INTEGER||!Array.isArray(v.nodes)||new Set(v.nodes).size!==v.nodes.length)return false;
 if(v.starterPoints!==undefined&&v.starterPoints!==2)return false;
 if(v.element!==undefined&&!['fire','frost','lightning'].includes(v.element))return false;
 const attrs=v.attributes??{};if(!attrs||typeof attrs!=='object'||Array.isArray(attrs)||Object.keys(attrs).some(k=>!ATTRIBUTES.includes(k)||!Number.isSafeInteger(attrs[k])||attrs[k]<0)||Object.values(attrs).reduce((a,b)=>a+b,0)>Math.floor(v.xp/POINT_XP))return false;
 const list=nodes();if(v.legacyTalentCap!==undefined&&(!Number.isSafeInteger(v.legacyTalentCap)||v.legacyTalentCap<MAX_POINTS||v.legacyTalentCap>list.length))return false;const points=Math.min(cap(v),Math.floor(v.xp/POINT_XP)+(v.starterPoints||0));
 return v.nodes.length<=points&&v.nodes.every(id=>{const node=list.find(n=>n.id===id);if(!node||node.excludes?.some(id=>v.nodes.includes(id)))return false;if(requirements(node).every(required=>v.nodes.includes(required)))return true;if(v.treeVersion===5&&node.pathStep===1&&node.legacyV5Requires&&v.nodes.includes(node.legacyV5Requires))return true;if(v.treeVersion!==6&&node.forkAnchor&&node.legacyRequires&&v.nodes.includes(node.legacyRequires))return true;if(v.treeVersion===4&&node.pathStep===1&&node.legacyV4Requires&&v.nodes.includes(node.legacyV4Requires))return true;if(v.treeVersion!==4&&v.treeVersion!==5&&v.treeVersion!==6&&node.pathStep===1&&((node.legacyBranchRequires&&v.nodes.includes(node.legacyBranchRequires))||(v.treeVersion!==3&&node.legacyRequires&&v.nodes.includes(node.legacyRequires))))return true;if(v.treeVersion!==4&&v.treeVersion!==5&&v.treeVersion!==6&&node.hybridFor&&node.rank===1&&v.nodes.includes('path_'+node.passiveId+'_2')&&v.nodes.includes(ROOTS[node.hybridOther]))return true;if(v.treeVersion!==2&&v.treeVersion!==3&&v.treeVersion!==4&&v.treeVersion!==5&&v.treeVersion!==6&&node.passiveId){const p=root.WandererV012Buildcraft.CATALOG.find(p=>p.id===node.passiveId),old=node.rank===1?[...new Set((p.requires.length?p.requires:[p.family]).map(f=>OLD_ROOTS[f]))]:[node.rank===2?'passive_'+p.id:'passive_'+p.id+'_rank'+(node.rank-1)];return old.every(required=>v.nodes.includes(required));}return false;});
}
function create(){return {xp:0,nodes:[],treeVersion:6};}
function earned(v){if(!valid(v))throw Error('Invalid talent progress');return Math.min(cap(v),Math.floor(v.xp/POINT_XP)+(v.starterPoints||0));}
function award(v,amount){if(!valid(v)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid experience award');return {...v,xp:Math.min(Number.MAX_SAFE_INTEGER,v.xp+amount),nodes:[...v.nodes]};}
function allocate(v,id){if(!valid(v))throw Error('Invalid talent progress');const node=nodes().find(n=>n.id===id);if(!node||node.excludes?.some(id=>v.nodes.includes(id))||v.nodes.includes(id)||v.nodes.length>=earned(v)||requirements(node).some(required=>!v.nodes.includes(required)))return null;return {...v,nodes:[...v.nodes,id]};}
function reset(v){if(!valid(v))throw Error('Invalid talent progress');return {...v,nodes:[],treeVersion:6,...(cap(v)>MAX_POINTS?{legacyTalentCap:cap(v)}:{})};}
function path(v,id){if(!valid(v))throw Error('Invalid talent progress');const list=nodes(),route=[],seen=new Set(v.nodes),visiting=new Set();function visit(key){if(seen.has(key))return true;const n=list.find(n=>n.id===key);if(!n||visiting.has(key)||n.excludes?.some(x=>v.nodes.includes(x)))return false;visiting.add(key);for(const required of requirements(n))if(!visit(required))return false;visiting.delete(key);seen.add(key);route.push(key);return true;}return visit(id)?route:null;}
function attributePoints(v){if(!valid(v))throw Error('Invalid talent progress');const spent=Object.values(v.attributes||{}).reduce((a,b)=>a+b,0);return Math.min(Math.floor(v.xp/POINT_XP),Math.max(MAX_POINTS,spent))-spent;}
function allocateAttribute(v,key){if(!valid(v))throw Error('Invalid talent progress');if(!ATTRIBUTES.includes(key)||attributePoints(v)<1)return null;return {...v,attributes:{...v.attributes,[key]:(v.attributes?.[key]||0)+1}};}
function passiveIds(v){if(!valid(v))throw Error('Invalid talent progress');const byId=new Map(nodes().filter(n=>n.passiveId).map(n=>[n.id,n.passiveId]));const ids=v.nodes.filter(id=>byId.has(id)).map(id=>byId.get(id));for(const [family,id] of [['blood','bleeding_edge'],['decay','toxic_touch']])if(v.nodes.includes('affinity_'+family))ids.push(id);return ids;}
function attributeBonuses(v){if(!v)return {};if(!valid(v))throw Error('Invalid talent progress');const out={};for(const id of v.nodes){const node=nodes().find(n=>n.id===id);if(node?.attribute)out[node.attribute]=(out[node.attribute]||0)+1;}return out;}
function apply(stats,v){if(!v)return stats;if(!valid(v))throw Error('Invalid talent progress');const bonuses={attack:0,spell:0,health:0,defense:0,crit:0,speed:0,mana:0};for(const id of v.nodes){const node=nodes().find(n=>n.id===id);for(const key of Object.keys(bonuses))bonuses[key]+=node[key]||0;}
 stats.attack=Math.round(stats.attack*(1+bonuses.attack));stats.spellPower=Math.round(stats.spellPower*(1+bonuses.spell));stats.maxhp=Math.round(stats.maxhp*(1+bonuses.health));stats.defense=Math.round(stats.defense*(1+bonuses.defense));stats.crit=Math.min(55,stats.crit+bonuses.crit);stats.attacksPerSec=Math.min(4.2,stats.attacksPerSec*(1+bonuses.speed));stats.mana=Math.round(stats.mana*(1+bonuses.mana));stats.manaRegen=+(stats.manaRegen*(1+bonuses.mana)).toFixed(1);
 if(v.nodes.includes('vitality_reserve'))stats.maxhp=Math.round(stats.maxhp*1.2);
 if(v.nodes.includes('vitality_recovery'))stats.maxhp=Math.round(stats.maxhp*.9);
 if(v.nodes.includes('aegis_bulwark'))stats.defense=Math.round(stats.defense*1.18);
 if(v.nodes.includes('aegis_reprisal'))stats.defense=Math.round(stats.defense*.9);
 stats.power=Math.round(stats.attack*2+stats.defense*4+stats.maxhp*.15+stats.attacksPerSec*35+stats.crit*1.2+stats.blockChance*2+(stats.caster?stats.spellPower*1.7:0)+(stats.synergyPower||0));return stats;}
root.WandererAutomaticTalents=Object.freeze({get NODES(){return nodes();},MAX_POINTS,cap,POINT_XP,ATTRIBUTES,create,valid,earned,award,allocate,reset,path,attributePoints,allocateAttribute,passiveIds,attributeBonuses,apply});
})(globalThis);
