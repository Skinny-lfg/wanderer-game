// New talent graph, staged independently until runtime and save integration are complete.
(function(root){'use strict';
const FAMILIES=['blood','fury','aegis','vitality','magic','decay'];
const BASICS={blood:['bleeding_edge','deep_cuts','executioner','blood_drinker','sanguine_fury','open_wound'],fury:['quick_hands','precision','brutal_crit','double_strike','adrenaline','relentless'],aegis:['iron_skin','fortified','retaliation','guarded_block','barrier_pulse','brace'],vitality:['strong_heart','renewal','last_stand','second_breath','life_bloom','second_pulse'],magic:['arcane_focus','mana_spring','efficient_cast','arcane_echo','elemental_force','spell_echo'],decay:['toxic_touch','virulent_rot','blight','wasting_curse','wither','incubation']};
const FOCUSED={blood:['blood_harvest','crimson_feast','heart_of_carnage'],fury:['battle_tempo','relentless_assault','unchained_fury'],aegis:['steadfast_guard','stored_force','unbreakable'],vitality:['living_recovery','overflowing_life','heart_of_the_wild'],magic:['arcane_resonance','arcane_surge','arcane_mastery'],decay:['lingering_rot','corruption_cycle','plagueheart']};
const MIXED=[['blood','fury','crimson_rush','reapers_cadence','red_guillotine'],['fury','aegis','counterstrike','iron_reversal','turn_tide'],['aegis','vitality','sanctuary','guardians_oath','last_bastion'],['vitality','magic','life_conduit','lifeweave','lifeweaver'],['magic','decay','hex_bolt','elemental_blight','grave_bloom'],['decay','blood','plague_rupture','carrion_detonation','septic_wound']];
const ELEMENTS={fire:['kindling','kindling_flame','combustion','living_inferno'],frost:['deep_winter','deep_chill','shatter','absolute_winter'],lightning:['overcharge','static_charge','chain_discharge','storm_conductor']};
const STATS={blood:['flatAttack',2,'Attack Power'],fury:['flatAvoid',2,'Evasion'],aegis:['flatArmor',2,'Armor'],vitality:['flatLife',5,'Health'],magic:['flatSpell',2,'Spell Power'],decay:['flatRegen',0.25,'Mana Regeneration']};
const ARCANE={arcane_resonance:{name:'Arcane Resonance',description:'Increase Spell Power by 5%.',spell:.05},arcane_surge:{name:'Arcane Surge',description:'Increase Spell Power by 8%.',spell:.08},arcane_mastery:{name:'Arcane Mastery',description:'Increase Spell Power by 12%.',spell:.12}};
function createGraph(catalog,legacy=[]){
 const byPassive=new Map((catalog||[]).map(p=>[p.id,p])),byLegacy=new Map(legacy.map(n=>[n.id,n])),nodes=[];
 const add=n=>{if(nodes.some(x=>x.id===n.id))throw Error('Duplicate node '+n.id);nodes.push(Object.freeze(n));return n.id;};
 const stat=(id,family,requires,extra={})=>{const [key,value,name]=STATS[family];return add({id,kind:'stat',family,name,description:'+'+value+' '+name+'.',[key]:value,requires,...extra});};
 const skill=(id,kind,family,tier,requires,extra={})=>{const p=byPassive.get(id),old=byLegacy.get(id),arcane=ARCANE[id],starter=['bleeding_edge','toxic_touch'].includes(id);return add({id,kind,family,tier,requires,maxRank:starter?p.max-1:(p?.max||old?.maxRank||1),name:arcane?.name||p?.name||old?.name||id.split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join(' '),description:starter?'Improve the application chance granted by your affinity by 4 percentage points per rank.':arcane?.description||p?.description||old?.description||'',...(arcane?{spell:arcane.spell}:p?{passiveId:id}:{effectId:id}),...(old?.icon?{icon:old.icon}:{}),...(old?.advanced?{advanced:true}:{}),...extra});};
 for(const family of FAMILIES){
  const root=stat('root_'+family,family,null);add({id:'affinity_'+family,kind:'affinity',family,name:family,requires:root});
  for(let lane=0;lane<2;lane++){let parent='affinity_'+family;for(let tier=1;tier<=3;tier++){parent=stat(`basic_path_${family}_${lane}_${tier}`,family,parent,{lane,tier});parent=skill(BASICS[family][lane*3+tier-1],'basic',family,tier,parent,{lane});}}
  let parent='affinity_'+family;for(let tier=1;tier<=3;tier++){
   // From the second layer, either lateral branch can also lead toward the
   // next central passive. The first layer starts at the affinity as before.
   const middle=tier===1?stat(`focus_path_${family}_${tier}`,family,parent,{tier}):stat(`focus_path_${family}_${tier}`,family,null,{tier,anyRequires:[parent,`focus_branch_${family}_0_${tier-1}`,`focus_branch_${family}_1_${tier-1}`]});
   const sides=[0,1].map(lane=>stat(`focus_branch_${family}_${lane}_${tier}`,family,`basic_path_${family}_${lane}_${tier}`,{lane,tier}));
   parent=skill(FOCUSED[family][tier-1],'focused',family,tier,null,{anyRequires:[middle,...sides]});
  }
 }
 for(const [first,second,...abilities] of MIXED){let previous=null;for(let tier=1;tier<=3;tier++){
  const sides=[first,second].map((family,side)=>{const base=tier===1?'affinity_'+family:`mixed_path_${first}_${second}_${family}_${tier-1}`;const alternative=BASICS[family][(side?0:3)+tier-1];return stat(`mixed_path_${first}_${second}_${family}_${tier}`,family,null,{tier,anyRequires:[base,...(previous?[previous]:[]),alternative],pair:[first,second]});});
  const required=previous?[...sides,previous]:sides;previous=skill(abilities[tier-1],'mixed',first,tier,null,{pair:[first,second],prerequisites:required});
 }}
 // Elemental specializations have their own paths, separate from the Magic focused axis.
 for(const [element,ids] of Object.entries(ELEMENTS)){let parent='affinity_magic';for(let tier=1;tier<=ids.length;tier++){const id=ids[tier-1];if(nodes.some(n=>n.id===id))continue;
  if(tier===1){const alternatives={fire:'basic_path_magic_0_1',frost:'focus_path_magic_1',lightning:'basic_path_magic_1_1'};parent=stat(`element_junction_${element}`,'magic',null,{element,tier,anyRequires:[parent,alternatives[element]]});}
  parent=stat(`element_path_${element}_${tier}`,'magic',parent,{element,tier});parent=skill(id,'element','magic',tier,parent,{element});}}
 const ids=new Set(nodes.map(n=>n.id));for(const n of nodes)for(const id of [...(n.requires?[n.requires]:[]),...(n.prerequisites||[]),...(n.anyRequires||[])])if(!ids.has(id))throw Error('Missing prerequisite '+id);
 return Object.freeze(nodes);
}
function requirements(n,ranks){return (!n.requires||ranks[n.requires]>0)&&(!n.prerequisites||n.prerequisites.every(id=>ranks[id]>0))&&(!n.anyRequires||n.anyRequires.some(id=>ranks[id]>0));}
function valid(graph,progress){if(!progress||!Number.isSafeInteger(progress.points)||progress.points<0||!progress.ranks||typeof progress.ranks!=='object'||Array.isArray(progress.ranks))return false;const ranks=progress.ranks,byId=new Map(graph.map(n=>[n.id,n]));let spent=0;for(const [id,rank] of Object.entries(ranks)){const n=byId.get(id);if(!n||!Number.isSafeInteger(rank)||rank<1||rank>(n.maxRank||1)||!requirements(n,ranks))return false;spent+=rank;}return spent<=progress.points;}
function allocate(graph,progress,id){if(!valid(graph,progress))return null;const n=graph.find(x=>x.id===id),ranks=progress.ranks;if(!n||(ranks[id]||0)>=(n.maxRank||1)||Object.values(ranks).reduce((a,b)=>a+b,0)>=progress.points||!requirements(n,ranks))return null;return {...progress,ranks:{...ranks,[id]:(ranks[id]||0)+1}};}
root.WandererTalentGraph=Object.freeze({FAMILIES,BASICS,FOCUSED,MIXED,ELEMENTS,createGraph,requirements,valid,allocate});
})(globalThis);
