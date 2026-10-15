const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),boot='load();if(!state.merchant)rollShop();save();render();';
const script=html.match(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/)[1];
const store=new Map(),nodes=new Map();
function node(){return {innerHTML:'',textContent:'',style:{},dataset:{},value:'',classList:{add(){},remove(){}},focus(){}}}
const test=`
fresh();state.gold=321;state.fragments=45;state.stashCapacity=80;state.maxDungeon=25;state.characterId='ranger';state.equip.weapon=makeItem(12,'weapon',null,'loot','Two-Handed');
localStorage.setItem(KEY,JSON.stringify({...state,resetVersion:'old-version'}));load();save();
if(state.gold!==321||state.maxDungeon!==25||state.characterId!=='ranger'||!isTwoHanded(state.equip.weapon))throw Error('Legacy save changed');
const raw=localStorage.getItem(KEY);state.characterId='duelist';save();load();if(state.characterId!=='duelist')throw Error('Character persistence');
WandererGame.switchSave('wanderer_account_test',{...JSON.parse(raw),gold:999});if(state.gold!==999)throw Error('Account slot');
WandererGame.switchSave('wanderer_browser_proto_v01');if(state.gold!==321)throw Error('Guest isolation');
localStorage.setItem(KEY,'{broken');load();save();if(localStorage.getItem(KEY)!=='{broken')throw Error('Corrupt save overwritten');
saveBlocked=false;localStorage.setItem(KEY,raw);load();localStorage.setItem(KEY,JSON.stringify({...state,gold:77}));state.gold=10;save();if(JSON.parse(localStorage.getItem(KEY)).gold!==77||!saveBlocked)throw Error('Concurrent tab overwritten');
`;
vm.runInNewContext(script.replace(boot,test),{document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelectorAll:()=>[],createElement:node},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,alert(){},console:{warn(){}},Event,dispatchEvent(){}},{timeout:5000});
assert.ok([...store.keys()].some(k=>k.startsWith('wanderer_backup_')));console.log('PASS legacy/corrupt save preservation, characters, guest/account isolation and stale-tab protection');
