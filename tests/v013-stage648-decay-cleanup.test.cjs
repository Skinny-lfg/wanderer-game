'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const retired=['rot_focus','spore_mark','venom_shatter','rot_recovery','rot_ward','rot_symbiosis'];
const files=['combat/v012-buildcraft.js','combat/talent-catalog.js','combat/talent-graph-next.js','combat/talent-graph-bridge.js','combat/talent-graph-runtime.js'];
test('retired Decay IDs are absent from live combat, catalog, graph and mirrored runtime',()=>{
 for(const path of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-catalog.js']){
  const src=fs.readFileSync(path,'utf8');assert.equal(src,fs.readFileSync('docs/'+path,'utf8'));
  for(const id of retired)assert(!src.includes(id),path+' '+id);
 }
 const progress={...T.create(),xp:10000};
 for(const id of retired){assert(!T.NODES.some(n=>n.id===id||n.passiveId===id||n.effectId===id));assert.equal(T.allocate(progress,id),null);}
 const decay=buy(['toxic_touch','corruption_cycle','corruption_nova','soul_drain']);
 const b=globalThis.WandererV012Buildcraft.create();globalThis.WandererV012Buildcraft.syncPermanent(b,decay,true);
 assert.deepEqual(b.picks,[]);
 for(const id of retired)assert.equal(globalThis.WandererV012Buildcraft.rank(b,id),0);
});
test('current graph is identical to pre-cleanup, including all active skills and stat nodes',()=>{
 const ctx=vm.createContext({});
 for(const file of files)vm.runInContext(execFileSync('git',['show','1ee43d1e865a7351cb4a5adafa86f98dd7a08314:'+file],{encoding:'utf8',maxBuffer:8*1024*1024}),ctx,{filename:file});
 assert.equal(JSON.stringify(T.NODES),JSON.stringify(ctx.WandererAutomaticTalents.NODES));
});
