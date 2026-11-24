'use strict';
// Candidate contracts exercise the actual transformed functions in memory.
// No checkout or source-file writes.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {transform,scenarios}=require('../scripts/v013-stage647-grave-bloom-lab.cjs');
const runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8'),build=fs.readFileSync('combat/v012-buildcraft.js','utf8');
function harness(variant='balanced',count=4){
 const src=transform(runtime,build,scenarios[variant]),g={};
 vm.createContext(g);vm.runInContext(src.build,g);
 const B=g.WandererV012Buildcraft,b=B.create();
 b.runtime.prepared='grave_bloom';b.runtime.specializations=['grave_bloom','affinity_magic','affinity_decay'];
 const enemies=Array.from({length:count},(_,i)=>({name:'E'+i,hp:1000,maxhp:1000,v012Rot:[]}));
 const reserve={hp:1000,maxhp:1000,v012Rot:[]},metrics={},hits=[];
 const player={enemies,groupReserve:[reserve]};
 const c={player,enemy:enemies[0],waveKey:'a',funded:true,power:100,action:'weaponCast',now:1,
   log(){},metric(k,n){metrics[k]=(metrics[k]||0)+n;},trigger(){},link(){},
   secondaryHit(e,n){const real=Math.min(e.hp,n);e.hp-=real;hits.push({target:e.name,real});return real;}};
 return {B,b,c,enemies,reserve,hits,metrics,src};
}
test('One shared paid-action counter triggers exactly on third cast/Infusion/elemental action',()=>{
 const h=harness();h.c.action='weaponCast';assert.equal(h.B.graveBloomAction(h.b,h.c),0);
 h.c.action='infusion';assert.equal(h.B.graveBloomAction(h.b,h.c),0);
 h.c.action='elementalCast';assert.equal(h.B.graveBloomAction(h.b,h.c),0);
 assert.equal(h.metrics.graveBloomActivations,1);assert.equal(h.metrics.graveBloomActions,3);
 assert.equal(h.hits.length,3);assert(h.enemies.slice(1).every(e=>e.v012Rot.length===1));
 assert.equal(h.reserve.hp,1000);assert.equal(h.reserve.v012Rot.length,0);
 assert.equal(h.enemies[0].hp,1000);
});
test('Unfunded, offhand and recursive actions cannot charge Grave Bloom',()=>{
 const h=harness();
 for(const flag of ['proc','extra','recursive','offhand'])h.B.graveBloomAction(h.b,{...h.c,[flag]:true});
 h.B.graveBloomAction(h.b,{...h.c,funded:false});assert.equal(h.metrics.graveBloomActions,undefined);
 h.b.runtime.prepared=null;h.B.graveBloomAction(h.b,h.c);assert.equal(h.metrics.graveBloomActions,undefined);
});
test('Encounter transition resets count; solo remains one Rot tick',()=>{
 const h=harness('strong',1);
 h.B.graveBloomAction(h.b,h.c);h.B.graveBloomAction(h.b,h.c);
 h.c.waveKey='next';h.c.enemy.v012Rot=[{damage:20,remaining:3}];
 assert.equal(h.B.graveBloomAction(h.b,h.c),0);assert.equal(h.B.graveBloomAction(h.b,h.c),0);
 assert.equal(h.B.graveBloomAction(h.b,h.c),20);assert.equal(h.metrics.graveBloomActivations,1);assert.equal(h.hits.length,0);
});
test('Full Rot target still receives its own burst; capped elite/boss; no wrong-target reassignment',()=>{
 const h=harness('strong');
 h.enemies[1].v012Rot=Array.from({length:6},()=>({damage:10,remaining:3}));
 h.enemies[1].boss=true;h.enemies[2].miniboss=true;
 h.c.enemy.v012Rot=[{damage:30,remaining:3},{damage:10,remaining:4}];
 for(let i=0;i<3;i++)h.B.graveBloomAction(h.b,h.c);
 assert.equal(h.hits.length,3);assert.equal(h.hits[0].real,35);assert.equal(h.hits[1].real,70);
 assert.equal(h.hits[2].real,170);assert.equal(h.enemies[1].v012Rot.length,6);
 assert.equal(h.enemies[2].v012Rot[0].damage,26);
});
test('Funded Wand/Staff Infusion cannot double-count the already counted cast',()=>{
 const h=harness();h.b.unlockedFamilies=['magic','decay'];h.b.families=['magic','decay'];h.b.element='arcane';
 h.b.runtime.permanentBuild=true;h.b.runtime.infusionCharges=2;h.b.runtime.infusionExpiresAt=10;
 const c={...h.c,magical:true,weaponSubtype:'Wand',damage(){},mana(){}};
 h.B.graveBloomAction(h.b,h.c);h.B.onInfusionHit(h.b,c);
 assert.equal(h.metrics.graveBloomActions,1);
});
test('The old physical and spell resolvers are removed; spell echo has its own counter',()=>{
 const h=harness();assert(!h.src.runtime.includes('function v013GraveBloomPulse('));
 assert(!h.src.build.includes("if(r.prepared==='grave_bloom'){"));
 assert(h.src.runtime.includes("if(cast&&learned('spell_echo'))"));
 assert.equal((h.src.runtime.match(/WandererV012Buildcraft\.graveBloomAction\(/g)||[]).length,2);
});
