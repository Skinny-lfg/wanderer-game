'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const B=WandererV012Buildcraft;
require('../combat/v012-combat-runtime.js');
function fixture(mode,ids){
 const p=buy(ids,{element:mode==='arcane'?undefined:mode}),b=B.create();B.syncPermanent(b,p);
 const enemies=Array.from({length:4},()=>({hp:10000,maxhp:10000,barrier:0,slowTime:0,dots:{bleed:[],burn:[]},v012Rot:[]}));
 const reserve={hp:10000,maxhp:10000},r={hp:100,maxhp:200,mp:20,maxmp:100,enemy:enemies[0],enemies,groupReserve:[reserve],stats:{spellPower:100,bonus:{}},combatSeconds:0};
 const metrics={},hits=[],ports={state:{automaticTalents:p,run:r,equip:{test:{v013Trait:'conflagration'}}},phase1Build:b,isPhase1Run:()=>true,setNow:()=>1,gameRandom:()=>.999,phase6Metric(r,k,n){metrics[k]=(metrics[k]||0)+n;},phase6Proc(){},floatText(){},addLog(){},synchronizeDots(e){runtime.synchronizeDots(e)},setDirectEnemyDamage(r,n,label){return runtime.setDirectEnemyDamage(r,n,label);}};
 const runtime=WandererV012CombatRuntime.create(ports);
 const c={player:r,enemy:r.enemy,now:1,waveKey:'one',power:100,base:100,amp:1,funded:true,weaponSubtype:'Sword',random:()=>.999,log(){},trigger(){},link(){},mana(n){r.mp=Math.min(r.maxmp,r.mp+n);},dot(kind,n,opts={}){const raw=Math.max(1,Math.round(n));c.enemy.dots[kind].push({damage:opts.controlledBurn?Math.round(raw*1.25):raw,remaining:3,...(opts.controlledBurn?{controlledBase:raw}:{})});},chill(n){c.enemy.slowTime=n;},damage(n,label){hits.push({target:c.enemy,n,id:label});return runtime.setDirectEnemyDamage(r,n,label);},talentPulseDamage(t,n,id){hits.push({target:t,n,id});return runtime.talentPulseDamage(r,t,n,id);},metric(k,n){metrics[k]=(metrics[k]||0)+n;},heal(){return 0;},barrier(){}};
 return {p,b,r,c,enemies,reserve,metrics,hits,runtime};
}
const slots={arcane:['arcane_nova','mana_convergence'],fire:['controlled_burn','cinder_focus'],frost:['frost_resonance','glacial_echo'],lightning:['static_focus','storm_conductor']};
test('Every adaptive talent costs six points, and wrong mode cannot purchase it',()=>{
 for(const [mode,ids] of Object.entries(slots))for(const id of ids){
 const p=buy([id],{xp:600,element:mode==='arcane'?undefined:mode});assert.equal(p.nodes.length,6);assert(T.valid(p));
 const other=mode==='fire'?'frost':'fire',sw=T.selectElement(p,other);assert(sw);assert(T.valid(sw));assert.equal(sw.xp,600);assert(!sw.nodes.includes(id));assert.equal(T.allocate(sw,id),null);
 }
});
test('Attunement switch refunds dependent shared nodes without an alternative, preserves independently owned routes',()=>{
 let p=buy(['arcane_nova']);p=T.allocate(p,'arcane_side_0_2');assert(p);assert(T.valid(p));
 let next=T.selectElement(p,'fire');assert(next);assert(!next.nodes.includes('arcane_side_0_2'));assert(!next.nodes.includes('arcane_nova'));assert(next.nodes.includes('arcane_side_0_1'));
 let q=buy(['arcane_nova','arcane_bridge_0_2']);q=T.allocate(q,'arcane_side_0_2');assert(q);
 next=T.selectElement(q,'fire');assert(next);assert(T.valid(next));assert.equal(next.xp,q.xp);assert(next.nodes.includes('arcane_side_0_2'));
});
test('Arcane Nova spends actual Infusion charges, hits at most two active targets, never combines with Bloom',()=>{
 const h=fixture('arcane',['arcane_nova']);B.activateInfusion(h.b,0);const amount=B.onInfusionHit(h.b,h.c);
 assert(amount>0);assert.equal(h.metrics.arcane_novaActivations,1);assert.equal(h.metrics.arcane_novaTargets,2);assert.equal(h.reserve.hp,10000);assert.equal(h.b.runtime.infusionCharges,1);
 B.onInfusionHit(h.b,{...h.c,proc:true});assert.equal(h.b.runtime.infusionCharges,1);
 h.b.runtime.specializations.push('grave_bloom');h.b.runtime.prepared='grave_bloom';B.onInfusionHit(h.b,h.c);assert.equal(h.metrics.graveBloomActivations,1);assert.equal(h.metrics.arcane_novaActivations,1);
});
test('Mana Convergence refunds only paid Arcane actions at low Mana, with a shared eight second cooldown',()=>{
 const h=fixture('arcane',['mana_convergence']);B.onInfusionActivation(h.b,{...h.c,magicalAction:'infusion',funded:false});assert.equal(h.r.mp,20);
 B.onInfusionActivation(h.b,{...h.c,magicalAction:'infusion'});assert.equal(h.r.mp,24);
 B.onCast(h.b,h.c);assert.equal(h.r.mp,24);h.c.now=9;B.onCast(h.b,h.c);assert.equal(h.r.mp,28);assert.equal(h.metrics.mana_convergenceMana,8);
});
test('Frost requires previous Chill, seeds initial status, and pulses only chilled active targets',()=>{
 const h=fixture('frost',['frost_resonance','glacial_echo']);h.enemies[1].slowTime=2;h.enemies[2].slowTime=2;
 B.onCast(h.b,h.c);assert(h.enemies[0].slowTime>0);assert.equal(h.metrics.frost_resonanceActivations,undefined);
 h.c.now=2;B.onCast(h.b,h.c);assert.equal(h.metrics.frost_resonanceTargets,2);assert.equal(h.metrics.glacial_echoActivations,1);
 assert.equal(h.enemies[3].hp,10000);assert.equal(h.reserve.hp,10000);
 B.onCast(h.b,h.c);assert.equal(h.metrics.glacial_echoActivations,1);
});
test('Controlled Burn has native primary potency and reduced original spread base; Cinder Focus is isolated-only',()=>{
 const h=fixture('fire',['controlled_burn','cinder_focus']);
 B.onCast(h.b,h.c);const burn=h.enemies[0].dots.burn[0];assert(burn.controlledBase>0);assert.equal(burn.damage,Math.round(burn.controlledBase*1.25));
 assert.equal(h.runtime.controlledSpreadBase(burn,true),burn.controlledBase*.75);
 h.c.now=7;B.onCast(h.b,h.c);assert.equal(h.metrics.cinder_focusActivations,undefined);
 h.enemies.slice(1).forEach(e=>e.hp=0);B.onCast(h.b,h.c);assert.equal(h.metrics.cinder_focusActivations,undefined);
 h.r.groupReserve=[];B.onCast(h.b,h.c);assert.equal(h.metrics.cinder_focusActivations,1);
});
test('Native standalone adaptive Burn cannot feed Conflagration',()=>{
 const h=fixture('fire',['controlled_burn','cinder_focus']);
 // Use the actual native context.dot rather than the fixture's simplified dot.
 const ctx=h.runtime.phase2Context(h.r);
 B.onCast(h.b,{...ctx,funded:true,power:100,amp:1});
 const burn=h.enemies[0].dots.burn.at(-1);
 assert(burn.primaryOnly);assert.equal(burn.damage,Math.round(burn.controlledBase*1.25));
 // Inject equipment trait in runtime state through fixture.
 h.runtime.groupElementalEffects(h.r,h.b);
 assert(h.enemies.slice(1).every(e=>e.dots.burn.length===0));
});
test('Static Focus reduces secondary damage, retains jump count and does not generate marks on extra targets',()=>{
 const a=fixture('lightning',['storm_mastery']),b=fixture('lightning',['storm_mastery','static_focus']);
 const ac=a.runtime.v013LightningChainDamage(a.r,100),bc=b.runtime.v013LightningChainDamage(b.r,100);assert.equal(ac,bc);
 assert.equal(a.metrics.lightningMarksApplied,b.metrics.lightningMarksApplied);
 assert(b.metrics.secondaryTargetDamage<a.metrics.secondaryTargetDamage);assert(b.metrics.static_focusDamage>0);assert.equal(b.reserve.hp,10000);
});
test('Storm Conductor only activates against an isolated foe, not reserve waves, and old global multipliers are gone',()=>{
 const h=fixture('lightning',['storm_conductor']);B.onCast(h.b,h.c);assert.equal(h.metrics.storm_conductorActivations,undefined);
 h.enemies.slice(1).forEach(e=>e.hp=0);B.onCast(h.b,h.c);assert.equal(h.metrics.storm_conductorActivations,undefined);
 h.r.groupReserve=[];B.onCast(h.b,h.c);assert.equal(h.metrics.storm_conductorActivations,1);
 for(const p of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js']){const s=fs.readFileSync(p,'utf8');assert(!/storm_conductor'\)\?1\.2/.test(s));}
});
test('Native metrics and docs mirrors match',()=>{
 assert(fs.readFileSync('scripts/simulate-progression.cjs','utf8').includes('magicAdaptiveMetrics:'));
 for(const p of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-graph-next.js','preview/talent-rebuild/index.html'])assert.equal(fs.readFileSync(p,'utf8'),fs.readFileSync('docs/'+p,'utf8'));
});
