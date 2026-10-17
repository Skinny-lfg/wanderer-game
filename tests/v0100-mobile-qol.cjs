// v0.10.0 QoL: mobile equipment placement, continuous dungeon rail and visible full-stash warnings.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'game JS exists');new vm.Script(script);
const order=['amulet','helm','weapon','gloves','armor','offhand','ring1','boots','ring2'];
for(let i=0;i<order.length;i++)
 assert(html.includes('.equipmentLoadout .paper .slotTile[data-slot="'+order[i]+'"]{order:'+(i+1)+'}'),order[i]+' mobile grid position');
assert(html.includes('.dungeonLevelRow .levelGrid{')&&html.includes('overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain'),'rail scrolls horizontally');
assert(!html.includes('id="previousLevels"')&&!html.includes('id="nextLevels"'),'dungeon page arrows removed');
assert(html.includes("levelsRail.addEventListener?.('wheel'"),'desktop wheel moves through the level rail');
const boot='load();if(!state.merchant)rollShop();save();render();';
const testCode=[
'fresh();wallet=()=>{};save=()=>{};let markup="";html=(s)=>{markup=s};',
'const check=(ok,msg)=>{if(!ok)throw Error(msg)};',
'state.maxDungeon=40;state.chosen=20;dungeonRailScrollLeft=null;renderDungeons();',
'check((markup.match(/data-level="/g)||[]).length===44,"40 unlocked and four upcoming levels rendered, no pages");',
'check(!markup.includes("previousLevels")&&!markup.includes("nextLevels"),"no arrows in dungeon HTML");',
'state.chosen=40;renderDungeons();check(markup.includes("data-level=\\"44\\" disabled"),"four upcoming dungeons visible but locked");',
'state.stash=Array.from({length:stashCapacity()},(_,i)=>({id:"full"+i}));state.gold=999999;state.fragments=999999;',
'check(!stashHasRoom(),"stash is full");renderForge();',
'check(markup.includes("Inventory full")&&markup.includes("Cannot craft equipment"),"forge explains full stash");',
'check(/id="craft"[^>]*disabled/.test(markup),"craft blocked while full");',
'state.merchant={stock:[makeItem(2,"weapon",null,"merchant","Sword","Rare")],refreshCost:50};state.merchant.stock[0].goldPrice=5;',
'renderMerchant();check(markup.includes("Inventory full")&&markup.includes("Cannot buy equipment"),"merchant explains full stash");',
'check(/data-buy="[^"]+" disabled/.test(markup),"purchase blocked while full");',
'state.stash.pop();renderForge();check(!markup.includes("Inventory full"),"forge warning disappears after freeing space");',
'renderMerchant();check(!markup.includes("Inventory full"),"merchant warning disappears after freeing space");',
'globalThis.__qolPassed=true;'
].join('\n');
const elements=new Map(),node=()=>({innerHTML:'',textContent:'',dataset:{},style:{},value:'',onclick:null,onchange:null,addEventListener(){},querySelector(){return null},scrollLeft:0,scrollWidth:0,clientWidth:0});
const context={document:{getElementById:id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id)},querySelectorAll:()=>[],createElement:node},
localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},console};
vm.runInNewContext(script.replace(boot,testCode),context,{timeout:12000});
assert(context.__qolPassed,'all smoke fixtures completed');
console.log('PASS: mobile 3x3 equipment slots, scrolling 40+ dungeon levels, Forge/Merchant full-inventory notices');
