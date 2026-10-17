const test=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('../scripts/simulate-v091.cjs');
const {context,compose,caseList,fixtures,aggregate}=require('../scripts/v010-abilities-sim.cjs');
const {makeExample}=require('../scripts/v010-legendary-audit.cjs');

test('instrumented baseline preserves production combat outcome',()=>{
 const plain=harness('index.html',{legendary:true}),measured=context('baseline');
 const snapshot=caseList(measured,'Frost',40)[0].s;
 const options={level:40,weapon:snapshot.equip.weapon.subtype,equipment:snapshot.equip,runes:snapshot.runes,runeSlots:snapshot.runeSlots,seed:17731,theme:'frost',elite:'tank'};
 const a=plain.trial(options),b=measured.trial(options);
 for(const field of ['win','hp','seconds','damageIn','damageOut','gold','fragments','loot'])assert.equal(a[field],b[field],field);
});
test('Winterheart signature is executed without changing saved affinity',()=>{
 const enabled=context('baseline'),disabled=harness('index.html',{legendary:true,transform:compose(['baseline'],['winterheart-spire'])});
 const ex=makeExample(enabled,'frost','winterheart-spire','weapon','Staff');
 const item=ex[0].s.equip.weapon;
 assert.equal(item.legendaryId,'winterheart-spire');assert.equal(item.effect,'slow');
 const options={level:100,weapon:'Staff',equipment:ex[0].s.equip,seed:18131,theme:'frost',elite:'tank',diagnostics:true};
 const on=enabled.trial(options),off=disabled.trial(options);
 assert((on.legendaryProcs.Winterheart||0)>0);assert.equal(off.legendaryProcs.Winterheart||0,0);
 assert.equal(item.effect,'slow');
});
test('Double Strike remains bounded to at most one extra main-hand hit',()=>{
 const c=context('doubleB'),ex=caseList(c,'Daggers',40),out=aggregate(c,ex,40,32);
 assert(out.doubleStrikes>0);assert(out.doubleStrikes<=out.attackCount);
 assert(out.doubleDamage>0);
});
test('generated legal gear fixtures repeat from a fixed seed',()=>{
 const c=context('baseline'),gearA=fixtures(c,'Frost',160),gearB=fixtures(c,'Frost',160);
 const projection=rows=>rows.map(x=>Object.values(x.s.equip).map(item=>[item.slot,item.subtype,item.effect,item.tier,item.rarity,item.atk,item.hp,item.spell]));
 assert.deepEqual(projection(gearA),projection(gearB));
});
