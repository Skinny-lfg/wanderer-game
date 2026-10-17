// v0.9.3: affinity gear procs and the latest UI presentation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('online/app.mjs','utf8');
assert(html.includes('id="brandLogo"'),'brand has logo hook');
assert(html.includes('--bg:#100a0e')&&html.includes('background:radial-gradient(ellipse 110% 85% at 50% -22%,#422832'),'garnet backdrop replaces blue');
assert(html.includes('.onlineBar .buttonRow button[data-online-action]::before'),'utility actions have decorative icons');
assert(html.includes('.onlineBar .buttonRow button[data-online-action="leaderboard"]'),'Leaderboard has its own gold accent');
assert(html.includes('<button class="tiny" data-online-action="feedback">Feedback</button>'),'Feedback button uses unified visual labeling');
assert(!html.includes('${legendaryHuntMarkup(paths)}'),'Legendary Hunt is temporarily hidden from dungeon UI');
assert(!html.includes("Q('[data-hunt]').forEach"),'hidden Legendary Hunt has no active UI handlers');

assert(fs.readFileSync('assets/branding/wanderer-logo.webp').toString('ascii',0,4)==='RIFF','real logo artwork committed');
for(const id of ['tank','caster','vampire','berserker']){
 const buffer=fs.readFileSync('assets/elites/'+id+'.png');
 assert.equal(buffer.toString('ascii',1,4),'PNG',id+' is original PNG artwork');
 assert.equal(buffer.readUInt32BE(16),256,id+' width');
 assert.equal(buffer.readUInt32BE(20),256,id+' height');
}

assert(html.includes('assets/branding/wanderer-logo.webp'),'logo asset path documented');
assert(html.includes('assets/elites/tank.png')&&html.includes('assets/elites/caster.png')&&html.includes('assets/elites/vampire.png')&&html.includes('assets/elites/berserker.png'),'all 4 elite asset references');
assert(!html.includes('BROWSER PROTOTYPE V'),'old prototype label removed');
assert(html.includes('class="version">v0.9.3'),'current version only');
assert(html.includes('class="huntTargets"'),'Legendary Hunt is directly selectable');
assert(!html.includes('id="legendaryHuntTarget"'),'old hunt dropdown removed');
assert(html.includes('backdrop-filter:saturate(.5)'),'background saturation at 50%');
assert(html.includes('#screen[inert],#nav[inert]{visibility:hidden}'),'no Tavern flash before auth');
assert(html.includes('id="heroName"'),'player nickname shown in combat');
assert(app.includes('globalThis.WandererNickname=ready&&user&&profile?.nickname'),'nickname stays outside save');
assert(!html.includes('Enemy ATK ${enemy.atk}'),'fixed enemy estimate removed');
assert((html.match(/Healing −40% · /g)||[]).length===1,'healing status only rendered once');
assert(!html.includes('Threat estimate changes with your equipment.'),'outdated difficulty helper removed');
assert(!html.includes('.scene .combatVfx,.scene .float{display:none!important}'),'combat effect overlays must not be hidden');
assert(html.includes('#enemyPortrait.fxEnemyAttack{animation:fxEnemyAttack .36s ease-out}'),'enemy strike animation remains enabled by default');
assert(html.includes('@media(prefers-reduced-motion:reduce){#heroPortrait[class*="fx"],#enemyPortrait.fxEnemyAttack{animation:none!important}}'),'reduced-motion accessibility remains');
assert(html.includes('backdrop-filter:saturate(.5) brightness(.90)'),'combat background saturation remains at 50%');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const boot='load();if(!state.merchant)rollShop();save();render();';
const injected=`
fresh();
state.equip=makeSlots();
state.equip.helm=makeItem(10,'helm',null,'loot','random','Rare');
state.equip.helm.effect='slow';
const enemy={hp:100,maxhp:100,barrier:0,def:5,baseDef:5,slowTime:0,poisonStacks:0,bleedStacks:0,burnStacks:0,dots:{poison:[],bleed:[],burn:[]}};
const r={status:'fight',combatSeconds:1,enemy,stats:totalStats(),hp:100,maxhp:100,barrier:0,setTemp:null,enc:1};
state.run=r;
Math.random=()=>0;
const frost=tryPassiveGearAffinity(r,25);
const slowed=r.enemy.slowTime>0;
const blocked=tryPassiveGearAffinity(r,25);
r.combatSeconds=3.1;
state.equip.helm.effect=null;
state.equip.amulet=makeItem(10,'amulet',null,'loot','random','Rare');
state.equip.amulet.effect='burn';
const fire=tryPassiveGearAffinity(r,25);
const burn=(r.enemy.burnStacks||0)>0;
r.combatSeconds=6;state.equip.amulet.effect='crit';
const critNoStatus=!tryPassiveGearAffinity(r,25);
globalThis.__gearQA={frost,slowed,blocked,fire,burn,critNoStatus};
`;
const box=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){},setAttribute(){},addEventListener(){},querySelector(){return box()},querySelectorAll(){return []},appendChild(){},showModal(){},close(){}});
const scope={document:{getElementById:box,createElement:box,querySelectorAll:()=>[],body:box()},localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null,setItem(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},confirm:()=>true,alert(){},console,Image:undefined};
vm.runInNewContext(script.replace(boot,injected),scope,{timeout:8000});
assert.equal(JSON.stringify(scope.__gearQA),JSON.stringify({frost:true,slowed:true,blocked:false,fire:true,burn:true,critNoStatus:true}));
console.log('PASS latest branding, hunts, nickname, Tank status, Frost/Fire armor procs and cooldown');
