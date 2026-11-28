'use strict';
const assert=require('node:assert/strict'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
const LEVEL=10,POINTS=30,N=50,FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const W={daggers:['Daggers','Off-Hand Dagger','Leather'],sword:['Sword','Shield','Plate'],mace:['Mace','Shield','Plate'],twohand:['Two-Handed',null,'Plate'],bow:['Bow',null,'Leather'],wand:['Wand','Tome','Cloth'],orb:['Wand','Orb','Cloth'],staff:['Staff',null,'Cloth']};
const P={};
function add(id,families,w,skills,role,element,prepared){assert(!P[id]);P[id]={id,families,w,skills,role,element,prepared};}
add('blood-daggers',['blood'],'daggers',['accelerated_bleeding','deep_cuts','blood_harvest'],'single');
add('blood-sword',['blood'],'sword',['blood_drinker','third_cut','blood_harvest'],'sustain');
add('blood-twohand',['blood'],'twohand',['cleave_mastery','accelerated_bleeding','deep_cuts'],'aoe');
add('fury-daggers',['fury'],'daggers',['fan_of_blades','double_strike','quick_hands'],'aoe');
add('fury-bow',['fury'],'bow',['bow_pierce','precision','quick_hands'],'aoe');
add('fury-twohand',['fury'],'twohand',['single_target_mastery','brutal_crit','battle_tempo'],'single');
add('radiance-sword',['radiance'],'sword',['living_recovery','strong_heart','renewal'],'sustain');
add('radiance-mace',['radiance'],'mace',['living_force','vital_pulse','renewal'],'aoe');
add('radiance-wand',['radiance'],'wand',['vital_pulse','grasping_roots','life_bloom'],'aoe');
add('aegis-sword',['aegis'],'sword',['sword_sweep','guarded_block','barrier_pulse'],'aoe');
add('aegis-mace',['aegis'],'mace',['mace_shockwave','guarded_block','barrier_pulse'],'aoe');
add('aegis-orb',['aegis'],'orb',['ward_echo','stored_force','barrier_pulse'],'sustain');
for(const w of ['daggers','sword','twohand','bow','wand','staff']){
 add('decay-cycle-'+w,['decay'],w,['corruption_cycle','contagious_touch','corruption_nova'],'aoe');
 add('decay-focus-'+w,['decay'],w,['plagueheart','contagious_touch'],'sustain');
}
const ELEMENT_SKILLS={arcane:['arcane_resonance','arcane_nova','mana_spring'],fire:['kindling','fire_spread','controlled_burn'],frost:['deep_winter','frost_resonance','glacial_echo'],lightning:['overcharge','forked_lightning','static_focus']};
for(const [element,skills] of Object.entries(ELEMENT_SKILLS))for(const w of ['sword','wand','staff'])add('arcane-'+element+'-'+w,['arcane'],w,['element_choice','arcane_focus',...skills],element==='frost'?'control':'aoe',element);
add('hybrid-blood-fury',['blood','fury'],'daggers',['crimson_onslaught','reapers_cadence','red_guillotine'],'single',null,'red_guillotine');
add('hybrid-fury-radiance',['fury','radiance'],'twohand',['fervent_life','redline','defiant_surge'],'sustain',null,'defiant_surge');
add('hybrid-radiance-aegis',['radiance','aegis'],'mace',['sanctuary','guardians_oath','last_bastion'],'sustain',null,'last_bastion');
add('hybrid-aegis-arcane',['aegis','arcane'],'orb',['runic_shield','prismatic_rebound','arcane_bastion'],'sustain','arcane','arcane_bastion');
add('hybrid-arcane-decay',['arcane','decay'],'wand',['hex_bolt','elemental_blight','grave_bloom'],'aoe','arcane','grave_bloom');
add('hybrid-decay-blood',['decay','blood'],'twohand',['plague_spread','carrion_detonation','septic_wound'],'aoe',null,'septic_wound');
add("hybrid-blood-radiance",["blood","radiance"],"sword",["deep_cuts","blood_harvest","renewal"],"sustain");
add("hybrid-blood-aegis",["blood","aegis"],"sword",["deep_cuts","guarded_block","barrier_pulse"],"sustain");
add("hybrid-blood-arcane",["blood","arcane"],"sword",["deep_cuts","arcane_focus","element_choice"],"single","arcane");
add("hybrid-decay-fury",["decay","fury"],"daggers",["corruption_cycle","quick_hands","virulent_rot"],"single");
add("hybrid-decay-radiance",["decay","radiance"],"wand",["corruption_cycle","renewal","life_bloom"],"sustain");
add("hybrid-decay-aegis",["decay","aegis"],"orb",["corruption_cycle","barrier_pulse","ward_echo"],"sustain");
add("hybrid-fury-aegis",["fury","aegis"],"sword",["quick_hands","guarded_block","barrier_pulse"],"single");
add("hybrid-fury-arcane",["fury","arcane"],"sword",["quick_hands","arcane_focus","element_choice"],"single","arcane");
add("hybrid-radiance-arcane",["radiance","arcane"],"wand",["renewal","arcane_focus","element_choice"],"sustain","arcane");
add("arcane-buff-sword",["arcane"],"sword",["element_choice","arcane_focus","mana_spring","arcane_resonance","arcane_surge","arcane_mastery","mana_convergence"],"amplification","arcane");
add("arcane-buff-wand",["arcane"],"wand",["element_choice","arcane_focus","mana_spring","arcane_resonance","arcane_surge","arcane_mastery","mana_convergence"],"amplification","arcane");
add("fury-daggers-st",["fury"],"daggers",["single_target_mastery","precision","quick_hands"],"single");
add("blood-twohand-st",["blood"],"twohand",["accelerated_bleeding","deep_cuts","blood_harvest"],"single");
const ALL=Object.keys(P),ELITES=['tank','berserker','vampire','caster','gravecaller','the_shepherd','the_gilded','the_headsman'];
const OLD_SC=[...[1,4,12,22].map(size=>({id:'normal-'+size,kind:'normal',size})),...['tank','caster','vampire'].map(elite=>({id:'elite-'+elite,kind:'elite',elite})),{id:'boss-rotating',kind:'boss'}];
const NEW_SC=[2,8,16].map(size=>({id:'normal-'+size,kind:'normal',size}));
const SC=[...OLD_SC,...NEW_SC];
function profile(id){
 const p=P[id];assert(p,id);const [weapon,offhandType,armorType]=W[p.w],options={xp:POINTS*T.POINT_XP,...(p.element&&p.element!=='arcane'?{element:p.element}:{})};
 const mandatory=[...p.families.map(f=>'affinity_'+f),...p.skills];let t=buy(mandatory,options);assert(t.nodes.length<=POINTS,id+' mandatory budget');const used=()=>t.nodes.length;
 for(let pass=0;pass<POINTS&&used()<POINTS;pass++){let changed=false;for(const skill of p.skills){if(used()>=POINTS)break;const n=T.NODES.find(x=>x.id===skill);if(n?.maxRank>1){const next=T.allocate(t,skill);if(next){t=next;changed=true;}}}if(!changed)break;}
 const kindOrder={stat:0,basic:1,extension:2,focused:3,weapon:4,adaptive:5,element:6};
 const candidates=T.NODES.filter(n=>p.families.includes(n.family)&&!n.pair&&!n.advanced&&!n.pending&&(!n.element||n.element===(p.element||'arcane'))&&!(n.id==='plagueheart'&&p.families.length>1)&&Object.hasOwn(kindOrder,n.kind)).sort((a,b)=>kindOrder[a.kind]-kindOrder[b.kind]||((a.tier||1)-(b.tier||1))||a.id.localeCompare(b.id));
 for(let pass=0;pass<POINTS&&used()<POINTS;pass++){let changed=false;for(const n of candidates){if(used()>=POINTS)break;if(t.nodes.includes(n.id))continue;const next=T.allocate(t,n.id);if(next){t=next;changed=true;}}if(!changed)break;}
 if(p.prepared)t={...t,prepared:p.prepared};assert(T.valid(t),id+' valid');assert.equal(used(),POINTS,id+' point budget');assert.deepEqual(t.nodes.filter(n=>n.startsWith('affinity_')).sort(),p.families.map(f=>'affinity_'+f).sort(),id+' affinity drift');for(const skill of mandatory)assert(t.nodes.includes(skill),id+' missing '+skill);
 return {...p,weapon,offhandType,armorType,t};
}


const REUSE=["arcane-fire-sword","arcane-fire-wand","arcane-fire-staff","arcane-lightning-sword","arcane-lightning-wand","arcane-lightning-staff","decay-focus-daggers","decay-focus-sword","decay-focus-twohand","decay-focus-bow","decay-focus-wand","decay-focus-staff","decay-cycle-wand","decay-cycle-daggers","hybrid-arcane-decay","hybrid-aegis-arcane","hybrid-radiance-arcane","blood-daggers","fury-twohand","aegis-sword","radiance-sword","arcane-arcane-wand","arcane-frost-wand","hybrid-radiance-aegis"],EXTRA=["blood-sword","blood-twohand","fury-bow","fury-daggers","aegis-orb","radiance-mace","decay-cycle-sword","arcane-arcane-sword","hybrid-blood-radiance","hybrid-blood-aegis","hybrid-blood-arcane","hybrid-decay-fury","arcane-buff-sword","arcane-buff-wand","fury-daggers-st","blood-twohand-st"],IDS=[...REUSE,...EXTRA],PAIRS=[["fury-daggers-st","fury-daggers","ST versus AoE: identical Fury/Daggers kit"],["blood-twohand-st","blood-twohand","ST versus AoE: identical Blood/Two-Handed kit"],["arcane-arcane-sword","arcane-buff-sword","Arcane Nova package versus amplification: physical kit"],["arcane-arcane-wand","arcane-buff-wand","Arcane Nova package versus amplification: caster kit"],["arcane-fire-wand","arcane-lightning-wand","Fire versus Lightning: same caster kit"],["arcane-fire-staff","arcane-lightning-staff","Fire versus Lightning: same staff kit"],["arcane-arcane-wand","arcane-frost-wand","Arcane versus Frost: same kit"],["decay-cycle-daggers","decay-focus-daggers","Burst versus sustained Rot: Daggers"],["decay-cycle-wand","decay-focus-wand","Burst versus sustained Rot: Wand"],["decay-cycle-sword","decay-focus-sword","Burst versus sustained Rot: Sword"],["decay-cycle-daggers","hybrid-decay-fury","Pure versus Fury-assisted Decay"],["blood-sword","hybrid-blood-radiance","Radiance contribution to Blood"],["blood-sword","hybrid-blood-aegis","Aegis contribution to Blood"],["blood-sword","hybrid-blood-arcane","Arcane contribution to Blood"],["aegis-orb","hybrid-aegis-arcane","Arcane contribution to Aegis"],["arcane-arcane-wand","hybrid-radiance-arcane","Radiance contribution to Arcane"],["arcane-arcane-wand","hybrid-arcane-decay","Grave Bloom hybrid versus pure Arcane"],["radiance-mace","hybrid-radiance-aegis","Defensive hybrid versus pure Radiance"]],HISTORICAL=[];
assert.equal(IDS.length,40);assert.equal(new Set(IDS).size,40);assert(IDS.every(id=>P[id]));assert.equal(SC.length,11);
// Historical B6 role labels are metadata; the four added profiles are explicit role candidates.
module.exports={IDS,SC,OLD_SC,NEW_SC,REUSE,EXTRA,PAIRS,P,FAMILIES,profile,N,HISTORICAL};
