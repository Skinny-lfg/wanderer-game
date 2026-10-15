// Run with: node tests/phase2-smoke.cjs
// No dependencies. Boots the current single-file game inside a minimal VM DOM mock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const found = html.match(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/);
assert(found, 'Main game script exists');
const boot = "load();if(!state.merchant)rollShop();save();render();";
assert(found[1].includes(boot), 'Expected unchanged bootstrap');
const testCode = `
fresh();
const assert = (v,m)=>{if(!v)throw new Error(m)};
const heavy=makeItem(12,'weapon','bleed','loot','Two-Handed');
const knife=makeItem(12,'offhand','poison','loot','Off-Hand Dagger');
const sword=makeItem(12,'weapon',null,'loot','Sword');
const shield=makeItem(12,'offhand',null,'loot','Shield');
state.stash=[heavy,knife];state.equip.weapon=sword;state.equip.offhand=shield;
equipItem(heavy.id);
assert(isTwoHanded(state.equip.weapon)&&!state.equip.offhand,'two-hand occupies both hands');
assert(state.stash.some(i=>i.id===sword.id)&&state.stash.some(i=>i.id===shield.id),'displaced gear never lost');
const count=state.stash.length;equipItem(knife.id);
assert(state.stash.length===count&&!state.equip.offhand,'reject offhand with two-hand weapon');
equipItem(sword.id);equipItem(knife.id);
assert(state.equip.offhand?.id===knife.id,'offhand dagger can equip');
assert(itemImg(knife).includes('dagger'),'dagger icon mapped');
const mace=makeItem(10,'weapon',null,'loot','Mace');
const equipment={...makeSlots(),weapon:mace,offhand:shield};
const maceBlock=totalStats(equipment).blockChance;
equipment.weapon=sword;assert(maceBlock>totalStats(equipment).blockChance,'mace/shield synergy');
assert(totalStats({ ...makeSlots(),weapon:heavy,offhand:shield}).off===null,'no offhand stats with two-hand');
const enemy={hp:900,maxhp:900,barrier:0,def:10,baseDef:10,poison:0,burn:0,bleed:0,poisonStacks:0,burnStacks:0,bleedStacks:0,dots:{poison:[],burn:[],bleed:[]},slowTime:0};
state.run={tier:10,path:'temple',enc:1,status:'fight',enemy,stats:totalStats(equipment),maxhp:100,hp:50,barrier:0,mp:0,maxmp:0};
applyAffinity('poison',enemy,state.run.stats,1,20);const low=enemy.poison;
applyAffinity('poison',enemy,state.run.stats,1,100);
assert(enemy.poison>low*2,'DoT damage scales with triggering hit');
tickDots(enemy);tickDots(enemy);tickDots(enemy);
assert(enemy.poisonStacks===0,'DoTs expire after 3 ticks');
for(let i=0;i<35;i++)applyAffinity('shield',enemy,state.run.stats,1,500);
assert(state.run.barrier<=30,'player barrier has 30% HP limit');
selectedPath='temple';
const bosses=[10,20,30].map(level=>enemyFor(level,3).bossStyle);
assert(bosses.join(',')==='guardian,leech,berserker','3 distinct boss behaviours');
assert(THEMES.length===13&&THEMES.every(t=>t.mobs.length===2),'13 dungeons and 26 mobs');
assert(SAVE_RESET_VERSION==='2026-10-15-combat-balance-reset-2','existing save version preserved');
state.run=null;state.equip.weapon=heavy;state.equip.offhand=null;save();load();
assert(isTwoHanded(state.equip.weapon)&&!state.equip.offhand,'Two-Handed survives save migration');
globalThis.__smokeSuccess=true;
`;
const script = found[1].replace(boot, testCode);
function node(){return {innerHTML:'',textContent:'',style:{},dataset:{},value:'',classList:{remove(){},add(){}},focus(){}};}
const nodes = new Map(), store = new Map();
const document = {
  getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},
  querySelectorAll(){return [];},
  createElement(){return {...node(),remove(){}};}
};
const sandbox = {
  document,localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},
  confirm:()=>true,alert:()=>{},console,
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{}
};
vm.runInNewContext(script,sandbox,{timeout:3000,filename:'wanderer-game.js'});
assert(sandbox.__smokeSuccess,'Smoke test completed');
console.log('PASS: equipment, crafting types, DoT, shield balance, boss variants, dungeon themes and save compatibility');
