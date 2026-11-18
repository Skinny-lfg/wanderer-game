'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../online/v013-map-intelligence.js');
const I=globalThis.WandererV013MapIntelligence;
const F=require('../combat/v013-expedition-foundation.js');
require('../online/v012-expedition-controller.js');
const E=globalThis.WandererV012Expedition;
const themes=Object.entries(E.REALMS).map(([id,[family,name]])=>({id,family,name}));
const seeded=seed=>{let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);};
function start(seed){const e=E.create(themes,seeded(seed));e.start(1,{freeBuild:true,dungeon:true});return e;}

test('exits count only real connections and hide the secret until discovered',()=>{
 const card={nodes:Array.from({length:6},()=>({kind:'combat'})),edges:[[0,1],[1,2],[2,3],[2,4],[3,4],[3,5]],shortcut:2};
 const state={current:0,visited:[0],cleared:[0],scouted:[],discoveredSecrets:[]};
 assert.equal(I.exitCount(card,state,2),2);assert.equal(I.exitCount(card,state,3),2);
 assert.equal(I.unlocked(card,state,2,3),false);
 state.discoveredSecrets.push('2-3');assert.equal(I.exitCount(card,state,2),3);assert.equal(I.exitCount(card,state,3),3);
 assert.equal(I.unlocked(card,state,2,3),true);
 assert.throws(()=>I.exitCount(card,state,-1));
});
test('step cost exactly preserves legacy cleared-corridor discount, including empty routes',()=>{
 const legacy=(route,cleared)=>{let cost=0,consecutive=0;for(const room of route.slice(1)){if(cleared.includes(room))consecutive++;else{cost+=Math.min(2,consecutive)+1;consecutive=0;}}return cost+Math.min(2,consecutive);};
 for(let seed=0;seed<1000;seed++){
  let value=seed>>>0;const random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
  const path=Array.from({length:12},(_,i)=>i),cleared=path.filter(()=>random()<.6);
  assert.equal(I.travelCost(path,cleared),legacy(path,cleared));
 }
 assert.equal(I.travelCost([0],[0]),0);assert.equal(I.travelCost([],[]),Infinity);
});
test('minimum-cost path can choose a longer corridor with fewer steps',()=>{
 // Short path traverses visited but uncleared rooms; longer cleared route costs less.
 const card={nodes:Array.from({length:7},()=>({})),edges:[[0,4],[4,5],[5,6],[0,1],[1,2],[2,3],[3,6]],shortcut:null};
 const d={current:0,visited:[0,1,2,3,4,5,6],cleared:[0,1,2,3,6],discoveredSecrets:[]};
 const path=I.route(card,d,6);assert.deepEqual(path,[0,1,2,3,6]);
 assert.equal(I.travelCost(path,d.cleared),2);assert.equal(I.travelCost([0,4,5,6],d.cleared),3);
});
test('paths cannot cross unexplored intermediate rooms or undiscovered secrets',()=>{
 const card={nodes:Array.from({length:5},()=>({})),edges:[[0,1],[1,2],[2,3],[0,4]],shortcut:1};
 const d={current:0,visited:[0,1],cleared:[0,1],discoveredSecrets:[]};
 assert.deepEqual(I.route(card,d,1),[0,1]);assert.deepEqual(I.route(card,d,2),[]);
 assert.deepEqual(I.route(card,d,3),[]);
 d.discoveredSecrets=['1-2'];assert.deepEqual(I.route(card,d,2),[0,1,2]);
 assert.deepEqual(I.route(card,d,3),[]);
});
test('scouting reveals two nearby nonvisited rooms and never modifies visit/step state',()=>{
 const card={nodes:Array.from({length:8},()=>({})),edges:[[0,1],[1,2],[1,3],[2,4],[2,5],[3,6],[5,7]],shortcut:null};
 const d={current:1,visited:[0,1],cleared:[0,1],steps:12,scouted:[],discoveredSecrets:[]};
 const before=JSON.stringify(d),info=I.scout(card,d,2);
 assert.equal(info.rooms.length,2);assert(info.rooms.every(id=>!d.visited.includes(id)&&id!==d.current));
 assert.equal(JSON.stringify(d),before);
});
test('10k native maps retain 18/20/22 rooms, 14/13/12 steps and valid stage0 manifests',()=>{
 for(let seed=0;seed<10000;seed++){
  const e=start(seed),d=e.state.dungeon;
  assert.equal(d.cards.length,3);assert.deepEqual(d.cards.map(c=>c.nodes.length),[18,20,22]);
  assert.deepEqual(d.cards.map(c=>c.stepLimit),[14,13,12]);
  assert.deepEqual(d.foundationManifest.cards.map(c=>c.realmId),d.cards.map(c=>c.id));
  assert.equal(new Set(d.foundationManifest.cards.map(c=>c.conditionId)).size,3);
  for(const c of d.cards){const normal=c.edges.filter(([a,b])=>!I.secretEdge(c,a,b));
   assert(normal.length>0);for(let id=0;id<c.nodes.length;id++)assert.equal(I.exitCount(c,{visited:[0],discoveredSecrets:[]},id),new Set(normal.filter(e=>e.includes(id)).map(([a,b])=>a===id?b:a)).size);
   const queue=[[0]],seen=new Set([0]);let bossPath=null;
   for(const path of queue){const last=path.at(-1);if(last===c.nodes.length-1){bossPath=path;break;}
    for(const next of I.neighbors(c,{visited:[0],discoveredSecrets:[]},last))if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}
   }
   assert(bossPath,'no normal route to boss');assert(bossPath.length-1<=c.stepLimit,'initial step budget cannot reach boss');
  }
 }
});
test('native controller integrates route, scouting and the deterministic foundation ledger',()=>{
 const c=start(45),id=c.state.dungeon.cards[1].id;c.chooseRealm(id);
 const d=c.state.dungeon;assert.equal(F.validateExpeditionState(d.foundationState,d.foundationManifest),true);
 assert.equal(c.exitCount(0),4);
 const previous={visited:[...d.visited],cleared:[...d.cleared],steps:d.steps};
 const preview=c.scoutPreview(2),result=c.scoutRooms(2);
 assert.deepEqual(result,preview);assert.deepEqual(d.scouted,result.rooms);
 assert.deepEqual(d.visited,previous.visited);assert.deepEqual(d.cleared,previous.cleared);assert.equal(d.steps,previous.steps);
 assert.equal(F.validateExpeditionState(d.foundationState,d.foundationManifest),true);
 assert.deepEqual(d.foundationState.knownRooms.slice(1),d.scouted);
 assert.deepEqual(c.scoutRooms(2).rooms.every(x=>!d.scouted.slice(0,2).includes(x)),true);
});
test('index loads foundation and intelligence before expedition controller and hides secret SVG links',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const f=html.indexOf('src="combat/v013-expedition-foundation.js"');
 const i=html.indexOf('src="online/v013-map-intelligence.js"');
 const c=html.indexOf('src="online/v012-expedition-controller.js"');
 assert(f>0&&i>f&&c>i);
 assert.match(html,/phase1Controller\.exitCount\(i\)/);
 assert.match(html,/WandererV013MapIntelligence\.unlocked\(c,d,a,b\)/);
 assert.match(html,/phase1Controller\.scoutPreview\(2\)/);
});

test('native Oracle event transaction reveals two other rooms, consumes no steps and records decisions',()=>{
 const create=require('./v012-economy-harness.cjs');
 const a=create(9101,undefined,{}, {skipPersistence:true});a.setUnlocked(70);a.start(70,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[1];c.chooseRealm(card.id);
 // Synthetic event placement tests the real transaction without depending on room RNG.
 card.nodes[1].kind='event';card.nodes[1].event='oracle_of_paths';
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 const preview=c.scoutPreview(2),steps=g.dungeon.steps;
 assert.equal(preview.rooms.length,2);assert(!preview.rooms.includes(1));
 assert.equal(a.events.choose(0),true);
 assert.deepEqual(g.dungeon.scouted,preview.rooms);assert.equal(g.dungeon.steps,steps);
 assert.equal(g.dungeon.foundationState.decisions.filter(x=>x.type==='reveal_room').length,2);
 assert.equal(g.stage,'choice');
});
