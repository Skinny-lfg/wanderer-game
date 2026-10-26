const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};vm.runInNewContext(fs.readFileSync('online/v013-expedition-map.js','utf8'),env);const M=env.WandererV013ExpeditionMap;
function calendar(seed){let n=seed>>>0;const random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);const eventCount=3+(random()<.5?0:1),rooms=Array(15).fill('combat');rooms[14]='boss';const windows=eventCount===4?[[3,4,5],[6,7,8],[9,10,11],[12,13,14]]:[[3,4,5],[7,8,9],[11,12,13]];for(const w of windows)rooms[w[Math.floor(random()*w.length)]-1]='event';const elite=Array.from({length:13},(_,i)=>i+1).filter(i=>rooms[i]==='combat');for(let i=elite.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[elite[i],elite[j]]=[elite[j],elite[i]];}for(const i of elite.slice(0,2))rooms[i]='elite';return rooms;}
test('10,000 deterministic route maps preserve calendar, branch reachability, and boss access',()=>{
 for(let seed=0;seed<10000;seed++){
  const rooms=calendar(seed),a=M.create(seed,rooms),b=M.create(seed,rooms);assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
  assert.equal(a.rows.length,15);assert.equal(a.nodes.length,41);assert.equal(a.rows[14][0].kind,'boss');assert.equal(rooms.filter(k=>k==='elite').length,2);assert(rooms.filter(k=>k==='event').length>=3&&rooms.filter(k=>k==='event').length<=4);
  let path=a.rows[0][0];for(let realm=1;realm<15;realm++){const choices=M.successors(a,path.id);assert(choices.length>=1&&choices.length<=3);path=a.nodes.find(n=>n.id===choices[0]);}assert.equal(path.id,'r15n0');
  M.validate(a,rooms);
 }
});
test('route choices are single-use, require availability, and expose only valid successors',()=>{
 const rooms=calendar(42),map=M.create(42,rooms),root=map.rows[0][0].id;assert.equal(M.choose(map,'r2n1'),false);assert.equal(M.choose(map,root),true);assert.equal(M.choose(map,root),false);assert.equal(M.complete(map,root),true);assert.equal(M.complete(map,root),false);assert.equal(map.availableNodeIds.length,3);assert(M.validate(map,rooms));
});
