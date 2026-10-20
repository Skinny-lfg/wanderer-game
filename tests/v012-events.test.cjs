const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={};
vm.runInNewContext(fs.readFileSync(path.join(root,'online/v012-events.js'),'utf8'),ctx);
const api=ctx.WandererV012Events;
const valid={level:20,gold:1000,fragments:1000,hp:150,maxhp:200,mp:15,maxmp:80};
test('12 distinct events: exactly two bounded options in 4 categories',()=>{
 assert.equal(api.CATALOG.length,12);assert.equal(new Set(api.CATALOG.map(e=>e.id)).size,12);
 const counts={};for(const e of api.CATALOG){
  counts[e.group]=(counts[e.group]||0)+1;
  assert.equal(api.options(e.id).length,2);
  for(const o of api.options(e.id)){
   const outcome=api.resolve(e.id,o.id,valid,()=>.15);
   for(const f of ['gold','fragments','hp','mp','attack','defense','loot'])assert(Number.isFinite(outcome[f]),f+' '+e.id+'/'+o.id);
   assert(outcome.gold+valid.gold>=0&&outcome.fragments+valid.fragments>=0);
   assert(outcome.hp+valid.hp>=1&&outcome.hp+valid.hp<=valid.maxhp);
   assert(outcome.mp+valid.mp<=valid.maxmp);
   assert(Math.abs(outcome.attack)<=.10&&Math.abs(outcome.defense)<=.10);
   assert(outcome.loot>=0&&outcome.loot<=1);
  }
 }
 assert.deepEqual(counts,{trade:3,pact:3,treasure:3,survival:3});
});
test('event resource and health costs cannot kill or spend negative resources',()=>{
 const poor={level:200,gold:0,fragments:0,hp:2,maxhp:200,mp:0,maxmp:0};
 for(const [eventId,id] of [['cursed_altar','blood'],['traveling_merchant','scroll'],['smugglers_caravan','strength']])
  assert.throws(()=>api.resolve(eventId,id,poor),/Not enough resources/);
 assert.throws(()=>api.resolve('bad','foo',valid),/Unknown/);
 assert.throws(()=>api.resolve('cursed_chest','unknown',valid),/not offered/);
});
test('Expedition HTML loads event decision module and guards older saves',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert(html.includes('<script src="online/v012-events.js"></script>'));
 assert(html.includes('function phase1ResolveEvent(choiceId)'));
 assert(html.includes('phase1Controller.eventWon()'));
 assert(html.includes('phase3LootIds.add(item.id)'));
 assert(html.includes('PHASE3_BAG_CAPACITY=6'));
 assert(html.includes('else if(plane.eventId){if(phase5Persist())render();}'));
});