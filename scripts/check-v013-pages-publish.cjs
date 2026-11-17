'use strict';
const {readFileSync}=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=readFileSync('docs/index.html','utf8'),save=readFileSync('docs/online/v012-save.js','utf8');
assert(html.includes('<title>Wanderer v0.13</title>'),'Must publish v0.13');
assert(html.includes('const PHASE5_VALIDATION=true;'),'No cloud/online saves in Pages build');
assert(html.includes('globalThis.__WANDERER_CLOUD_ONLY__=false;'),'Local isolated playtest only');
assert(/PREFIX='wanderer_automatic_rpg_preview_v8_'/.test(save),'Missing isolated fresh v8 save namespace');
assert(!/<script[^>]+src="online\/(?:firebase-client|v012-auth-bootstrap|v012-account|v012-feedback|v012-leaderboard-ui)\./.test(html),'Cloud scripts must not load');
const match=html.match(/<script id="v013-preview-save-reset">([\s\S]*?)<\/script>/);
assert(match,'One-time preview reset script not found');
const initial=new Map([
 ['wanderer_automatic_rpg_preview_v7_local','old-data'],
 ['wanderer_automatic_rpg_preview_v6_other_backup','old-data'],
 ['wanderer_automatic_rpg_preview_v1_local_source','old-data'],
 ['wanderer_automatic_rpg_preview_v8_local','new-data'],
 ['wanderer_v012_endless_v1_local','LIVE-KEEP'],
 ['other-website-key','KEEP'],
 ]);
const storage={
 get length(){return initial.size;},
 key(index){return [...initial.keys()][index]??null;},
 getItem(key){return initial.get(key)??null;},
 setItem(key,value){initial.set(key,String(value));},
 removeItem(key){initial.delete(key)}
};
vm.runInNewContext(match[1],{localStorage:storage,console:{warn(){}}},{timeout:3000});
for(const k of ['wanderer_automatic_rpg_preview_v7_local','wanderer_automatic_rpg_preview_v6_other_backup','wanderer_automatic_rpg_preview_v1_local_source'])assert(!initial.has(k),'Stale save not removed: '+k);
assert.equal(initial.get('wanderer_automatic_rpg_preview_v8_local'),'new-data');
assert.equal(initial.get('wanderer_v012_endless_v1_local'),'LIVE-KEEP','v0.12 save must never be deleted');
assert.equal(initial.get('other-website-key'),'KEEP');
assert.equal(initial.get('wanderer_v013_pages_reset_20261117'),'1');
const snapshot=JSON.stringify([...initial]);
vm.runInNewContext(match[1],{localStorage:storage,console:{warn(){}}},{timeout:3000});
assert.equal(JSON.stringify([...initial]),snapshot,'Reset should be idempotent');
console.log('PASS: Pages v0.13, local-only save namespace v8, scoped old-v0.13 reset and v0.12 preservation');
