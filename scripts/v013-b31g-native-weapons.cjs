'use strict';
// B3.1G native consolidation: direct generator and browser replay.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const create=require('../tests/v012-economy-harness.cjs'),S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),B=require('./v013-b31b-twohand-compensation.cjs'),C=require('./v013-b31c-compensation-validation.cjs'),D=require('./v013-b31d-staff-economy.cjs'),P=require('./v013-b31d-physical-stack.cjs');
const BASE='f5ab8322d63d76c3ab7d366652205adb1d841326',OUT='reports/b31g',OLD='reports/b31f-reference',SEED=102500001,INDICES=[0,1,2,3,4,19,37,49,73,99],SC=A.scenarios.filter(s=>['solo','group12','boss'].includes(s.id)),specs={physical:P.specs,staff:D.specs};
const paths=['economy/v013-gear-rolls.js','combat/v012-combat-runtime.js','combat/v012-buildcraft.js'];
const oldSource=p=>execFileSync('git',['show',BASE+':'+p],{encoding:'utf8'});
const clone=x=>JSON.parse(JSON.stringify(x));
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function api(source){const ctx={};vm.runInNewContext(source,ctx);return ctx.WandererV013GearRolls;}
const mean=(rows,f)=>rows.reduce((n,x)=>n+f(x),0)/rows.length;
function expected(x){const o=clone(x);if(o.slot==='weapon'){if(['Bow','Two-Handed'].includes(o.subtype))o.atk*=1.5;if(o.subtype==='Staff')o.spell*=2;}return o;}
function assertRoll(before,after,label){assert.deepEqual(clone(after),expected(before),label);}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function gate(){
 const changed=execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy'],{encoding:'utf8'}).trim().split('\n').sort();
 assert.deepEqual(changed,[...paths,...paths.map(p=>'docs/'+p)].sort());
 for(const p of paths)assert.equal(fs.readFileSync(p,'utf8'),fs.readFileSync('docs/'+p,'utf8'),p+' mirror');
 const old=api(oldSource(paths[0])),native=api(fs.readFileSync(paths[0],'utf8')),types=['Sword','Mace','Daggers','Bow','Two-Handed','Wand','Staff','Shield','Off-Hand Dagger','Orb','Tome','Charm'],rarities=['Common','Uncommon','Rare','Epic','Legendary'];
 let rolls=0,halfPoints=0;
 for(const [j,subtype] of types.entries())for(const rarity of rarities)for(const tier of [1,5,10,50,100,200])for(let i=0;i<20;i++){
  const item={slot:j<7?'weapon':'offhand',subtype,rarity,tier},power=2+tier*.91,seed=102600001+i*127+tier*17+j*31;
  const before=old.apply({...item},power,rng(seed)),after=native.apply({...item},power,rng(seed));assertRoll(before,after,'Generator '+subtype+'/'+rarity+'/'+tier);rolls++;if(after.atk%1===.5)halfPoints++;
  // Re-rolling the same object must reset all affixes; no multiplicative accumulation.
  const again=native.apply(clone(after),power,rng(seed));assert.deepEqual(clone(again),clone(after),'Repeated roll drift');
 }
 const overrides={'economy/v013-gear-rolls.js':oldSource(paths[0])},opts={skipPersistence:true,now:1720000000000};
 const before=create(102610001,undefined,overrides,opts),after=create(102610001,undefined,{},opts);
 let sources=0,previews=0;
 for(const tier of [1,10,50,100])for(const subtype of types.slice(0,7))for(const source of ['loot','merchant','forge'])for(const rarity of ['Common','Rare','Epic']){
  const x=before.makeItem(tier,'weapon',null,source,subtype,rarity),y=after.makeItem(tier,'weapon',null,source,subtype,rarity);
  // compare the roll and all metadata except identity/time; both harnesses have the same seed.
  const clean=o=>Object.fromEntries(Object.entries(clone(o)).filter(([k])=>!['id','obtainedAt'].includes(k)));
  assertRoll(clean(x),clean(y),source+'/'+subtype+'/'+tier+'/'+rarity);
  if(['Bow','Two-Handed'].includes(subtype))assert(after.gear.itemStats(y).includes('+'+y.atk+' '),'Attack tooltip value '+subtype);
  if(subtype==='Staff')assert(after.gear.itemStats(y).includes('+'+y.spell+' '),'SP tooltip value');
  sources++;
 }
 for(const id of ['blue_bow','blue_greatsword','blue_staff','blue_wand','blue_sword'])for(const tier of [1,10,50,100]){
  const x=before.forge.preview(id,tier),y=after.forge.preview(id,tier);assert(x&&y,'Missing Forge preview '+id);
  assertRoll(x,y,'Forge preview '+id);previews++;
 }
 // Old items: saved values remain exactly as stored. No derived multiplier.
 for(const subtype of ['Bow','Two-Handed','Staff']){
  const x=create(102620001,undefined,overrides,opts),y=create(102620001,undefined,{},opts);
  x.setup(5,subtype,'Rare');y.setup(5,subtype,'Rare');
  for(const [slot,o] of Object.entries(x.state().equip))y.state().equip[slot]=clone(o);
  assert.deepEqual(clone(y.baseStats()),clone(x.baseStats()),'Existing gear stat drift '+subtype);
  assert.deepEqual(clone(y.state().equip),clone(x.state().equip),'Existing item mutated');
 }
 const r={commit:process.env.GITHUB_SHA,rolls,halfPoints,sourceItems:sources,forgePreviews:previews,mirrors:3,legacyItemsPreserved:true,tooltipValuesVerified:true};
 write('gate',r);console.log('B31G_GATE='+JSON.stringify(r));
}
function replay(kind,si){
 const st=specs[kind][si];assert(st);const cases=[];
 for(let ci=0;ci<SC.length;ci++){
  const sc=SC[ci],x=JSON.parse(fs.readFileSync(OLD+'/'+kind+'-'+si+'-'+ci+'.json','utf8'));assert.equal(x.commit,BASE);assert.equal(x.study,st.id);assert.equal(x.scenario,sc.id);assert.equal(x.cases.length,100);
  const target=kind==='staff'?'hit160-spell200-cost75':'approved+atk150',refs=kind==='staff'?D.ARMS.filter(a=>a.reference).map(a=>a.loadout):[st.ref[0]],arms=[[target,st.weapon,null],...refs];
  for(const i of INDICES){
   for(const arm of arms){
    const old=x.cases[i].rows.find(r=>r.id===arm[0]);assert(old,'Missing historical arm '+arm[0]);const src=B.sources('Staff',{factor:1.32,reference:true});
    const runtime=kind==='staff'?C.manaRuntime(src.runtime,1):src.runtime;
    const next=A.cell(st,sc,i,arm,null,{id:arm[0],seedBase:SEED,runtime,buildcraft:src.buildcraft,manaAudit:kind==='staff',recordAbilityMetrics:kind==='staff',recordWeaponSpell:kind==='staff',recordWeaponAttack:true});
    const fields=['seed','resolved','rosterHash','nonHands','nodes','profile','weapon','off','armor','stats','won','died','surrendered','timeout','seconds','firstKill','damage','secondary','secondaryDot','secondaryHits','pierced','taken','absorbed','healing','barrier','orbBarrier','tomeMana','manaSpent','mpEnd','mpMax','unfunded','hpEnd','hpMax','mainHits','directBase','directRaw','directActual','fundedHits','infusionDamage','offHits','offDamage','secondaryBleed','secondaryRot','offBleed','offRot'];
    if(kind==='staff'){fields.push('abilityMetrics','infusionActivations','infusionHits','manaLedger','manaStarvedSeconds','mpStart');assert.equal(next.weaponSpell,old.weaponSpell*(arm[0]===target?2:1));}
    for(const k of fields)assert.deepEqual(next[k],old[k],st.id+'/'+sc.id+'/'+i+'/'+arm[0]+'/'+k);
    if(arm[0]!==target)assert.equal(next.gearHash,old.gearHash,'One-hand gear drift');
    cases.push({study:st.id,scenario:sc.id,seed:next.seed,arm:arm[0],matched:true,attack:next.stats.attack,spellPower:next.stats.spellPower,weaponAttack:next.weaponAttack,weaponSpell:next.weaponSpell,won:next.won,timeout:next.timeout,surrendered:next.surrendered});
   }
  }
 }
 assert.equal(cases.length,kind==='staff'?90:60);write(kind+'-'+si,{kind,si,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,cases});console.log('B31G_REPLAY='+JSON.stringify({kind,study:st.id,matched:cases.length}));
}
function aggregate(){
 const xs=Object.entries(specs).flatMap(([kind,ss])=>ss.map((_,si)=>JSON.parse(fs.readFileSync(OUT+'/'+kind+'-'+si+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);for(const x of xs)assert.equal(x.commit,process.env.GITHUB_SHA);
 const gate=JSON.parse(fs.readFileSync(OUT+'/gate.json','utf8'));assert.equal(gate.commit,process.env.GITHUB_SHA);const cases=xs.flatMap(x=>x.cases);
 assert.equal(cases.length,1350);assert(cases.every(c=>c.matched&&!c.timeout));
 const summary={commit:process.env.GITHUB_SHA,baseline:BASE,native:xs[0].native,gate,matched:cases.length,physical:xs.filter(x=>x.kind==='physical').reduce((n,x)=>n+x.cases.length,0),staff:xs.filter(x=>x.kind==='staff').reduce((n,x)=>n+x.cases.length,0),surrenders:cases.filter(c=>c.surrendered).length,scope:'Native gear generation and native damage/mana formulas. 10 exact historical matched seeds per profile/scenario/arm, telemetry only; no derived-stat tuning overrides. New-roll only, existing saved items unchanged.',cases};write('summary',summary);console.log('B31G_OVERVIEW='+JSON.stringify({...summary,cases:undefined}));
}
const [cmd,kind,si]=process.argv.slice(2);if(cmd==='gate')gate();else if(cmd==='replay')replay(kind,Number(si));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
