'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../scripts/v013-b83-natural-pilot.cjs');
test('B8.3 uses five fresh shared seed blocks and exact B8.2 policy',()=>{const m=P.manifest();assert.equal(m.accounts,140);assert.equal(m.policy,'b8.2-combat-aware');assert.equal(new Set(m.seeds).size,5);});
test('Pilot separates unresolved technical outcomes, defeats and empty levels',()=>{
 const a={index:0,endLevel:2,attempts:[{level:1,bossWon:true,rooms:[{roomType:'combat',initialEnemies:1,won:true},{roomType:'combat',initialEnemies:4,timedOut:true},{roomType:'boss',won:true}]}]},b={index:1,endLevel:1,attempts:[{level:1,status:'defeat',surrendered:true,rooms:[{roomType:'combat',initialEnemies:4,surrendered:true}]}]};
 const p=P.progression([a,b]);assert.equal(p[0].entered,2);assert.equal(p[0].cleared,1);assert.equal(p[1].entered,0);assert.equal(p[1].unlocked,1);assert.equal(p[0].byType.normal.attempted,3);assert.equal(p[0].byType.normal.resolved,2);assert.equal(p[0].byType.normal.winPct,50);assert.equal(p[0].byType.normal.timeouts,1);assert.equal(p[1].byType.normal.winPct,null);
});
