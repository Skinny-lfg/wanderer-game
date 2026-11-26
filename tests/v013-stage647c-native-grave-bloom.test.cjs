'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8'),build=fs.readFileSync('combat/v012-buildcraft.js','utf8');
function harness(){
 const src={runtime,build},g={};
 vm.createContext(g);vm.runInContext(src.build,g);
 const B=g.WandererV012Buildcraft,b=B.create();
 b.runtime.prepared='grave_bloom';b.runtime.specializations=['grave_bloom','affinity_arcane','affinity_decay'];
 b.unlockedFamilies=['arcane','decay'];b.families=['arcane','decay'];b.element='arcane';b.runtime.permanentBuild=true;
 b.runtime.infusionCharges=2;b.runtime.infusionExpiresAt=10;
 const enemies=Array.from({length:4},(_,i)=>({name:'E'+i,hp:10000,maxhp:10000,v012Rot:[],dots:{bleed:[],burn:[]}}));
 const reserve={hp:10000,maxhp:10000,v012Rot:[]},metrics={},hits=[];
 const player={enemies,groupReserve:[reserve],maxhp:100};
 const c={player,enemy:enemies[0],waveKey:'a',funded:true,power:100,now:1,magical:false,weaponSubtype:'Sword',
  log(){},metric(k,n){metrics[k]=(metrics[k]||0)+n;},trigger(){},link(){},mana(){},
  damage(n,label){const real=Math.min(c.enemy.hp,n);c.enemy.hp-=real;hits.push({label,real});return real;},
  dotDamage(n,label,fraction){hits.push({label,real:n,fraction});}};
 return {B,b,c,enemies,reserve,hits,metrics,src};
}
test('Paid Infusion seeds Rot first, bursts on total active stack damage, then spreads to exactly two living targets',()=>{
 const h=harness();h.enemies[0].v012Rot=[{damage:30,remaining:3},{damage:20,remaining:3}];
 h.B.onInfusionHit(h.b,h.c);
 assert.equal(h.b.runtime.infusionCharges,1);
 assert.equal(h.enemies[0].v012Rot.length,4);
 assert.equal(h.metrics.graveBloomSeeds,2);
 const total=h.enemies[0].v012Rot.reduce((n,d)=>n+d.damage,0);
 assert.equal(h.hits.find(x=>x.label.includes('Grave Bloom')).real,total);
 assert.equal(h.enemies[1].v012Rot.length,2);assert.equal(h.enemies[2].v012Rot.length,2);
 assert.equal(h.enemies[3].v012Rot.length,0);assert.equal(h.reserve.v012Rot.length,0);
 assert.equal(h.metrics.graveBloomActivations,1);assert.equal(h.metrics.graveBloomSpread,4);
});
test('Actual consumed magical Infusion counts once; unprepared, expired and offhand do not trigger Bloom',()=>{
 const h=harness();h.c.magical=true;h.c.weaponSubtype='Wand';
 h.B.onInfusionHit(h.b,h.c);assert.equal(h.metrics.graveBloomActivations,1);
 h.c.offhand=true;h.B.onInfusionHit(h.b,h.c);assert.equal(h.metrics.graveBloomActivations,1);assert.equal(h.b.runtime.infusionCharges,1);
 h.c.offhand=false;h.c.now=10;h.B.onInfusionHit(h.b,h.c);assert.equal(h.metrics.graveBloomActivations,1);
 const n=harness();n.b.runtime.prepared=null;n.B.onInfusionHit(n.b,n.c);assert.equal(n.metrics.graveBloomActivations,undefined);
});
test('Rot cap preserved and leader burst bounded',()=>{
 const h=harness();h.enemies[0].boss=true;h.enemies[0].maxhp=1000;h.enemies[0].hp=1000;
 h.enemies[0].v012Rot=Array.from({length:6},()=>({damage:100,remaining:4}));
 h.enemies[1].v012Rot=Array.from({length:6},()=>({damage:100,remaining:4}));
 h.B.onInfusionHit(h.b,h.c);
 assert.equal(h.hits.find(x=>x.label.includes('Grave Bloom')).real,35);
 assert.equal(h.enemies[0].v012Rot.length,6);assert.equal(h.enemies[1].v012Rot.length,6);
});
test('Spread stacks reach native tickRot and have secondary attribution',()=>{
 const h=harness();h.B.onInfusionHit(h.b,h.c);h.c.enemy=h.enemies[1];
 h.B.tickRot(h.b,h.c);
 const hit=h.hits.find(x=>x.label==='☠ Rot');
 assert(hit.real>0);assert.equal(hit.fraction,1);assert.equal(h.metrics.graveBloomRotTicks,2);
 assert(h.metrics.graveBloomRotRawTickDamage>0);
});
test('Old cast-triggered Bloom removed; Spell Echo remains',()=>{
 const h=harness();assert(!h.src.runtime.includes('function v013GraveBloomPulse('));
 assert(!h.src.build.includes("if(r.prepared==='grave_bloom'){"));
 assert(h.src.runtime.includes("if(cast&&learned('resonant_sequence'))"));
});
