// Isolated regressions against the browser game; no Firebase or real saves.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const boot='load();if(!state.merchant)rollShop();save();render();';
const test=String.raw`
fresh();
render=renderCombat=renderStash=showDeathPopup=bannerMessage=addLog=floatText=animateStrike=()=>{};
const ck=(v,m)=>{if(!v)throw Error(m)};
const persist=save;
state.maxDungeon=200;
for(const [level,cost] of [[1,5],[10,5],[11,10],[20,10],[200,100]]){
 state.chosen=level;getPaths();for(const count of [0,1,20,999]){state.offersByLevel[level].rerolls=count;ck(rerollCost()===cost,'fixed tier cost '+level);}
}
state.chosen=20;selectedPath=state.selectedPath=getPaths().ids[0];
const original=JSON.stringify(getPaths());save();load();ck(JSON.stringify(getPaths())===original,'offers and preferred gear survive reload');
function fakeRun(enc,status='ready'){return {tier:20,path:state.offersByLevel[20].ids[0],status,enc,gold:0,fragments:0,loot:[],valuables:[]};}
state.run=fakeRun(0);extract();ck(JSON.stringify(getPaths())===original,'zero wave preserves offers');
state.run=fakeRun(1);extract();ck(JSON.stringify(getPaths())===original,'one completed wave preserves offers');
state.run=fakeRun(2,'fight');extract();ck(state.run!==null&&JSON.stringify(getPaths())===original,'cannot extract during wave two');
save();load();ck(state.run===null&&JSON.stringify(getPaths())===original,'interruption cannot rotate offers');
state.run=fakeRun(5,'fight');die();ck(JSON.stringify(getPaths())===original,'death cannot rotate offers');
state.run=fakeRun(2);extract();ck(getPaths().ids.every(id=>!JSON.parse(original).ids.includes(id)),'two completed waves rotate all offers');
const rotated=JSON.stringify(getPaths());save();load();ck(JSON.stringify(getPaths())===rotated,'earned offers survive reload');
for(const kind of ['Bow','Staff','Two-Handed']){
 const w=makeItem(20,'weapon','poison','loot',kind,'Rare');w.effect='poison';
 const shield=makeItem(200,'offhand','shield','loot','Shield','Legendary');shield.effect='shield';
 state.equip={...makeSlots(),weapon:w};state.stash=[shield];
 ck(setCounts({...state.equip,offhand:shield}).poison===2&&setCounts({...state.equip,offhand:shield}).shield===0,'2H affinity counts '+kind);
 ck(totalStats(comparisonEquip(shield)).power===totalStats().power,'locked comparison '+kind);
 ck(gearTrend(shield).includes('locked')&&!gearTrend(shield).includes('up'),'locked upgrade indicator '+kind);
 ck(previewItem(shield).includes('disabled>Equip'),'equip UI disabled '+kind);
 equipItem(shield.id);ck(state.equip.weapon===w&&!state.equip.offhand&&state.stash[0]===shield,'locked equip conserves inventory '+kind);
}
// Active tiers, rather than the number of different sets, contribute to Gear Power.
state.equip=makeSlots();
const loadout=(counts)=>{const e=makeSlots();let i=0;for(const [effect,n] of Object.entries(counts))for(let j=0;j<n;j++){const slot=SLOTS[i++];e[slot]={id:slot,slot,subtype:slot==='weapon'?'Sword':'Armor',effect};}return e;};
ck(totalStats(loadout({burn:5})).synergyPower===54,'5/5 values its signature');
ck(totalStats(loadout({burn:3,drain:2})).synergyPower===42,'3/2 values both cumulative tiers');
function combat(effect,tier){return {stats:{bonus:setBonuses({[effect]:tier}).values},enemy:{hp:10000,maxhp:10000,barrier:0,def:10,baseDef:10},hp:80,maxhp:100,barrier:0,combatSeconds:1,tEnemy:0};}
for(const [effect,key,n,damage] of [['crit','focus',3,6],['burn','heat',5,8],['drain','soul',3,6]]){
 const r=combat(effect,3),t=setRuntime(r);t[key]=n;t[key+'Expiry']=7;
 ck(setOnAttack(r,100,false,false)===damage,'tier 3 standalone damage '+effect);
 ck(t[key]===n,'tier 3 does not consume charges '+effect);
 r.combatSeconds=8;setCombatExpire(r,0);ck(setOnAttack(r,100,false,false)===0,'expired charges give no damage '+effect);
}
const fire=combat('burn',5),f=setRuntime(fire);f.heat=5;f.heatExpiry=10;
ck(setOnAttack(fire,100,false,false)>=50&&f.heat===0,'Flashover consumes Heat');
const dark=combat('drain',5),d=setRuntime(dark);d.soul=3;d.soulExpiry=10;
ck(setOnAttack(dark,100,false,false)>=40&&d.soul===0&&dark.hp===77,'Soul Pact preserves HP sacrifice and charge use');
const critical=combat('crit',5);critical.stats={...totalStats(),bonus:critical.stats.bonus,main:{subtype:'Sword'},off:null,crit:0,attack:100,counts:{}};
critical.mp=0;critical.enc=1;setRuntime(critical).focus=3;state.run=critical;
weaponAttack(critical);ck(critical.setCooldowns.perfectStrike===11&&setRuntime(critical).focus===0,'Perfect Strike still consumes Focus');state.run=null;
ck(regenPerSecond(100)===2.2&&regenPerSecond(1000)===4&&regenPerSecond(100000)===10,'Regen scales with hard ceiling');
const regen=combat('regen',5);regen.hp=regen.maxhp;
for(let i=0;i<20;i++){regen.combatSeconds=i;setHeal(regen,10000);}
ck(regen.barrier<=10.00001,'overheal encounter cap retained');
regen.hp=50;regen.playerHealingDebuffUntil=100;regen.combatSeconds=21;setHeal(regen,10);ck(regen.hp===56,'Tank healing reduction retained');
ck(affinityProcChance('Daggers')===.52&&affinityProcChance('Two-Handed')===.26&&affinityProcChance('Bow')===.32&&affinityProcChance('Staff',true)===.9,'actual proc rates unchanged');
ck(affinityProcMarkup({...totalStats(),caster:true,main:{subtype:'Staff',magic:'burn'}}).includes('90%'),'cast proc UI');
ck(affinityProcMarkup({...totalStats(),main:{subtype:'Daggers',effect:'bleed'}}).includes('52%'),'physical proc UI');
// Acquisition markers and legacy migration: missing flags remain seen.
fresh();state.equip=makeSlots();state.stash=[makeItem(10,'helm','poison','loot','random','Rare')];state.runes=[makeRune('might',10)];
ck(!newBadge(state.stash[0])&&!newBadge(state.runes[0]),'old items default to seen');
state.stash[0].isNew=true;state.runes[0].isNew=true;
const gearId=state.stash[0].id,runeId=state.runes[0].id;
save();load();ck(newBadge(state.stash[0])&&newBadge(state.runes[0]),'equipment and rune NEW survive reload');
markItemSeen(gearId);save();load();ck(!newBadge(state.stash[0])&&newBadge(state.runes[0]),'individual equipment inspection');
openRuneSlotPicker(runeId);ck(!newBadge(state.runes[0]),'individual rune consultation');
state.stash[0].isNew=true;state.runes[0].isNew=true;state.equip.weapon=makeItem(10,'weapon','poison','loot','Sword','Rare');state.equip.weapon.isNew=true;
markAllAsSeen();save();load();ck(!newBadge(state.stash[0])&&!newBadge(state.runes[0])&&!newBadge(state.equip.weapon),'mark all covers stash, equipped gear and runes persistently');
state.chosen=state.maxDungeon=20;getPaths();const drop=makeItem(10,'boots','burn','loot','random','Rare');state.run={...fakeRun(1),loot:[drop]};extract();ck(state.stash.find(o=>o.id===drop.id).isNew===true,'extracted loot becomes NEW');
const forged=makeItem(10,'helm','burn','forge','random','Rare');forged.isNew=true;state.stash.push(forged);previewItem(forged,'forge');ck(!forged.isNew,'forge result consultation marks seen');
const reward=makeRune('wisdom',10);state.pendingRuneReward={tier:10,options:[reward]};claimPendingRuneChoice(reward.id);ck(state.runes.find(r=>r.id===reward.id).isNew===true,'claimed rune is NEW');
globalThis.pass=true;
`;
const storage=new Map(),nodes=new Map();
const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},value:'',classList:{add(){},remove(){}},focus(){}});
const sandbox={document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelectorAll:()=>[],createElement:node},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},console,confirm:()=>true,alert(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){}};
vm.runInNewContext(source.replace(boot,test),sandbox,{timeout:6000});
assert(sandbox.pass);console.log('PASS v0.9.3 buildcraft, capped Regen, locked Off-Hand, proc rates, dungeon rotation and persistent NEW');
