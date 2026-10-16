// Focused hotfix validation against the real single-file gameplay engine (no Firebase).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const boot='load();if(!state.merchant)rollShop();save();render();';
assert(source?.includes(boot),'game bootstrap found');
const test=String.raw`
fresh();
const ck=(ok,msg)=>{if(!ok)throw Error(msg)};
save=render=renderCombat=addLog=updateBars=showDeathPopup=()=>{};
ck(state.onlineProgress.timerMetric==='combat-v1','fresh attempts opt into combat timer');
ck(state.onlineProgress.activeMs===0,'new clock starts at 0');
const noGearTime=state.onlineProgress.activeMs;
WandererGame.recordActive(9000);
ck(state.onlineProgress.activeMs===noGearTime,'idle activity never counts');
state.maxDungeon=state.chosen=20;
startDungeon();
ck(state.onlineProgress.activeMs===0,'entering a dungeon never counts');
nextEncounter();
const r=state.run;
r.stats.attacksPerSec=.01;r.enemy.attackEvery=9999;r.enemy.hp=999999;
ck(r.status==='fight','wave started');
for(let i=0;i<4;i++)updateFight();
ck(Math.abs(state.onlineProgress.activeMs-440)<.001,'four 1x combat ticks = 440ms');
clockSpeed=4;
for(let i=0;i<4;i++)updateFight();
ck(Math.abs(state.onlineProgress.activeMs-550)<.001,'four 4x combat ticks = 110ms');
r.status='ready';updateFight();
ck(Math.abs(state.onlineProgress.activeMs-550)<.001,'waiting for next wave never counts');
r.status='fight';state.onlineProgress.timerMetric='legacy-active';
updateFight();
ck(Math.abs(state.onlineProgress.activeMs-550)<.001,'old attempt cannot mix browser and combat timer');
state.onlineProgress.timerMetric='combat-v1';
const callbackClock=lastTickCallback;
document.visibilityState='hidden';callbackClock();
ck(Math.abs(state.onlineProgress.activeMs-550)<.001,'hidden tab halts combat time and simulation');
document.visibilityState='visible';callbackClock();
ck(Math.abs(state.onlineProgress.activeMs-577.5)<.001,'returning to tab continues 4x combat');
globalThis.__combatTimePass=true;
`;
const elements=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){}});
const sandbox={document:{visibilityState:'visible',getElementById:elements,querySelectorAll:()=>[],createElement:elements},
 localStorage:{getItem:()=>null,setItem(){}},console,alert:()=>{},confirm:()=>true,
 setTimeout:()=>0,clearTimeout:()=>{},setInterval:fn=>{sandbox.lastTickCallback=fn;return 1;},clearInterval:()=>{}};
vm.runInNewContext(fs.readFileSync('combat/affinities.js','utf8')+'\n'+source.replace(boot,test),sandbox,{timeout:7000});
assert(sandbox.__combatTimePass);
console.log('PASS hotfix: idle/Forge excluded, 1x/4x combat time, hidden tab pause, legacy ineligibility');
