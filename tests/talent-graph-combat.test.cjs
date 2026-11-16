'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');require('../combat/v012-buildcraft.js');require('../combat/automatic-talents.js');require('../combat/talent-graph-next.js');require('../combat/talent-graph-bridge.js');require('../combat/talent-graph-runtime.js');
const T=WandererAutomaticTalents,C=WandererV012Buildcraft;
function buy(p,id){const n=T.NODES.find(x=>x.id===id);for(const d of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.nodes.includes(d))p=buy(p,d);if(n.anyRequires&&!n.anyRequires.some(d=>p.nodes.includes(d)))p=buy(p,n.anyRequires[0]);const next=T.allocate(p,id);assert(next,id);return next;}
function build(ids,element='fire'){let p={...T.create(),xp:10000};for(const id of ids)if(!p.nodes.includes(id))p=buy(p,id);p.element=element;const b=C.create();C.syncPermanent(b,p);return b;}
function context(){const events=[],player={hp:50,maxhp:200,mp:20,maxmp:100,barrier:0},enemy={hp:5000,maxhp:5000,bleedStacks:2,dots:{bleed:[],burn:[],poison:[]},v012Rot:[{damage:10,remaining:4}],slowTime:0};return {events,player,enemy,c:{player,enemy,now:0,base:100,power:100,amp:1,funded:true,critical:true,random:()=>0,dot:(kind,n)=>{events.push(['dot',kind,n]);enemy.dots[kind].push({damage:n,remaining:3})},damage:(n,label)=>events.push(['damage',label,n]),dotDamage:n=>events.push(['dotDamage',n]),heal:n=>{player.hp+=n;events.push(['heal',n]);return n},barrier:n=>events.push(['barrier',n]),mana:n=>events.push(['mana',n]),chill:n=>events.push(['chill',n]),log:()=>{}}};}
test('new Blood basic applies Bleed through real combat engine',()=>{const b=build(['bleeding_edge']),{c,events}=context();C.onAttack(b,c);assert(events.some(e=>e[0]==='dot'&&e[1]==='bleed'));});
test('new Blood focused affects combat through specialization',()=>{const b=build(['crimson_feast']),{c,events}=context();for(let i=0;i<3;i++){c.now=i*2;C.onAttack(b,c);}assert(events.some(e=>e[0]==='damage'&&e[1].includes('Crimson Feast')));});
test('each higher Fury focused works without Battle Tempo or the other focused skill',()=>{for(const [id,label] of [['relentless_assault','Relentless Assault'],['unchained_fury','Unchained Fury']]){const b=build([id]),{c,events}=context();assert(!b.runtime.specializations.includes('battle_tempo'));assert(!b.runtime.specializations.includes(id==='relentless_assault'?'unchained_fury':'relentless_assault'));for(let i=0;i<5;i++){c.now=i;C.onAttack(b,c);}assert(events.some(e=>e[0]==='damage'&&e[1].includes(label)),id);assert.equal(C.speed(b,c.now),1,'tempo does not grant the unpurchased speed bonus');}});
test('new Blood and Fury mixed affects the executed attack',()=>{const b=build(['crimson_rush']),{c,events}=context();C.onAttack(b,c);assert(events.some(e=>e[0]==='damage'&&e[1].includes('Crimson Rush')));});
test('new Fire elemental branch applies Burn',()=>{const b=build(['kindling'],'fire'),{c,events}=context();C.onCast(b,c);assert(events.some(e=>e[0]==='dot'&&e[1]==='burn'));});
test('higher Fire and Frost talents supply their trigger without earlier elemental skills',()=>{for(const [id,element,status] of [['combustion','fire','burn'],['living_inferno','fire','burn'],['shatter','frost','chill'],['absolute_winter','frost','chill']]){const b=build([id],element),{c,events}=context();c.chill=n=>{c.enemy.slowTime=n;events.push(['chill',n]);};assert(!b.runtime.specializations.includes(element==='fire'?'kindling_flame':'deep_chill'));assert.equal(C.rank(b,element==='fire'?'kindling':'deep_winter'),0);C.onCast(b,c);assert(events.some(e=>status==='burn'?e[0]==='dot'&&e[1]==='burn':e[0]==='chill'),id);if(id==='combustion'||id==='shatter')assert(events.some(e=>e[0]==='damage'&&e[1].toLowerCase().includes(id)),id);}});
test('affinity modifiers affect their stated statistics',()=>{for(const [id,key,base] of [['fury','attacksPerSec',1],['vitality','maxhp',100],['magic','spellPower',100]]){const p=buy({...T.create(),xp:10000},'affinity_'+id),s={attack:10,defense:10,maxhp:100,evasionRating:0,spellPower:100,manaRegen:1,attacksPerSec:1};assert(T.apply(s,p)[key]>base,id);}});
test('each family root applies its advertised flat stat',()=>{for(const [id,key] of [['blood','attack'],['fury','evasionRating'],['aegis','defense'],['vitality','maxhp'],['magic','spellPower'],['decay','manaRegen']]){const p=buy({...T.create(),xp:10000},'root_'+id),s={attack:10,defense:10,maxhp:100,evasionRating:0,spellPower:100,manaRegen:1,attacksPerSec:1},before=s[key];assert(T.apply(s,p)[key]>before,id);}});
test('Blood focused nodes apply their individual combat effects',()=>{
 {const b=build(['blood_harvest']),{c,events}=context();C.onKill(b,c);assert(events.some(e=>e[0]==='heal'));}
 {const b=build(['heart_of_carnage']),{c,events}=context();C.onAttack(b,c);assert(events.some(e=>e[0]==='damage'&&e[1].includes('Heart of Carnage')));}
});
test('Fury tempo node raises attack speed after attacks',()=>{const b=build(['battle_tempo']),{c}=context();for(let i=0;i<5;i++)C.onAttack(b,c);assert.equal(C.speed(b,0),1.15);});
test('Aegis focused nodes reduce damage, return stored force, and prevent a fatal hit',()=>{
 {const b=build(['steadfast_guard']),{c}=context();C.onDefend(b,c,10,0);assert(C.incoming(b,c,100)<100);}
 {const b=build(['stored_force']),{c,events}=context();C.onDefend(b,c,10,10);C.onAttack(b,c);assert(events.some(e=>e[0]==='damage'&&e[1].includes('Stored Force')));}
 {const b=build(['unbreakable']),{c}=context();assert(C.survive(b,c));assert(!C.survive(b,c));}
});
test('Vitality focused nodes heal and convert healing to barrier',()=>{
 {const b=build(['living_recovery']),{c,events}=context();C.onSecond(b,c);assert(events.some(e=>e[0]==='heal'));}
 {const b=build(['overflowing_life']),{c,events}=context();C.onHeal(b,c,100);assert(events.some(e=>e[0]==='barrier'));}
 {const b=build(['heart_of_the_wild']),{c,events}=context();C.onSecond(b,c);assert(events.some(e=>e[0]==='heal'));}
});
test('Decay focused nodes extend Rot, consume stacks and amplify third tick',()=>{
 {const b=build(['lingering_rot']),{c}=context();c.enemy.v012Rot=[];C.applyRot(b,c,10);assert.equal(c.enemy.v012Rot[0].remaining,5);}
 {const b=build(['corruption_cycle']),{c,events}=context();c.enemy.v012Rot=Array.from({length:3},()=>({damage:10,remaining:4}));C.onAttack(b,c);assert(events.some(e=>e[0]==='damage'&&e[1].includes('Corruption Cycle')));}
 {const b=build(['plagueheart']),{c,events}=context();for(let i=0;i<3;i++)C.tickRot(b,c);const ticks=events.filter(e=>e[0]==='dotDamage').map(e=>e[1]);assert(ticks[2]>ticks[0]);}
});
test('each focused Magic node raises Spell Power when purchased alone',()=>{for(const id of ['arcane_resonance','arcane_surge','arcane_mastery']){const p=buy({...T.create(),xp:10000},id),base={attack:10,defense:10,maxhp:100,evasionRating:0,spellPower:100,manaRegen:1,attacksPerSec:1};const full=T.apply({...base},p).spellPower;const without=T.apply({...base},{...p,nodes:p.nodes.filter(n=>n!==id)}).spellPower;assert(full>without,id);}});
test('catalogue mixed skills trigger their combat effect when purchased alone',()=>{
 const cases=[
  ['crimson_rush',(b,c)=>C.onAttack(b,c),'Crimson Rush'],
  ['reapers_cadence',(b,c)=>{c.enemy.hp=100;C.onAttack(b,c)},"Reaper's Cadence"],
  ['counterstrike',(b,c)=>{C.onDefend(b,c,10,0);C.onAttack(b,c)},'Counterstrike'],
  ['iron_reversal',(b,c)=>{C.onDefend(b,c,10,0);C.onAttack(b,c)},'Iron Reversal'],
  ['sanctuary',(b,c)=>C.onHeal(b,c,20),'barrier'],
  ['guardians_oath',(b,c)=>{c.player.barrier=0;C.onDefend(b,c,0,10)},'heal'],
  ['life_conduit',(b,c)=>C.onHeal(b,c,20),'mana'],
  ['lifeweave',(b,c)=>{c.player.mp=1;C.onSecond(b,c)},'mana'],
  ['hex_bolt',(b,c)=>C.onCast(b,c),'Hex Bolt'],
  ['elemental_blight',(b,c)=>C.onCast(b,c),'Blight'],
  ['plague_rupture',(b,c)=>C.onAttack(b,c),'Plague Rupture'],
  ['carrion_detonation',(b,c)=>{c.enemy.dots.bleed.push({damage:10,remaining:3});C.onAttack(b,c)},'Carrion Detonation']
 ];
 for(const [id,run,expected] of cases){const b=build([id]),{c,events}=context();run(b,c);assert(events.some(e=>e[0]===expected||e[0]==='damage'&&e[1].includes(expected)),id);}
});
