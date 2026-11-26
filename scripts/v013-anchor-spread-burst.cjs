'use strict';
// Extend the existing, isolated spread runner without changing or restarting its workflow.
// All mutations below apply to VM research source strings only.
const fs=require('node:fs'),assert=require('node:assert/strict');
let runner=fs.readFileSync(require('node:path').join(__dirname,'v013-anchor-spread-research.cjs'),'utf8');
function edit(a,b){assert.equal(runner.split(a).length,2,'runner anchor: '+a);runner=runner.replace(a,b);}
edit("OUT='reports/anchor-spread-research'","OUT='reports/anchor-spread-burst'");
edit("const PROFILES=['decay-cycle-wand','hybrid-arcane-decay','hybrid-decay-blood','blood-spread-twohand','arcane-fire-wand'];","G.P['decay-burst-wand']={id:'decay-burst-wand',families:['decay'],w:'wand',skills:['corruption_cycle','contagious_touch'],role:'aoe'};\nconst PROFILES=['decay-cycle-wand','decay-burst-wand'];");
edit("const variants={base:overlay(false),full:overlay(true)};",`function burstReady(){
 const src=overlay(true);
 // The primary-paid predicate remains intact for persistence, paid action credit and propagation.
 let b=src[B];
 b=replace(b,"function decayState(c){","function burstEligibleRot(d){return d?.remaining>0&&d.damage>0&&(primaryPaidRot(d)||d.spread===true||d.transferred===true); }\\nfunction decayState(c){");
 assert.equal(b.split('.filter(primaryPaidRot)').length,3);
 b=b.replaceAll('.filter(primaryPaidRot)','.filter(burstEligibleRot)');
 // Overflow can use a fully prepared target on the next genuine attack without first rolling Toxic Touch.
 b=replace(b,'corruptionOverflow(b,c);}' ,' }');
 b=replace(b,' corruptionCycle(b,c);',' corruptionOverflow(b,c);\\n corruptionCycle(b,c);');
 // Observer-only metrics distinguish detonation of propagated stacks.
 b=replace(b,"c.metric?.('corruptionOverflowActivations',1);","c.metric?.('anchorSpreadOverflowPrepared',stacks.filter(d=>!primaryPaidRot(d)).length);c.metric?.('corruptionOverflowActivations',1);");
 b=replace(b,"const remaining=consumed.reduce","c.metric?.('anchorSpreadCycleConsumed',consumed.filter(d=>!primaryPaidRot(d)).length);\\n const remaining=consumed.reduce");
 src[B]=b;return src;
}
const variants={base:overlay(true),full:burstReady()};`);
edit("const src=variants[full?'full':'base'],root=","const src=variants[full?'full':'base'],root=");
edit("assert.equal(e.v012Rot[0].damage,full?100:30)","assert.equal(e.v012Rot[0].damage,100)");
edit("[full?100:30,100]","[100,100]");
edit("full?115:Math.round(115*.3)","115");
edit(" for(const id of PROFILES){const p=G.profile(id);paired(p,'normal-4',0);}",` // Native ability code: three pre-propagated stacks can detonate with no fresh paid application.
 for(const variant of ['base','full']){
  const root={WandererAutomaticTalents:T};new Function('globalThis','module',variants[variant][B])(root,undefined);
  const Bc=root.WandererV012Buildcraft;
  for(const overflow of [false,true]){
   const b=Bc.create();Bc.syncPermanent(b,buy(overflow?['corruption_cycle','corruption_nova']:['corruption_cycle']));
   const source={hp:100000,maxhp:100000,v012Rot:Array.from({length:overflow?6:3},()=>({damage:100,remaining:3,spread:true})),dots:{bleed:[],burn:[]}};
   const other={hp:100000,maxhp:100000,v012Rot:[],dots:{bleed:[],burn:[]}},r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:overflow?[source,other]:[source],stats:{attack:100,spellPower:50,attacksPerSec:1}},m={};
   const c={player:r,enemy:source,now:1,base:100,power:50,random:()=>.999999,waveKey:'spread',log(){},dot(){},damage(n){source.hp-=n;},talentPulseDamage(target,n){target.hp-=n;return n;},metric(k,n){m[k]=(m[k]||0)+n;},heal(){return 0;},barrier(){},mana(n){r.mp+=n;}};
   Bc.onAttack(b,c);
   if(variant==='base'){assert.equal(r.mp,100);assert.equal(source.v012Rot.length,overflow?6:3);}
   else if(overflow){assert.equal(m.corruptionOverflowActivations,1);assert.equal(m.anchorSpreadOverflowPrepared,6);assert(other.hp<other.maxhp);assert.equal(r.mp,84);assert.equal(m.anchorSpreadCycleConsumed,3);}
   else {assert.equal(m.corruptionCycleActivations,1);assert.equal(m.anchorSpreadCycleConsumed,3);assert.equal(m.corruptionCycleRawBurst,1830);assert.equal(r.mp,90);assert.equal(source.v012Rot.length,0);}
   assert.equal(m.decayPrimaryPaidApplications||0,0);assert.equal(m.contagiousTouchActivations||0,0);assert.equal(m.soulDrainMana||0,0);
   const mp=r.mp;Bc.onAttack(b,c);assert.equal(r.mp,mp,'cooldown prevents second payment');
  }
 }
 for(const id of PROFILES){const p=G.profile(id);if(id==='decay-burst-wand')assert(!p.t.nodes.includes('corruption_nova'),'three-stack profile must not own Overflow');paired(p,'normal-4',0);}`);
edit("const report={id,n:rows.length,profile:p,source:","const report={id,n:rows.length,profile:p,meaning:{base:'100% spread, original eligibility',full:'100% spread, propagated Rot eligible for Cycle and Overflow'},source:");
edit("No Blood Tribute change. Immediate burst coefficients remain historical; 100% applies only to copied stack.","No Blood Tribute change. Both arms have 100% spread. Base retains paid-primary burst eligibility; full allows propagated Rot in Cycle and Overflow and checks Overflow on normal attacks. No change to paid-application credit, cooldown, duration, caps or new propagation.");
edit("ANCHOR_SPREAD_OVERVIEW=","ANCHOR_SPREAD_BURST_OVERVIEW=");
edit("ANCHOR_SPREAD_SMOKE_OK","ANCHOR_SPREAD_BURST_SMOKE_OK");
new Function('require','module','__dirname','__filename',runner)(require,module,__dirname,__filename);
