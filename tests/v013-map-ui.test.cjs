'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
require('../online/v013-map-intelligence.js');
const I=globalThis.WandererV013MapIntelligence;
require('../combat/v013-expedition-foundation.js');
require('../online/v013-boss-modifiers.js');
require('../online/v013-boss-preparation.js');
const M=globalThis.WandererV013BossModifiers;
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('function dungeonMapMarkup(g){'),end=html.indexOf('\nfunction renderRealmCards(g){',start);
assert(start>0&&end>start);
function view(d){
 const card={id:'forge',name:'Crimson Dominion',family:'blood',risk:1,stepLimit:13,shortcut:1,
  nodes:[{kind:'entrance'},{kind:'combat',range:[2,4],count:3},{kind:'combat',range:[2,4],count:3},{kind:'boss',escorts:1}],
  edges:[[0,1],[1,2],[1,3],[2,3]],positions:[[10,50],[40,50],[70,30],[90,50]]};
 const control={realmMap:()=>card,travelPath:id=>I.route(card,d,id),exitCount:id=>I.exitCount(card,d,id)};
 const context={WandererV013MapIntelligence:I,WandererV013BossModifiers:M,WandererV013BossPreparation:globalThis.WandererV013BossPreparation,phase1Controller:control,
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
test('unrevealed exit stubs extend the same curve once the room is revealed',()=>{
 const d={current:0,visited:[0],cleared:[0],scouted:[],discoveredSecrets:['1-2'],steps:12};
 const before=view(d),after=view({...d,scouted:[2]});
 const full=after.match(/data-room-edge="1-2" d="M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/);
 assert(full,'revealed path exists');const [x,y,ax,ay,bx,by,u,v]=full.slice(1).map(Number),t=.38,lerp=(a,b)=>a+(b-a)*t;
 const p1x=lerp(x,ax),p1y=lerp(y,ay),p2x=lerp(p1x,lerp(ax,bx)),p2y=lerp(p1y,lerp(ay,by));
 const expected=[x,y,p1x,p1y,p2x,p2y,lerp(p2x,lerp(lerp(ax,bx),lerp(bx,u))),lerp(p2y,lerp(lerp(ay,by),lerp(by,v)))];
 const stubs=[...before.matchAll(/class="realmExitStub" data-exit-from="1" d="M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/g)];
 assert(stubs.some(m=>m.slice(1).map(Number).every((value,i)=>Math.abs(value-expected[i])<1e-9)),'stub matches the revealed curve');
 const locked=view({...d,discoveredSecrets:[]});assert(!locked.includes('data-room-edge="1-2"'),'secret passage stays hidden');
});
test('combat node shows its enemy group range in the node frame',()=>{
 const html=view({current:0,visited:[0],cleared:[0],scouted:[],discoveredSecrets:[],steps:12});
 assert.match(html,/realmNodeLabel">Combat<\/span><small[^>]*>2–4 enemies<\/small>/);
});
test('each Affinity map artwork exists in source and Pages and maps by family',()=>{
 const css=fs.readFileSync('online/v013-stage45-map-qa.css','utf8');
 for(const family of ['blood','decay','vitality','aegis','fury','magic']){
  assert(css.includes('[data-map-affinity="'+family+'"]{background-image:linear-gradient(#14101644,#14101677),url("../assets/expedition-map/'+family+'.webp")}'),family);assert(fs.readFileSync('assets/expedition-map/'+family+'.webp').equals(fs.readFileSync('docs/assets/expedition-map/'+family+'.webp')));
  const image=fs.readFileSync('assets/expedition-map/'+family+'.png'),page=fs.readFileSync('docs/assets/expedition-map/'+family+'.png');
  assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert(image.equals(page),family+' Pages artwork differs');
 }
});
test('only actually traversed edges render solid',()=>{
 const d={current:1,visited:[0,1],cleared:[0,1],scouted:[2],discoveredSecrets:['1-2'],traversedEdges:['0-1'],steps:12};
 const html=view(d),edge=id=>html.match(new RegExp('data-room-edge="'+id+'"[^>]+'))?.[0]||'';
 assert.match(edge('0-1'),/stroke-dasharray="none"/);assert.match(edge('1-2'),/stroke-dasharray="3 6"/);
});
