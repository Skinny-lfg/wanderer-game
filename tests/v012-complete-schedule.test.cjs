const {test}=require('node:test'),assert=require('node:assert/strict');require('../online/v012-expedition-controller.js');const C=globalThis.WandererV012Expedition;
const themes=Object.keys(C.THEME_FAMILIES).map(id=>({id,name:id,image:id}));
test('new schedules have 15 Realms, 3–4 unique categorized events and two mandatory Elites',()=>{
 const counts=new Set();for(let seed=1;seed<=10;seed++){let n=seed*1000;const c=C.create(themes,()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296));c.start();c.chooseInitial('blood');const g=c.state;assert.equal(g.rooms.length,15);const ids=g.eventsByRealm.filter(Boolean);counts.add(ids.length);assert(ids.length===3||ids.length===4);assert.equal(new Set(ids).size,ids.length);assert.equal(g.rooms.filter(k=>k==='elite').length,2);c.restore(g);}assert.equal(counts.size,2);
});
test('three shared rerolls, no fourth, and exactly one saved boss card without acquiring a fourth affinity',()=>{
 const c=C.create(themes,()=>.4);c.start();c.chooseInitial('blood');for(let i=0;i<3;i++)c.reroll(i);assert.equal(c.state.rerolls,0);assert.throws(()=>c.reroll(0));
 const g=c.state;g.planeIndex=15;g.families=['blood','decay','magic'];g.offers=[];g.selected=null;g.rewardPending={};g.stage='choice';c.claimReward();assert.equal(g.offers.length,1);assert(g.families.includes(g.offers[0].family));assert.throws(()=>c.reroll(0));assert.equal(Object.keys(C.REALMS).length,12);
});
