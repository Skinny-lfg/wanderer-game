// Regression guards for the v0.9.3 visual feedback fixes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const model=fs.readFileSync('online/model.mjs','utf8');
const manifest=JSON.parse(fs.readFileSync('assets/characters/manifest.json','utf8'));
for(const name of ['Paladin','Ranger','Warrior','Wizard','Rogue']){
 assert(model.includes("'"+name+"'"),name+' online character name');
 assert(manifest.characters.some(c=>c.name===name),name+' character manifest');
}
assert(!html.includes('class="olderChangelog"'),'old changelog removed');
assert(html.includes('object-fit:contain;object-position:center bottom'),'character no longer cropped into face');
const overview=html.indexOf('<h2>Equipment</h2>'),inventory=html.indexOf('<h2>Inventory ');
assert(html.indexOf('id="markAllSeen"')>inventory,'Mark All Seen belongs to Inventory, not Equipment');
assert(overview<inventory);
assert(html.includes('Recommended for current build'));
assert(html.includes('<option value="powerLevel">Power level</option>'));
assert(html.includes('m.stock[i]=replacement'),'Merchant replenishes purchased slot');
assert(html.includes('data-equip-crafted'),'Forge modal offers direct equip');
assert(html.includes('Frost · Chilled'),'Frost status visible');
assert(html.includes('Healing −40%'),'healing-wound status visible');
assert(html.includes('Set bonus lost:'),'set-tier loss warning in comparison');
assert(html.includes("lostSetTiers(o).length?'⚠ Loses set bonus'"),'merchant warns about losing tier');
assert(html.includes('<details class="procDetails">'),'proc math explanatory collapse');

const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script,'wanderer-html-script');
const boot='load();if(!state.merchant)rollShop();save();render();';
assert(script.includes(boot));
const nodes=()=>({innerHTML:'',textContent:'',dataset:{},style:{},classList:{add(){},remove(){}},focus(){}});
const ctx={document:{getElementById:nodes,querySelectorAll:()=>[],createElement:nodes},
 localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},confirm:()=>true,alert(){},console};
const inj="fresh();render=renderCombat=save=()=>{};globalThis.visualQA={state,makeItem,makeSlots,gearTrend,comparisonWarning,itemComparison,lostSetTiers,enemyDebuffMarkup,affinityProcMarkup,totalStats};";
vm.runInNewContext(script.replace(boot,inj),ctx,{timeout:5000});
const t=ctx.visualQA;
const tome=t.makeItem(5,'offhand','shock','loot','Tome','Rare');tome.effect='shock';
const amulet=t.makeItem(5,'amulet','shock','loot','Amulet','Rare');amulet.effect='shock';
const shield=t.makeItem(4,'offhand',null,'loot','Shield','Common');shield.effect=null;
t.state.equip=t.makeSlots();t.state.equip.offhand=tome;t.state.equip.amulet=amulet;
assert(t.lostSetTiers(shield).some(x=>x.affinity==='shock'&&x.before===2&&x.after===0),'storm tier is lost');
assert(t.gearTrend(shield).includes('⚠'),'losing a tier is not shown as positive upgrade');
assert(t.itemComparison(shield).includes('Set bonus lost'),'compare explains set loss even if GS rises');
assert(t.enemyDebuffMarkup({slowTime:1.9,baseDef:1,def:1}).includes('Frost · Chilled'));
assert(t.affinityProcMarkup(t.totalStats()).includes('<details'));
console.log('PASS v0.9.3 visual polish and misleading Gear Power comparison regression');
