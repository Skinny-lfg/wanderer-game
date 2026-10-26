/* Isolated v0.13 map prototype invariants. No network, account, or save access. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const mapUrl=pathToFileURL(path.resolve(__dirname,'../online/v013-map-prototype.js')).href;
const apiPromise=import(mapUrl).then(()=>globalThis.WandererV013MapPrototype);
test('deterministic generation, valid calendar and accessible boss',async()=>{
 const api=await apiPromise;
 for(let seed=0;seed<2000;seed++){
  const map=api.create(seed,{eventCount:seed%2?3:4});
  assert.equal(api.validate(map),true);
  assert.equal(map.rows.length,15);
  assert.equal(map.nodes.length,41);
  assert.equal(map.edges.length,78);
  assert.equal(map.rows.filter(r=>r[0].kind==='elite').length,2);
  assert.equal(map.rows.filter(r=>r[0].kind==='event').length,seed%2?3:4);
  assert.equal(api.walk(map).length,15);
  assert.equal(api.walk(map).at(-1).id,map.bossId);
  if(seed%100===0)assert.deepEqual(api.create(seed,{eventCount:seed%2?3:4}),map);
 }
});
test('every reachable node has a path to boss; no wrong-way edges',async()=>{
 const api=await apiPromise;
 for(let seed=2000;seed<2040;seed++){
  const map=api.create(seed);
  for(const row of map.rows)for(const node of row){
   let frontier=[node.id];
   while(frontier.length&&frontier[0]!==map.bossId){const target=frontier.shift();frontier.push(...api.next(map,target).map(n=>n.id));}
   assert.equal(frontier[0],map.bossId);
  }
 }
});
test('seed and event count invalid inputs fail closed',async()=>{
 const api=await apiPromise;
 for(const value of [-1,4294967296,NaN,'x',1.25])assert.throws(()=>api.create(value));
 assert.throws(()=>api.create(1,{eventCount:0}));
 assert.throws(()=>api.create(1,{eventCount:5}));
});
test('isolated generator cannot mutate player state or live service',async()=>{
 const api=await apiPromise;
 const before=JSON.stringify({profile:{gold:100,gear:[1,2]},runes:[8]});
 const map=api.create(412);api.walk(map,[0,1,2,0]);
 assert.equal(before,JSON.stringify({profile:{gold:100,gear:[1,2]},runes:[8]}));
 assert.equal(map.version,13);
});