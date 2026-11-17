'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
require('../online/v013-map-intelligence.js');
const I=globalThis.WandererV013MapIntelligence;
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('function dungeonMapMarkup(g){'),end=html.indexOf('\nfunction renderRealmCards(g){',start);
assert(start>0&&end>start);
function view(d){
 const card={id:'forge',name:'Crimson Dominion',family:'blood',risk:1,stepLimit:13,shortcut:1,
  nodes:[{kind:'entrance'},{kind:'combat',range:[2,4],count:3},{kind:'combat',range:[2,4],count:3},{kind:'boss',escorts:1}],
  edges:[[0,1],[1,2],[1,3],[2,3]],positions:[[10,50],[40,50],[70,30],[90,50]]};
 const control={realmMap:()=>card,travelPath:id=>I.route(card,d,id),exitCount:id=>I.exitCount(card,d,id)};
 const context={WandererV013MapIntelligence:I,phase1Controller:control,
  esc:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),realmDifficulty:c=>['Guarded','Dangerous','Brutal'][c.risk],
  dungeonImage:()=>'',dungeonRoomLabel:n=>n.kind==='combat'?'Patrol':n.kind};
 vm.runInNewContext(html.slice(start,end)+'\nthis.map=dungeonMapMarkup;',context);
 return context.map({dungeon:d,history:[]});
}
test('room cards show real exit counts, no hidden secret SVG connector',()=>{
 const d={current:0,visited:[0,1],cleared:[0,1],scouted:[2],discoveredSecrets:[],steps:12};
 const before=view(d);assert.match(before,/data-dungeon-room="2"/);
 assert.match(before,/mapExitCount/);assert.match(before,/1 exit/);
 assert(!before.includes('data-room-edge="1-2"'));
 assert(before.includes('Scouted'));
 const after=view({...d,discoveredSecrets:['1-2']});
 assert(after.includes('data-room-edge="1-2"'));
 assert.match(after,/2 exits/);
});
