// Safari localStorage quota regression: protect saves when automatic backups fill the device.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('online/app.mjs','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1],boot='load();if(!state.merchant)rollShop();save();render();';
assert(script&&script.includes(boot));new vm.Script(script);
assert(app.includes('game.cacheSync(accountKey()'),'cloud sync cache uses safe storage writer');
assert(app.includes('Device storage is full.'),'storage quota failure has friendly message');
assert(html.includes('.equipmentLayout .equipmentOverview,.equipmentLayout .equipmentInventory{'),'Equipment and Inventory have same mobile panel width');
assert(html.includes('.equipmentOverview .equipmentQuickView{'),'mobile Equipment panel keeps full-width responsive area');
assert(html.includes('grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)'), 'mobile equipment grid keeps loadout and stats side by side');
const stored=new Map(),quota={max:Infinity};
const size=()=>[...stored].reduce((sum,[k,v])=>sum+k.length+v.length,0);
quota.used=size;
const storage={
 get length(){return stored.size;},
 key(i){return [...stored.keys()][i]??null;},
 getItem(key){return stored.get(String(key))??null;},
 removeItem(key){stored.delete(String(key));},
 setItem(key,value){
  key=String(key);value=String(value);
  const nextSize=size()-(stored.get(key)?.length||0)-(stored.has(key)?key.length:0)+key.length+value.length;
  if(nextSize>quota.max){const e=new Error('The quota has been exceeded.');e.name='QuotaExceededError';e.code=22;throw e;}
  stored.set(key,value);
 }
};
const nodes=new Map();
function node(){return {inert:false,innerHTML:'',textContent:'',dataset:{},style:{},classList:{add(){},remove(){}},focus(){},querySelector(){return null}};}
const env={localStorage:storage,quota,console,Event,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelectorAll:()=>[],createElement:node},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}};
const injected=[
 'fresh();render=()=>{};save();',
 'const check=(ok,msg)=>{if(!ok)throw Error(msg)};',
 'const guestKey=KEY,original=localStorage.getItem(KEY);',
 'check(original!==null,"guest save initially stored");',
 'archiveLocalSave(original,"before-switch");archiveLocalSave(original,"before-switch");',
 'check(localBackups().filter(item=>item.raw===original).length===1,"identical backups deduplicated");',
 'for(let i=0;i<15;i++){const key="wanderer_backup_"+(1000000000000+i)+"_old";localStorage.setItem(key,JSON.stringify({label:"before-switch",raw:JSON.stringify({n:i,pad:"x".repeat(1100)}),createdAt:"2026-10-01"}));}',
 'const beforeKeys=localBackups().length;check(beforeKeys>=16,"legacy backups present");',
 'quota.max=quota.used()-1;',
 'WandererGame.switchSave("wanderer_account_qa",{...state,gold:999});',
 'check(KEY==="wanderer_account_qa"&&state.gold===999,"account save selected under pressure");',
 'check(localStorage.getItem(guestKey)===original,"guest slot remains unchanged");',
 'check(localBackups().length<beforeKeys,"pruned old backups to recover space");',
 'const accountKey=KEY,accountRaw=localStorage.getItem(accountKey);',
 'check(accountRaw!==null&&JSON.parse(accountRaw).gold===999,"account persisted");',
 'quota.max=0;let rejected=false;',
 'try{WandererGame.switchSave(accountKey,{...state,gold:888});}catch(e){rejected=/quota/i.test(e.message);}',
 'check(rejected,"out-of-space write refuses to replace account save");',
 'check(localStorage.getItem(accountKey)===accountRaw&&KEY===accountKey,"failed switch preserves active save");',
 'quota.max=Infinity;globalThis.__quotaTestPassed=true;'
].join('\n');
vm.runInNewContext(script.replace(boot,injected),env,{timeout:15000});
assert(env.__quotaTestPassed);
console.log('PASS: local quota recovery deduplicates backups, protects both save slots, and keeps mobile Equipment full width');
