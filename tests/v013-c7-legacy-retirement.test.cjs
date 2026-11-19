'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');
const html=read('index.html');
const runtime=read('online/v012-expedition-runtime.js');
const persistence=read('online/v012-persistence-runtime.js');
const save=read('online/v012-save.js');
const retired=[
 'phase2ChooseInitial','phase1Choose','phase3Reroll',
 'phase2EnterInitialRealm','phase2ChooseElement','phase2ChoosePassive',
 'phase6PassiveOptions','phase6PassivePopup','phase6PassiveCard',
 'phase3OpenInitialAffinity','phase3OpenMagicElementDialog'
];
test('C7: parse all current inline application JavaScript before native tests',()=>{
 const scripts=[...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
 assert(scripts.length,'Current application must include bootstrap script');
 for(const [i,code] of scripts.entries())assert.doesNotThrow(()=>new vm.Script(code,{filename:'index.html#inline-'+i}), 'Parse inline script '+i);
});
test('C7: no classic affinity picker, Realm passive draft or obsolete controller method survives',()=>{
 for(const name of retired){
  assert(!runtime.includes(name),'Old controller API remains in runtime: '+name);
  assert(!html.includes(name),'Old UI remains in index.html: '+name);
 }
 for(const [file,content] of [['index.html',html],['runtime',runtime],['persistence',persistence]]){
  assert(!content.includes('phase1Draft'),'Old draft state remains in '+file);
 }
 for(const old of ['data-phase2-initial','data-phase2-passive','data-popup-passive','data-initial-magic-element','data-passive-exhausted','phase3InitialAffinityDialog']){
  assert(!html.includes(old),'Old hidden element still rendered: '+old);
 }
 assert.match(runtime,/const plane=ports\.phase1Controller\.enter\(\)/);
 assert.match(html,/dungeonMapMarkup\(g\)/);
});
test('C7: clean-sheet save rejects retired draft snapshots but retains current Dungeon checkpoints',()=>{
 assert.match(persistence,/controller:ports\.phase1Controller\.state/);
 assert(!persistence.includes('session.draft'));
 assert(!persistence.includes('draft:ports.'));
 assert.match(save,/retired Realm draft in checkpoint/);
 const create=require('./v012-economy-harness.cjs');
 const a=create(1707);
 a.start(1,true);
 const session=a.checkpoint.capture().session;
 assert(session?.controller?.dungeon,'A real Dungeon checkpoint is required');
 assert.equal(Object.hasOwn(session,'draft'),false);
 for(const name of ['initial','select','passive','element','reroll'])assert.equal(typeof a[name],'undefined','Old harness action remains: '+name);
 assert.equal(typeof a.enter,'function');
 assert.equal(typeof a.controller().chooseInitial,'undefined');
 assert.equal(typeof a.controller().select,'undefined');
 assert.equal(typeof a.controller().reroll,'undefined');
 assert.equal(typeof a.controller().chooseRealm,'function');
});

test('C7: all retired initial-affinity and passive-draft CSS is absent from the shipped styles',()=>{
 const obsolete=/\.(?:phase1Draft(?:Card|Cards)|phase3Affinity(?:Choice|Choices|Identity|Pending|PassiveDetails|PassiveDescriptions)|phase3InitialAffinity[\\w-]*|phase3Magic(?:ElementChoice|ElementChoices|Step|ElementDialog)[\\w-]*|phase3Passive(?:Card|Choice|Choices|Preview[\\w-]*|Rank|Affinity|Type|Description|Hybrid|Increase|Value|Separator|Build|Draft[\\w-]*|Context))\b/;
 for(const filename of fs.readdirSync('online').filter(name=>name.endsWith('.css'))){
  const css=read('online/'+filename);
  assert(!obsolete.test(css),'Old Realm draft CSS found in '+filename);
 }
});
