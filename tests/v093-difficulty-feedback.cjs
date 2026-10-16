// v0.9.3: character face picker, dungeon threat, forge trend and compact combat art.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const online=fs.readFileSync('online/app.mjs','utf8');
assert(online.includes('<img src="${c.avatar}"'),'account selector uses portrait assets');
assert(!online.includes('<img src="${c.fullBody}"'),'account selector does not use full-body art');
assert(html.includes('.equipmentLoadout .paper .model{display:block'),'full-body image visible behind equipped gear');
assert(html.includes('dungeonDifficulty(state.chosen,s)'),'dungeon risk uses all-wave threat estimator');
for(const grade of ['Easy','Favorable','Challenging','Hard','Brutal']){
 assert(html.includes('.dungeonRisk.risk'+grade),'missing colored difficulty '+grade);
}
assert(html.includes('trends}${previewItem(o,\'forge\')}'),'forged item shows merchant-style trend in popup');
assert(html.includes('mix-blend-mode:screen'),'combat VFX no longer have opaque dark squares');
assert(html.includes('.scene .combatStatuses{background:transparent'),'debuffs no longer produce opaque status panels');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>',html.indexOf('<script>')));
assert(script,'game script was not found');
new vm.Script(script,{filename:'wanderer-game'});
const boot='load();if(!state.merchant)rollShop();save();render();';
assert(script.includes(boot),'game bootstrap not found');
const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){}});
const sandbox={document:{getElementById:node,querySelectorAll:()=>[],createElement:node},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},alert(){},confirm:()=>true,console};
vm.runInNewContext(script.replace(boot,'fresh();globalThis.qa={state,dungeonDifficulty,forgeComparisonTrend};'),sandbox,{timeout:5000});
const {dungeonDifficulty,forgeComparisonTrend}=sandbox.qa;
const easy=dungeonDifficulty(12,{main:{subtype:'Sword'},attack:500,attacksPerSec:3,crit:50,defense:300,maxhp:20000,blockChance:0,bonus:{}});
const extreme=dungeonDifficulty(90,{main:{subtype:'Sword'},attack:1,attacksPerSec:.25,crit:0,defense:0,maxhp:30,blockChance:0,bonus:{}});
assert.equal(easy.label,'Easy','overpowered character should get Easy');
assert.equal(extreme.label,'Brutal','critically under-geared character should get Brutal');
const forged={id:'forge-new',name:'Forged Sword',slot:'weapon',subtype:'Sword',tier:10,rarity:'Rare',atk:1000};
assert(forgeComparisonTrend(forged).includes('▲ Higher estimate'),'Forge upgrade is marked green');
console.log('PASS v0.9.3 dungeon estimate / face picker / forge trend / combat feedback');
