'use strict';
// B6: freeze the historical 42 global E10 profiles and add the nine previously absent pairs.
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
const IDS=Object.keys(P),ELITES=['tank','berserker','vampire','caster','gravecaller','the_shepherd','the_gilded','the_headsman'];
const SC=[...[1,4,12,22].map(size=>({id:'normal-'+size,kind:'normal',size})),...['tank','caster','vampire'].map(elite=>({id:'elite-'+elite,kind:'elite',elite})),{id:'boss-rotating',kind:'boss'}];
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

const HISTORICAL=['blood-daggers','fury-twohand','radiance-sword','aegis-sword','decay-cycle-wand','arcane-fire-wand','arcane-frost-wand','arcane-lightning-staff','hybrid-arcane-decay','hybrid-aegis-arcane','hybrid-decay-fury','hybrid-blood-fury'];
assert.equal(IDS.length,51);assert.equal(IDS.filter(id=>P[id].families.length===1).length,36);assert.equal(new Set(IDS.filter(id=>P[id].families.length===2).map(id=>P[id].families.slice().sort().join('+'))).size,15);assert.equal(SC.length,8);assert(HISTORICAL.every(id=>P[id]));
module.exports={IDS,SC,P,W,FAMILIES,profile,HISTORICAL,N,LEVEL,POINTS};
