// UI regression: character faces, calibrated risk, compact status chips and themed confirmations.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const online=fs.readFileSync('online/app.mjs','utf8');
assert(html.includes("function heroImage(){return 'assets/characters/avatars/'"),'combat uses face PNG');
assert(online.includes('<img src="${c.avatar}"'),'character selection keeps face art');
assert(html.includes('src="${heroFullImage()}"'),'Equipment uses full-body character image');
assert(html.includes('border-radius:0;object-fit:contain;object-position:center;background:none;border:0;box-shadow:none'),'Combat portrait has no circle or crop');
assert(html.includes('riskBrutal')&&html.includes('riskEasy'),'difficulty spans green to red');
assert(html.includes('background:linear-gradient(180deg,#0007'),'combat background is readable');
assert(html.includes('.scene .combatStatuses{background:transparent;top:5px;left:5px;right:5px;height:auto;min-height:0;max-height:52px'),'small combat status lane');
assert(html.includes('function forgeEquippedReference(')&&html.includes('Upgrade vs equipped gear'),'forge comparison context');
assert(html.includes('function showConfirm(')&&html.includes("if(typeof HTMLDialogElement==='undefined')"),'themed confirmations with legacy test fallback');
assert(html.includes("'wanderer_last_view_v1_'+KEY"),'tab restoration scoped to save/account');
assert(online.includes("profileState='loading';\n try{"),'Firebase auth loading does not immediately reopen Account');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(js,'game inline script syntax');
const boot='load();if(!state.merchant)rollShop();save();render();';
const node=()=>({innerHTML:'',textContent:'',dataset:{},style:{},classList:{add(){},remove(){}},focus(){},setAttribute(){},appendChild(){},querySelector(){return node()},querySelectorAll(){return []},showModal(){},close(){},addEventListener(){}});
const scope={document:{getElementById:node,querySelectorAll:()=>[],createElement:node,body:node(),activeElement:node()},
 localStorage:{getItem:()=>null,setItem(){}},sessionStorage:(()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}})(),setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},console,alert(){},confirm(){throw Error('Native confirm should never run')}};
const injection='fresh();render=renderCombat=renderStash=save=()=>{};globalThis.uxQA={state,makeSlots,makeItem,totalStats,dungeonDifficulty,forgeEquippedReference,forgeComparisonTrend,playerStatusMarkup,enemyDebuffMarkup,heroImage,heroFullImage,rememberView,restoreView,getView:()=>view,setView:x=>{view=x}};';
vm.runInNewContext(js.replace(boot,injection),scope,{timeout:8000});
const t=scope.uxQA;
assert.equal(t.heroImage(),'assets/characters/avatars/wanderer.png');
assert.equal(t.heroFullImage(),'assets/characters/full/wanderer.webp');
t.setView('forge');t.rememberView();t.setView('tavern');t.restoreView();
assert.equal(t.getView(),'forge','current tab restored after refresh');
assert.equal(t.dungeonDifficulty(200,t.totalStats(t.makeSlots())).label,'Brutal');
const gear=t.makeSlots();
for(const slot of ['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots'])
 gear[slot]=t.makeItem(8,slot,null,'loot',slot==='weapon'?'Sword':slot==='offhand'?'Shield':'random','Epic');
assert(['Easy','Favorable','Challenging'].includes(t.dungeonDifficulty(5,t.totalStats(gear)).label),'strong character should not have extreme difficulty at D5');
t.state.equip=gear;
assert(t.forgeEquippedReference('weapon').includes('Currently equipped'));
const crafted=t.makeItem(8,'helm',null,'forge','random','Rare');
assert(t.forgeComparisonTrend(crafted).includes('estimated Gear Power'));
assert(t.enemyDebuffMarkup({poisonStacks:3,bleedStacks:0,burnStacks:0}).includes('×3'));
console.log('PASS: face art, five-tier risk, forge comparison, compact debuffs and unified confirmations');
