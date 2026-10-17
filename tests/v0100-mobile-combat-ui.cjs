// iPhone layout/decision regression, no live save writes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'Game script exists');
new vm.Script(script);
const boot='load();if(!state.merchant)rollShop();save();render();';
const body='fresh();globalThis.mobileCombatQA={combatDecisionMarkup,wavesForDungeon};';
const mock={
 document:{getElementById:()=>null,querySelectorAll:()=>[],createElement:()=>({})},
 localStorage:{getItem:()=>null,setItem:()=>{}},
 setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},console
};
vm.runInNewContext(script.replace(boot,body),mock,{timeout:8000});
const {combatDecisionMarkup:markup}=mock.mobileCombatQA;
const base={status:'ready',enc:2,tier:17,stats:{cha:5},hp:560,maxhp:560,loot:[],valuables:[]};
const simple=markup(base);
assert(simple.includes('Next encounter: Wave 3'),'normal wave heading');
assert(simple.includes('Gear drop'),'normal wave drop chance');
assert(simple.includes('Run Loot · 0 gear'),'normal wave loot count');
assert(simple.includes('<details class="decisionExtraDetails">'),'normal wave uses collapsible details');
assert(!simple.includes('class="decisionRisk"'),'normal wave does not show repetitive risk text');
assert(!simple.includes('class="decisionExtractWarning"'),'normal wave does not show lengthy extraction warning');
const normalLoot=markup({...base,loot:Array.from({length:7},(_,i)=>({name:'Loot '+i,tier:17,rarity:'Common',subtype:'Sword',slot:'weapon'}))});
assert(normalLoot.includes('+4 more'),'excess loot condensed');
assert.equal((normalLoot.match(/class="decisionLootItem"/g)||[]).length,3,'at most three loot thumbnails for normal waves');
const lowHp=markup({...base,hp:160});
assert(lowHp.includes('Low HP'),'critical survival warning remains visible even for normal waves');
const elite=markup({...base,enc:3});
assert(elite.includes('eliteEncounter')&&elite.includes('class="decisionRisk"'),'elite threat description visible');
assert(elite.includes('decisionRarities')&&!elite.includes('decisionExtraDetails'),'elite odds visible, not collapsed');
const boss=markup({...base,tier:20,enc:4});
assert(boss.includes('bossEncounter')&&boss.includes('class="decisionRisk"'),'boss ability warning visible');
assert(boss.includes('Guaranteed gear and a rune choice'),'chapter boss rewards stay clear');
const win=markup({...base,enc:4,status:'win'});
assert(win.includes('Expedition complete'),'finish state remains prominent');
assert(html.includes('.combatLayout .combatActions{')&&html.includes('position:fixed;inset:auto 0 0;'),'mobile actions fixed to viewport');
assert(html.includes('env(safe-area-inset-bottom,0px)'),'iOS safe area accounted for');
assert(html.includes('body:has(.combatLayout) .toast'),'toast avoids fixed bar');
assert(html.includes('.combatLayout .combatActions:not(:has(#nextFight))'),'combat speed still accessible during fights');
assert(html.includes('id="nextFight"')&&html.includes('id="leave"')&&html.includes('id="combatSpeed"'),'original button ids and handlers preserved');
assert(html.includes('.scene .combatStatuses,.scene .combatant .combatStatuses{position:static'),'prior multi-buff fix preserved');
console.log('PASS mobile: fixed controls, compact normal wave, risk/loot/odds and elite/boss warnings');
