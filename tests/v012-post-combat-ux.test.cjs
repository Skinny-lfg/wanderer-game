'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('index.html'),runtime=read('online/v012-expedition-runtime.js'),css=read('online/v012-uiux-polish.css');
function functionSource(source,start,next){
 const begin=source.indexOf(start),end=source.indexOf(next,begin+start.length);
 assert.ok(begin>=0&&end>begin,'Source section not found: '+start);
 return source.slice(begin,end);
}
test('completed combat puts a single enabled EXIT REALM before the arena after required passive reward',()=>{
 const source=functionSource(html,'function phase1DecorateCombat(){','// Current Expedition inventory and preparation.');
 assert.match(source,/r\.status==='cleared'&&!phase1Draft/);
 assert.match(source,/exit\.id='phase5ExitRealm'/);
 assert.match(source,/actions\.prepend\(exit\)/);
 assert.match(source,/arena\.before\(actions\)/);
 assert.equal((source.match(/exit\.id='phase5ExitRealm'/g)||[]).length,1);
});
test('combat arena keeps its Realm art across the post-combat transition',()=>{
 const source=functionSource(html,'function phase1DecorateCombat(){','// Current Expedition inventory and preparation.');
 assert.match(source,/arena\.style\.setProperty\('--phase3-realm-image'/);
 assert.match(source,/dungeonImage\(classicTheme\)/);
 assert.match(source,/arena\.style\.removeProperty\('background-image'\)/);
});
test('Realm and Expedition result screens show the prior Realm art, never an empty dark panel',()=>{
 const source=functionSource(html,'function phase5RenderResult(){','function phase5Leaderboard(){');
 assert.match(source,/THEMES\.find\(t=>t\.name===\(isRealm\?r\.name:realm\?\.name\)\)/);
 assert.match(source,/result\.style\.setProperty\('--phase3-realm-image'/);
 assert.match(source,/showRealmBackdrop\(\)/);
 assert.match(source,/querySelector\?\.\('\.phase5VisualSummary'\)/);
 assert.match(css,/\.phase5VisualSummary\[style\*="--phase3-realm-image"\]::before/);
});
test('exit buttons are early in result content but not duplicated',()=>{
 for(const [start,end] of [['function phase5SummaryMarkup(','function phase5RealmResultMarkup('],['function phase5RealmResultMarkup(','function phase5RenderResult(){']]){
  const source=functionSource(html,start,end);
  assert.equal((source.match(/id="phase5ExitResult"/g)||[]).length,1);
  assert.ok(source.indexOf('phase5ResultActions--early')<source.indexOf('phase5ResultMetrics'),'Exit precedes metrics');
 }
});
test('defeat immediately yields one final summary while retaining reward accounting and save transition',()=>{
 const source=functionSource(runtime,'function phase1Death(){','function phase1Abandon(){');
 const calls=[];
 const p={
  clock:null,isPhase1Run:()=>true,state:{run:{id:'test-run'}},
  logEntries:[],phase5Results:{review:null,summary:null,realm:null},phase1Build:null,
  phase6CollectMetrics:()=>calls.push('metrics'),
  phase6ReturnPotions:()=>calls.push('returnPotions'),
  phase5RememberRealm:()=>{calls.push('rememberRealm');p.phase5Results.review='realm';p.phase5Results.realm={outcome:'defeat'};},
  phase5MakeSummary:()=>{calls.push('makeSummary');p.phase5Results.summary={outcome:'defeat'};},
  phase4CommitRealm:()=>calls.push('commitRealm'),
  phase4LoseLoot:()=>calls.push('loseLoot'),
  phase1Controller:{defeat:()=>calls.push('defeat')},
  PHASE5_VALIDATION:false,phase5Persist:()=>{calls.push('persist');return true;},
  render:()=>calls.push('render'),bannerMessage:()=>calls.push('banner'),
  addLog:()=>calls.push('log'),
  view:'combat',phase1Vitals:{},phase1Continuity:{}
 };
 const death=new Function('ports','clearInterval','WandererV012Buildcraft',source+';return phase1Death;')(p,()=>{}, {clear:()=>calls.push('clearBuild')});
 death();
 assert.deepEqual(calls.filter(v=>v==='rememberRealm'||v==='makeSummary'||v==='loseLoot'||v==='render'),['rememberRealm','makeSummary','loseLoot','render']);
 assert.equal(p.phase5Results.review,'summary');
 assert.equal(p.phase5Results.summary.outcome,'defeat');
 assert.equal(p.phase5Results.realm.outcome,'defeat');
 assert.equal(p.state.run,null);
 assert.equal(p.view,'phase1');
});
