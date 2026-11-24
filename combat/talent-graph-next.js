// New talent graph, staged independently until runtime and save integration are complete.
(function(root){'use strict';
const FAMILIES=['blood','fury','vitality','aegis','magic','decay'];
const BASICS={blood:['bleeding_edge','deep_cuts','executioner','blood_drinker','sanguine_fury','blood_transfer'],fury:['quick_hands','precision','brutal_crit','double_strike','adrenaline','relentless'],aegis:['guarded_block','barrier_pulse','brace','iron_skin','fortified','retaliation'],vitality:['strong_heart','renewal','last_stand','second_breath','life_bloom','second_pulse'],magic:['arcane_focus','mana_spring','efficient_cast','arcane_echo','elemental_force','spell_echo'],decay:['toxic_touch','virulent_rot','blight','wasting_curse','wither','incubation']};
const FOCUSED={blood:['blood_harvest','crimson_feast','heart_of_carnage'],fury:['battle_tempo','relentless_assault','unchained_fury'],aegis:['steadfast_guard','stored_force','unbreakable'],vitality:['living_recovery','overflowing_life','heart_of_the_wild'],magic:['arcane_resonance','arcane_surge','arcane_mastery'],decay:['lingering_rot','corruption_cycle','plagueheart']};
const MIXED=[['blood','fury','crimson_rush','reapers_cadence','red_guillotine'],['fury','vitality','fervent_life','redline','fury_recovery'],['vitality','aegis','sanctuary','guardians_oath','last_bastion'],['aegis','magic','runic_shield','prismatic_rebound','arcane_bastion'],['magic','decay','hex_bolt','elemental_blight','grave_bloom'],['decay','blood','plague_spread','carrion_detonation','septic_wound']];
const ELEMENTS={fire:['kindling','fire_spread','combustion'],frost:['deep_winter','frost_spread','shatter'],lightning:['overcharge','storm_mastery','chain_discharge']};
const NEW_MIXED={fury_recovery:{name:'Fury Recovery',icon:'❤',description:'Prepared: once per encounter, attacking below 35% Health restores 8% maximum Health and grants 12% attack speed for 4 seconds.'},arcane_bastion:{name:'Arcane Bastion',icon:'⛨',description:'Prepared: absorbing damage with Barrier charges the next funded cast or Arcane Infusion hit to deal 30% Spell Power and grant Barrier equal to 3% Max HP + 6% Spell Power (6s cooldown).'}};
const STAT_NAMES={pctAttack:'Attack Power',pctArmor:'Defense',pctLife:'Maximum HP',pctSpell:'Spell Power',pctSpeed:'Attack Speed',pctMana:'Maximum Mana',pctRegen:'Mana Regeneration',critChance:'Critical Chance',flatAvoid:'Evasion Rating',guardChance:'Guard Chance',barrierPower:'Barrier Power',healingPower:'Healing Power',manaCostReduction:'Mana Cost Reduction',bleedBonus:'Bleed Damage',rotBonus:'Rot Damage',rotDefense:'enemy Defense reduction while Rot is active',sunderDamage:'damage against Sundered enemies',healthRegen:'Max HP regeneration per second'};
const ROOT_STAT={blood:'pctAttack',fury:'pctAttack',vitality:'pctLife',aegis:'pctArmor',magic:'pctSpell',decay:'pctAttack'};
const SKILL_STAT={
 bleeding_edge:'bleedBonus',deep_cuts:'bleedBonus',executioner:'pctAttack',blood_drinker:'healingPower',sanguine_fury:'critChance',blood_transfer:'bleedBonus',blood_harvest:'healingPower',crimson_feast:'pctSpeed',heart_of_carnage:'pctAttack',accelerated_bleeding:'bleedBonus',cleave_mastery:'pctAttack',sanguine_reserve:'healingPower',
 quick_hands:'pctSpeed',precision:'critChance',brutal_crit:'critChance',double_strike:'pctSpeed',adrenaline:'critChance',relentless:'pctSpeed',battle_tempo:'pctSpeed',relentless_assault:'sunderDamage',unchained_fury:'pctAttack',fan_of_blades:'pctSpeed',bow_pierce:'pctAttack',single_target_mastery:'pctAttack',
 strong_heart:'pctLife',renewal:'healthRegen',last_stand:'pctLife',second_breath:'pctLife',life_bloom:'healingPower',second_pulse:'healingPower',living_recovery:'healingPower',overflowing_life:'barrierPower',heart_of_the_wild:'pctLife',vital_pulse:'pctLife',living_force:'healingPower',grasping_roots:'pctLife',
 guarded_block:'guardChance',barrier_pulse:'barrierPower',brace:'pctArmor',iron_skin:'pctArmor',fortified:'pctArmor',retaliation:'barrierPower',steadfast_guard:'guardChance',stored_force:'guardChance',unbreakable:'barrierPower',ward_echo:'pctArmor',sword_sweep:'pctAttack',mace_shockwave:'pctAttack',
 arcane_focus:'pctSpell',mana_spring:'pctRegen',efficient_cast:'manaCostReduction',arcane_echo:'pctSpell',elemental_force:'pctSpell',spell_echo:'pctSpell',arcane_resonance:'pctSpell',arcane_surge:'pctRegen',arcane_mastery:'pctSpell',arcane_nova:'pctSpell',mana_convergence:'pctMana',kindling:'pctSpell',fire_spread:'pctSpell',combustion:'pctSpell',controlled_burn:'pctSpell',cinder_focus:'pctSpell',deep_winter:'pctSpell',frost_spread:'pctSpell',shatter:'pctSpell',frost_resonance:'pctSpell',glacial_echo:'pctSpell',overcharge:'pctSpell',storm_mastery:'pctSpell',chain_discharge:'pctSpell',static_focus:'pctSpell',storm_conductor:'pctSpell',
 toxic_touch:'rotBonus',virulent_rot:'rotBonus',blight:'pctSpell',wasting_curse:'rotDefense',wither:'rotBonus',incubation:'rotBonus',lingering_rot:'rotBonus',corruption_cycle:'pctSpell',plagueheart:'rotBonus',contagious_touch:'rotBonus',corruption_nova:'rotBonus',soul_drain:'manaCostReduction',
 crimson_rush:'critChance',reapers_cadence:'sunderDamage',red_guillotine:'bleedBonus',fervent_life:'critChance',redline:'pctAttack',fury_recovery:'pctLife',sanctuary:'barrierPower',guardians_oath:'healingPower',last_bastion:'barrierPower',runic_shield:'pctSpell',prismatic_rebound:'barrierPower',arcane_bastion:'pctSpell',hex_bolt:'pctSpell',elemental_blight:'pctSpell',grave_bloom:'pctSpell',plague_spread:'rotBonus',carrion_detonation:'pctAttack',septic_wound:'rotBonus'
};
const LANES={
 blood:[['pctAttack','bleedBonus','pctAttack'],['healingPower','critChance','pctSpeed']],
 fury:[['pctSpeed','critChance','critChance'],['pctSpeed','critChance','sunderDamage']],
 vitality:[['pctLife','healthRegen','pctLife'],['healingPower','healingPower','healthRegen']],
 aegis:[['guardChance','barrierPower','pctArmor'],['pctArmor','pctLife','guardChance']],
 magic:[['pctSpell','pctRegen','manaCostReduction'],['pctSpell','pctSpell','pctMana']],
 decay:[['pctAttack','rotBonus','pctSpell'],['flatAvoid','pctRegen','flatAvoid']]
};
const FOCUS_STAT={
 blood:[['bleedBonus','healingPower','critChance'],['pctSpeed','critChance','pctAttack']],
 fury:[['sunderDamage','flatAvoid','flatAvoid'],['critChance','pctAttack','sunderDamage']],
 vitality:[['healthRegen','pctLife','healingPower'],['healingPower','pctArmor','barrierPower']],
 aegis:[['guardChance','pctArmor','barrierPower'],['pctLife','pctSpell','guardChance']],
 magic:[['pctSpell','pctRegen','manaCostReduction'],['pctMana','critChance','pctSpell']],
 decay:[['pctAttack','rotDefense','rotDefense'],['pctSpell','manaCostReduction','pctSpell']]
};
const OUTER_STAT={
 blood:{'-1':['pctAttack','bleedBonus'],'1':['critChance','pctSpeed']},
 fury:{'-1':['critChance','pctAttack'],'1':['pctSpeed','flatAvoid']},
 vitality:{'-1':['healingPower','pctLife'],'1':['pctLife','barrierPower']},
 aegis:{'-1':['pctLife','guardChance'],'1':['pctSpell','barrierPower']},
 magic:{'-1':['pctSpell','barrierPower'],'1':['critChance','pctRegen']},
 decay:{'-1':['pctSpell','pctMana'],'1':['pctAttack','rotBonus']}
};
// Per-node values by layer; primary attributes remain rare +1 choices.
const STAT_LAYERS={pctSpeed:[.01,.015,.02],critChance:[2,3,4],pctAttack:[.02,.03,.04],pctArmor:[.02,.03,.04],pctLife:[.02,.03,.04],flatAvoid:[2,3,4],pctSpell:[.02,.03,.04],pctRegen:[.01,.015,.02],pctMana:[.02,.03,.04],guardChance:[1,1.5,2],barrierPower:[.02,.03,.04],healingPower:[.01,.015,.02],manaCostReduction:[.01,.015,.02],bleedBonus:[.02,.025,.03],rotBonus:[.02,.025,.03],rotDefense:[.02,.025,.03],sunderDamage:[.02,.025,.03],healthRegen:[.0005,.00075,.001]};
const AFFINITY={blood:{description:'Attacks have a 42% chance to inflict Bleed. Bleed damage scales with the attack hit before critical damage (0.9s between primary applications). Secondary weapon hits have half chance and potency, with separate per-target cooldowns.'},fury:{description:'Direct attacks have a 15% chance to apply Sunder, reducing enemy base Defense by 4% per application, up to 20% from Fury (1s cooldown per enemy).'},aegis:{description:'Gain 5% Max HP + 8% Spell Power as Barrier at each encounter start. Barrier from Aegis, Orb and other sources stacks freely; remaining Barrier disappears after every encounter.'},vitality:{healthRegen:.0015,description:'Regenerate 0.15% maximum Health per combat second. Your basic regeneration is capped at 0.35% maximum Health per second before Recovery/Reserve specialisations.'},magic:{spell:.08,description:'Increase Spell Power by 8%. Spend 12 Mana for Arcane Infusion: empower the next 2 main attacks (6s cooldown, 7s duration). +85% Spell Power per hit with physical weapons, +35% with Wand, +95% with Staff. Elemental attunements keep Infusion and unlock elemental casts.'},decay:{description:'Your attacks can inflict Rot by spending 1 Mana. Rot damage scales with the hit and Spell Power. Unlock Mana, Mana Regeneration and Spell Power with any weapon for dark abilities. Secondary weapon hits have half application chance and potency, with separate per-target cooldowns and normal Mana costs.'}};
const ARCANE={arcane_resonance:{name:'Arcane Resonance',description:'Increase Spell Power by 5% and maximum Mana by 3.',spell:.05,flatMana:3},arcane_surge:{name:'Arcane Surge',description:'Increase Spell Power by 8% and Mana Regeneration by 0.25 per second.',spell:.08,flatRegen:.25},arcane_mastery:{name:'Arcane Mastery',description:'Increase Spell Power by 12%. Arcane Infusion hits or paid Arcane weapon casts restore 2 Mana every 5 seconds.',spell:.12}};
const STANDALONE={corruption_cycle:'On attack against at least three Rot stacks, spend 4 Mana to consume one stack and deal its remaining damage plus 20% Spell Power (5s cooldown).',fury_momentum:'Kills grant 15% attack speed for four seconds.',relentless_assault:'Attacks against Sundered enemies deal 20% bonus damage every 3 seconds.',unchained_fury:'Every fifth consecutive attack opens a 3-second window in which attacks deal 25% bonus damage.',combustion:'Fire casts apply Burn if needed; casts against burning enemies deal 20% Spell Power bonus damage every 4 seconds.',living_inferno:'Fire casts apply Burn if needed and deal 25% more damage against burning enemies.',shatter:'Frost casts apply Chill if needed; casts against chilled foes deal 25% Spell Power bonus damage every 4 seconds.',absolute_winter:'Frost casts apply Chill if needed and deal 20% more damage against chilled enemies.',storm_mastery:'Funded Lightning chains bounce up to six times for 68%, 53%, 40%, 29%, 21%, 15% damage. Returning chains detonate prior Static Marks.',fire_spread:'Funded Fire casts spread Burn to two additional foes at 65% strength for up to three seconds and deal immediate splash.'};
function createGraph(catalog,definitionNodes=[]){
 const BASICS=root.WandererTalentGraph.BASICS;
 const FAMILIES=root.WandererTalentGraph.FAMILIES,MIXED=root.WandererTalentGraph.MIXED,ELEMENTS=root.WandererTalentGraph.ELEMENTS;
 const byPassive=new Map((catalog||[]).map(p=>[p.id,p])),byLegacy=new Map(definitionNodes.map(n=>[n.id,n])),nodes=[];
 const add=n=>{if(nodes.some(x=>x.id===n.id))throw Error('Duplicate node '+n.id);nodes.push(Object.freeze(n));return n.id;};
 const stat=(id,family,requires,extra={})=>add({id,kind:'stat',family,requires,...extra});
 const skill=(id,kind,family,tier,requires,extra={})=>{const p=byPassive.get(id),old=byLegacy.get(id),special=NEW_MIXED[id],arcane=ARCANE[id],starter=['bleeding_edge','toxic_touch'].includes(id),{prerequisites,anyRequires,...meta}=extra;
  const gate=stat('gate_'+id,family,requires,{gateFor:id,tier,...(prerequisites?{prerequisites}:{}),...(anyRequires?{anyRequires}:{})});
  return add({id,kind,family,tier,requires:gate,maxRank:starter?p.max-1:(p?.max||old?.maxRank||1),name:special?.name||(id==='storm_mastery'?'Storm Mastery':null)||arcane?.name||p?.name||old?.name||id.split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join(' '),description:starter?(id==='bleeding_edge'?'Increase the affinity Bleed application chance by 4 percentage points per rank. Bleed damage scales with the triggering hit before critical damage.':'Increase the affinity Rot application chance by 4 percentage points per rank. Each application costs 1 Mana and scales with the triggering hit and Spell Power.'):special?.description||STANDALONE[id]||arcane?.description||p?.description||old?.description||'',...(arcane?{spell:arcane.spell,...(arcane.flatMana?{flatMana:arcane.flatMana}:{}),...(arcane.flatRegen?{flatRegen:arcane.flatRegen}:{})}:p?{passiveId:id}:{effectId:id}),...((special?.icon||old?.icon)?{icon:special?.icon||old.icon}:{}),...((special||old?.advanced)?{advanced:true}:{}),...meta});};
 for(const family of FAMILIES){
  const root=stat('root_'+family,family,null);add({id:'affinity_'+family,kind:'affinity',family,name:family,requires:root,...AFFINITY[family]});
  // Two outer points connect the affinity to each neighbouring mixed route.
  for(const side of [-1,1]){const one=stat(`outer_${family}_${side}_1`,family,'affinity_'+family,{outerSide:side,outerStep:1});stat(`outer_${family}_${side}_2`,family,one,{outerSide:side,outerStep:2});}
  for(let lane=0;lane<2;lane++){let parent='affinity_'+family;for(let tier=1;tier<=3;tier++){
   const options=tier>1?[`focus_branch_${family}_${lane}_${tier-1}`,BASICS[family][lane*3+tier-2]]:null;
   parent=stat(`basic_path_${family}_${lane}_${tier}`,family,options?null:parent,{lane,tier,...(options?{anyRequires:options}:{})});
   skill(BASICS[family][lane*3+tier-1],'basic',family,tier,parent,{lane});
  }}
  for(let tier=1;tier<=3;tier++){
   // From the second layer, either lateral branch can also lead toward the
   // next central passive. The first layer starts at the affinity as before.
   const middle=tier===1?stat(`focus_path_${family}_${tier}`,family,null,{tier,anyRequires:[`basic_path_${family}_0_1`,`basic_path_${family}_1_1`]}):stat(`focus_path_${family}_${tier}`,family,null,{tier,anyRequires:[`focus_branch_${family}_0_${tier-1}`,`focus_branch_${family}_1_${tier-1}`,FOCUSED[family][tier-2]]});
   const sides=[0,1].map(lane=>stat(`focus_branch_${family}_${lane}_${tier}`,family,tier===1?`basic_path_${family}_${lane}_${tier}`:'gate_'+BASICS[family][lane*3+tier-1],{lane,tier}));
   skill(FOCUSED[family][tier-1],'focused',family,tier,null,{prerequisites:[middle,...sides]});
  }
 }
 for(const [first,second,...abilities] of MIXED){let previous=null;for(let tier=1;tier<=3;tier++){
  const sides=[first,second].map((family,side)=>{const base=tier===1?`outer_${family}_${side===0?1:-1}_2`:`mixed_path_${first}_${second}_${family}_${tier-1}`;const alternative=BASICS[family][(side?0:3)+tier-1];return stat(`mixed_path_${first}_${second}_${family}_${tier}`,family,null,{tier,anyRequires:[base,...(previous?[previous]:[]),alternative],pair:[first,second]});});
  previous=skill(abilities[tier-1],'mixed',first,tier,null,{pair:[first,second],prerequisites:sides,...(tier===3?{anyRequires:[abilities[0],abilities[1]]}:{})});
 }}
 // Stage 6.42: attach real v15 weapon branches to existing abilities, without
 // reviving dead v12 fork nodes. Each option has two earned nodes before the effect.
 for(const [family,id,parent] of [
  ['fury','bow_pierce','precision'],
  ['fury','fan_of_blades','double_strike'],
  ['blood','cleave_mastery','bleeding_edge'],
  ['aegis','sword_sweep','iron_skin'],
  ['aegis','mace_shockwave','barrier_pulse'],
  ['fury','single_target_mastery','quick_hands']
 ]){
  const first=stat('weapon_path_'+id+'_1',family,parent,{tier:2,weaponFork:id});
  const second=stat('weapon_path_'+id+'_2',family,first,{tier:3,weaponFork:id});
  skill(id,'weapon',family,3,second,{weaponFork:id});
 }
 // Elemental specializations have their own paths, separate from the Magic focused axis.
 for(const [element,ids] of Object.entries(ELEMENTS)){let parent='affinity_magic',previous=null;for(let tier=1;tier<=ids.length;tier++){const id=ids[tier-1];if(nodes.some(n=>n.id===id))continue;
  if(tier===1){const alternatives={fire:'basic_path_magic_0_1',frost:'focus_path_magic_1',lightning:'basic_path_magic_1_1'};parent=stat(`element_junction_${element}`,'magic',null,{element,tier,anyRequires:[parent,alternatives[element]]});}
  parent=stat(`element_path_${element}_${tier}`,'magic',previous?null:parent,{element,tier,...(previous?{anyRequires:['gate_'+previous,previous]}:{})});previous=skill(id,'element','magic',tier,parent,{element});}}
 // Rebuild Magic's centre as one shared arcane path with one selected mode.
 const oldMagic=new Map(nodes.map(n=>[n.id,n]));
 const drop=new Set(nodes.filter(n=>n.family==='magic'&&(n.element||n.kind==='focused'||n.id.startsWith('focus_branch_magic_')||n.id.startsWith('focus_path_magic_')||n.gateFor&&['focused','element'].includes(oldMagic.get(n.gateFor)?.kind))).map(n=>n.id));
 for(let i=nodes.length-1;i>=0;i--)if(drop.has(nodes[i].id))nodes.splice(i,1);
 for(let i=0;i<nodes.length;i++){const n=nodes[i];if(n.family==='magic'&&n.id.startsWith('basic_path_magic_')&&n.tier>1)nodes[i]=Object.freeze({...n,anyRequires:n.anyRequires.map(id=>drop.has(id)?'gate_'+BASICS.magic[n.lane*3+n.tier-2]:id)});}
 add({id:'element_choice',kind:'choice',family:'magic',name:'Magic Attunement',description:'All elements keep Arcane Infusion. Arcane strengthens it by +10 percentage points Spell Power per hit and reduces the cost from 12 to 10 Mana; Fire, Frost or Lightning add their own funded spells. Changing mode refunds mode-specific skills.',requires:'affinity_magic'});
 const modes={arcane:['arcane_resonance','arcane_surge','arcane_mastery'],...ELEMENTS};
 for(let tier=1;tier<=3;tier++)for(const lane of [0,1]){const previous=tier===1?'element_choice':'magic_bridge_'+lane+'_'+tier;stat('magic_side_'+lane+'_'+tier,'magic',null,{lane,tier,magicShared:true,anyRequires:[previous,tier===1?'basic_path_magic_'+lane+'_1':'gate_'+BASICS.magic[lane*3+tier-1]]});if(tier>1)stat('magic_bridge_'+lane+'_'+tier,'magic','magic_side_'+lane+'_'+(tier-1),{lane,tier,magicShared:true});}
 for(const [mode,skills] of Object.entries(modes))for(let i=0;i<skills.length;i++){const id=skills[i],oldNode=oldMagic.get(id),gate='gate_'+id,tier=i+1,prior=i===2?skills.slice(0,2):null;stat(gate,'magic',null,{gateFor:id,tier,element:mode,prerequisites:['element_choice','magic_side_0_'+tier,'magic_side_1_'+tier],...(prior?{anyRequires:prior,elementPrevious:true}:{})});add(Object.freeze({...oldNode,id,kind:'element',family:'magic',element:mode,tier,requires:gate,maxRank:oldNode?.maxRank||1}));}
 {
  for(let i=nodes.length-1;i>=0;i--){const n=nodes[i];if(n.id.startsWith('focus_path_')){nodes.splice(i,1);continue;}if(n.id.startsWith('basic_path_')&&n.tier===2){nodes[i]=Object.freeze({...n,requires:BASICS[n.family][n.lane*3],anyRequires:undefined});continue;}if(n.gateFor){const family=FAMILIES.find(f=>f!=='magic'&&FOCUSED[f].includes(n.gateFor));if(family){const tier=FOCUSED[family].indexOf(n.gateFor)+1;nodes[i]=Object.freeze({...n,prerequisites:(n.prerequisites||[]).filter(id=>!id.startsWith('focus_path_')),...(tier===3?{anyRequires:FOCUSED[family].slice(0,2),focusChoice:true}:{})});}}}
  for(const family of FAMILIES.filter(f=>f!=='magic'))for(const lane of [0,1])for(const tier of [2,3]){const id='focus_branch_'+family+'_'+lane+'_'+tier,idx=nodes.findIndex(n=>n.id===id),n=nodes[idx],bridge='focus_bridge_'+family+'_'+lane+'_'+tier;nodes[idx]=Object.freeze({...n,requires:null,anyRequires:[bridge,n.requires]});stat(bridge,family,'focus_branch_'+family+'_'+lane+'_'+(tier-1),{lane,tier,focusBridge:true});}
 }
 {
  for(const family of FAMILIES)for(const lane of [0,1]){const path='basic_path_'+family+'_'+lane+'_3',idx=nodes.findIndex(n=>n.id===path),n=nodes[idx],first=BASICS[family][lane*3],second=BASICS[family][lane*3+1],side=family==='magic'?'magic_side_'+lane+'_2':'focus_branch_'+family+'_'+lane+'_2',detour='basic_detour_'+family+'_'+lane;stat(detour,family,'gate_'+second,{lane,tier:3,basicDetour:true,prerequisites:[side]});nodes[idx]=Object.freeze({...n,anyRequires:[second,detour]});}
 }

 // Stage 6.47D.5: actual v15 structural expansion. Unimplemented paths are
 // explicit locked candidates; the runtime must not accept their points.
 const NORMAL_SLOTS={"blood":["accelerated_bleeding","cleave_mastery","sanguine_reserve"],"fury":["fan_of_blades","bow_pierce","single_target_mastery"],"vitality":["vital_pulse","living_force","grasping_roots"],"aegis":["ward_echo","sword_sweep","mace_shockwave"],"decay":["contagious_touch","corruption_nova","soul_drain"]},ADAPTIVE_SLOTS={"arcane":["arcane_nova","mana_convergence"],"fire":["controlled_burn","cinder_focus"],"frost":["frost_resonance","glacial_echo"],"lightning":["static_focus","storm_conductor"]},DESIGN={"accelerated_bleeding":"Original primary Bleed stacks tick every 0.75s instead of 1s, retaining their damage and tick count. Spread and transferred stacks retain normal cadence.","sanguine_reserve":"Store 25% effective healing up to 5% Max HP per encounter. At full reserve, a physical main attack against an isolated bleeding foe releases up to one original Bleed tick, capped by the reserve and enemy class (4s cooldown).","vital_pulse":"Every 4 seconds, deal damage equal to 2% Max HP to up to four living active enemies; class caps apply.","living_force":"Store 20% effective healing up to 5% Max HP per encounter. Release that charge on the next main attack (4s cooldown; enemy class caps).","grasping_roots":"Every 8 seconds, deal 1.5% Max HP damage to up to four active enemies. Normal enemies have 15% longer attack intervals for 2s; no leader slow or stacking with stronger Chill.","ward_echo":"Every 4 seconds while Barrier exists, deal 1% Max HP + 15% Defense damage to up to four active enemies. Does not scale with current Barrier; class caps apply.","contagious_touch":"Every third paid primary Toxic Touch application spreads one stack at half potency (up to 3 ticks) to two living active enemies. Global 4s cooldown. Inactive with Carrion Detonation or prepared Grave Bloom.","corruption_nova":"Every 6s, the enemy with the strongest total original paid Rot tick damage emits 75% of that total against itself and up to two other active enemies. Class caps apply. Inactive with Carrion Detonation or prepared Grave Bloom.","soul_drain":"Four paid primary Toxic Touch applications recover up to 2 Mana; global 5s cooldown. Counters reset each encounter. Secondary, free and propagated Rot do not count.","arcane_nova":"Each consumed Arcane Infusion charge deals 35% of its damage to up to two other living enemies, unless Grave Bloom activated on that charge. Raw class caps apply.","mana_convergence":"A funded Arcane cast or Infusion activation below 30% Mana refunds up to 4 Mana, once every 8s.","controlled_burn":"Eligible paid primary Burn gains 25% tick damage; Fire Spread and Conflagration use 75% of original unboosted potency, including Wildfire. New standalone Burn cannot propagate. No additional targets.","cinder_focus":"Paid Fire casts against an already burning isolated enemy burst for one strongest original Burn tick, once every 5s. No reserves may remain.","frost_resonance":"Paid Frost casts against an already chilled enemy pulse for 25% effective Spell Power to up to two other chilled active enemies, once every 4s.","glacial_echo":"Paid Frost casts against an already chilled enemy deal 30% effective Spell Power bonus damage to that enemy, once every 5s.","static_focus":"Redirect 25% of secondary Lightning chain and mark damage toward the primary target, capped at 30% chain base and class limits. No new jumps or marks.","storm_conductor":"Paid Lightning casts against one living enemy and no reserves deal 30% effective Spell Power bonus damage every 5s. No extra chain."};
 const patchNode=(id,change)=>{const i=nodes.findIndex(n=>n.id===id);if(i<0)throw Error('Missing architecture node '+id);nodes[i]=Object.freeze({...nodes[i],...change});};
 const alternative=(id,alt)=>{const n=nodes.find(x=>x.id===id);patchNode(id,{requires:null,anyRequires:[...new Set([n.requires,...(n.anyRequires||[]),alt].filter(Boolean))]});};
 for(const [family,slots] of Object.entries(NORMAL_SLOTS))for(const [slot,id] of slots.entries()){
  const lane=slot===1?1:0,parent=slot===0?'affinity_'+family:'basic_path_'+family+'_'+lane+'_1';
  const existing=nodes.some(n=>n.id===id),first='weapon_path_'+id+'_1',second='weapon_path_'+id+'_2';
  if(existing){patchNode(first,{requires:parent,atlasSlot:slot,atlasStep:0});patchNode(second,{atlasSlot:slot,atlasStep:1});patchNode('gate_'+id,{atlasSlot:slot,atlasStep:2});patchNode(id,{atlasSlot:slot,atlasStep:3});}
  else{
   const meta={pending:!['blood','vitality','aegis','decay'].includes(family),atlasSlot:slot,weaponFork:id};
   stat(first,family,parent,{...meta,tier:1,atlasStep:0});
   stat(second,family,first,{...meta,tier:1,atlasStep:1});
   stat('gate_'+id,family,second,{...meta,tier:1,atlasStep:2,gateFor:id});
   add({id,kind:'extension',family,tier:1,requires:'gate_'+id,name:id.split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join(' '),description:DESIGN[id],maxRank:1,effectId:id,...meta,atlasStep:3});
  }
  if(slot===0)for(const side of [0,1])alternative('focus_branch_'+family+'_'+side+'_1',id);
  else{alternative('basic_path_'+family+'_'+lane+'_2',id);alternative('focus_branch_'+family+'_'+lane+'_2',id);}
 }
 // A shared side stat already costs 4 points; one mode-specific stat gate and
 // the ability make the requested six-point path. Do not duplicate paid stats.
 for(const [element,slots] of Object.entries(ADAPTIVE_SLOTS))for(const [lane,id] of slots.entries()){
  const meta={pending:false,adaptive:true,element,lane,tier:1};
  stat('gate_'+id,'magic','magic_side_'+lane+'_1',{...meta,prerequisites:['element_choice'],gateFor:id,atlasStep:0});
  add({id,kind:'adaptive',family:'magic',requires:'gate_'+id,name:id.split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join(' '),description:DESIGN[id],maxRank:1,effectId:id,...meta,atlasStep:1});
  alternative('magic_side_'+lane+'_2',id);
 }
 // Assign final live nodes only, after all architecture transformations.
 const pairStats={
  'blood_fury':{blood:['critChance','bleedBonus','pctAttack'],fury:['critChance','sunderDamage','pctAttack']},
  'fury_vitality':{fury:['critChance','pctSpeed','critChance'],vitality:['healingPower','pctLife','healingPower']},
  'vitality_aegis':{vitality:['barrierPower','pctLife','healingPower'],aegis:['barrierPower','guardChance','pctArmor']},
  'aegis_magic':{aegis:['pctSpell','barrierPower','pctArmor'],magic:['pctSpell','barrierPower','pctSpell']},
  'magic_decay':{magic:['pctSpell','pctRegen','manaCostReduction'],decay:['pctSpell','pctRegen','pctSpell']},
  'decay_blood':{decay:['pctAttack','rotBonus','pctAttack'],blood:['pctAttack','bleedBonus','critChance']}
 };
 const gateOverrides={
  gate_storm_mastery:'pctSpell',
  gate_reapers_cadence:'bleedBonus',gate_sanctuary:'barrierPower',
  gate_mana_convergence:'manaCostReduction'
 };
 function statKey(n){
  const t=Math.min(3,Math.max(1,n.tier||1))-1,f=n.family,l=n.lane||0,id=n.id;
  if(n.gateFor){const k=gateOverrides[id]||SKILL_STAT[n.gateFor];if(!k)throw Error('Missing skill stat '+n.gateFor);return k;}
  if(id.startsWith('root_'))return ROOT_STAT[f];
  if(n.outerSide!==undefined)return OUTER_STAT[f][n.outerSide][n.outerStep-1];
  if(n.pair&&id.startsWith('mixed_path_'))return pairStats[n.pair.join('_')][f][t];
  if(n.weaponFork){
   const k=SKILL_STAT[n.weaponFork];if(!k)throw Error('Missing weapon stat '+n.weaponFork);
   if(n.weaponFork==='sanguine_reserve')return id.endsWith('_1')?'pctLife':'healingPower';
   if(n.weaponFork==='soul_drain')return id.endsWith('_1')?'pctRegen':'manaCostReduction';
   if(n.weaponFork==='ward_echo')return id.endsWith('_1')?'pctSpell':'barrierPower';
   if(n.weaponFork==='bow_pierce')return id.endsWith('_1')?'pctAttack':'critChance';
   if(n.weaponFork==='fan_of_blades')return id.endsWith('_1')?'flatAvoid':'pctSpeed';
   return k;
  }
  if(id.startsWith('basic_path_')||id.startsWith('basic_detour_'))return LANES[f][l][t];
  if(id.startsWith('focus_branch_')||id.startsWith('focus_bridge_')||n.magicShared)return FOCUS_STAT[f][l][t];
  if(n.element)return 'pctSpell';
  throw Error('No intentional stat assignment for '+id);
 }
 let rotDefenseCount=0;
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i];if(n.kind!=='stat')continue;
  let key=statKey(n);if(key==='rotDefense'&&++rotDefenseCount>5)key='rotBonus';
  const tier=Math.min(3,Math.max(1,n.tier||1)),value=STAT_LAYERS[key][tier-1],label=STAT_NAMES[key];
  const points=['critChance','guardChance'].includes(key),rating=key==='flatAvoid';
  const display=rating?String(value):points?value+'%':Number((value*100).toFixed(4))+'%';
  const description=key==='rotDefense'?display+' less enemy Defense while Rot is active (maximum 10%).':'+'+display+' '+label+(points?' (percentage points).':'.');
  nodes[i]=Object.freeze({...n,name:label,description,[key]:value});
 }
 const ids=new Set(nodes.map(n=>n.id));for(const n of nodes)for(const id of [...(n.requires?[n.requires]:[]),...(n.prerequisites||[]),...(n.anyRequires||[])])if(!ids.has(id))throw Error('Missing prerequisite '+id);
 return Object.freeze(nodes);
}
function requirements(n,ranks){return (!n.requires||ranks[n.requires]>0)&&(!n.prerequisites||n.prerequisites.every(id=>ranks[id]>0))&&(!n.anyRequires||n.anyRequires.some(id=>ranks[id]>0));}
function valid(graph,progress){if(!progress||!Number.isSafeInteger(progress.points)||progress.points<0||!progress.ranks||typeof progress.ranks!=='object'||Array.isArray(progress.ranks))return false;const ranks=progress.ranks,byId=new Map(graph.map(n=>[n.id,n]));let spent=0;for(const [id,rank] of Object.entries(ranks)){const n=byId.get(id);if(!n||!Number.isSafeInteger(rank)||rank<1||rank>(n.maxRank||1)||!requirements(n,ranks))return false;spent+=rank;}return spent<=progress.points;}
function allocate(graph,progress,id){if(!valid(graph,progress))return null;const n=graph.find(x=>x.id===id),ranks=progress.ranks;if(!n||(ranks[id]||0)>=(n.maxRank||1)||Object.values(ranks).reduce((a,b)=>a+b,0)>=progress.points||!requirements(n,ranks))return null;return {...progress,ranks:{...ranks,[id]:(ranks[id]||0)+1}};}
root.WandererTalentGraph=Object.freeze({FAMILIES,BASICS,FOCUSED,MIXED,ELEMENTS,createGraph,requirements,valid,allocate});
})(globalThis);






