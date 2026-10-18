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
assert(!lowHp.includes('Low HP')&&!lowHp.includes('decisionLowHp'),'normal-wave low HP warning removed');
const elite=markup({...base,enc:3});
assert(elite.includes('eliteEncounter')&&elite.includes('class="decisionRisk"'),'elite threat description visible');
assert(elite.includes('<details class="decisionExtraDetails"><summary>Drop odds &amp; loot</summary>'),'elite loot odds collapsed by default');
assert(elite.indexOf('class="decisionDrop"')>elite.indexOf('<details class="decisionExtraDetails">'),'elite gear-drop chance appears only inside closed details');
assert(elite.includes('Extract saves loot · Death loses unprotected gear.'),'elite extract warning shortened');
const boss=markup({...base,tier:20,enc:4});
assert(boss.includes('bossEncounter')&&boss.includes('class="decisionRisk"'),'boss ability warning visible');
assert(boss.includes('Guaranteed gear and a rune choice'),'chapter boss rewards stay clear');
assert(boss.includes('<details class="decisionExtraDetails"><summary>Drop odds &amp; loot</summary>'),'boss loot odds collapsed by default');
assert(boss.indexOf('class="decisionDrop"')>boss.indexOf('<details class="decisionExtraDetails">'),'boss gear-drop chance appears only inside closed details');
assert(!boss.includes('Low HP')&&!elite.includes('Low HP'),'no low HP prompts on elite or boss');
const dangerLoot=markup({...base,enc:3,loot:Array.from({length:8},(_,i)=>({name:'Loot '+i,tier:17,rarity:'Common',subtype:'Sword',slot:'weapon'}))});
assert.equal((dangerLoot.match(/class="decisionLootItem"/g)||[]).length,3,'elite visible loot capped to three thumbnails');
assert(dangerLoot.includes('+5 more')&&dangerLoot.includes('Other loot:'),'other drops available inside details');
const win=markup({...base,enc:4,status:'win'});
assert(win.includes('Expedition complete'),'finish state remains prominent');
assert(html.includes('.combatLayout .combatActions{')&&html.includes('position:fixed;inset:auto 0 0;'),'mobile actions fixed to viewport');
assert(html.includes('env(safe-area-inset-bottom,0px)'),'iOS safe area accounted for');
assert(html.includes('body:has(.combatLayout) .toast'),'toast avoids fixed bar');
assert(html.includes('.combatLayout .combatActions:not(:has(#nextFight))'),'combat speed still accessible during fights');
assert(html.includes('id="nextFight"')&&html.includes('id="leave"')&&html.includes('id="combatSpeed"'),'original button ids and handlers preserved');
// v0.11 replaces the horizontal swipe carousel with vertical effect lanes at arena edges.
assert(html.includes('.scene .combatant > .combatStatuses {'),'status lanes are anchored in the arena');
assert(html.includes('flex-direction:column;')&&html.includes('overflow-y:auto;'),'buffs stack downward and remain scrollable');
assert(html.includes('.scene .combatant > .combatStatuses.enemyDebuffs {'),'enemy effects stay on opposite side');
assert(html.includes('aria-label="Player effects; scroll down to view more"'),'player status lane accessible');
assert(html.includes('aria-label="Enemy effects; scroll down to view more"'),'enemy status lane accessible');
assert(html.includes('.scene .combatStatuses .debuff{font-size:8px;line-height:1.15;padding:1px 4px'),'small mobile buff badges remain');
assert(html.includes('.scene #enemyPortrait{width:min(125px,100%);height:112px;max-height:112px'),'enemy portrait remains enlarged');
console.log('PASS mobile: fixed controls, compact waves, vertical effect lanes, enlarged enemies and danger warnings');
