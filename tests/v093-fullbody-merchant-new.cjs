// Regression: full-body character artwork, Merchant reroll UX and persistent NEW loot markers.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('assets/characters/manifest.json','utf8'));
const ids=['wanderer','ranger','knight','spellblade','duelist'];
assert.deepEqual(manifest.characters.map(c=>c.id),ids);
for(const c of manifest.characters){
 const buffer=fs.readFileSync('assets/'+c.fullBody);
 assert.equal(buffer.toString('ascii',0,4),'RIFF',c.id+' valid WebP');
 assert.equal(buffer.toString('ascii',8,12),'WEBP',c.id+' WebP header');
 assert(buffer.byteLength>=40000,c.id+' quality asset not placeholder');
}
assert(html.includes('.tavernAvatar{width:46px')&&html.includes('background:radial-gradient(circle at 48% 30%'),'Tavern circular avatar background');
assert(!html.includes("if(source==='forge')markItemSeen(o.id)"),'Forge popup must not clear new flag');
assert(html.includes('item.isNew=true;state.stash.push(item);'),'Merchant purchase marks stash item NEW');
assert(html.includes('o.isNew=true;state.stash.push(o);'),'Forge craft marks stash item NEW');
assert(!html.includes("if(!confirm('Pay '+m.refreshCost+' Gold to refresh the merchant stock?'))return;"),'Merchant stock refresh does not ask confirmation');
const script=html.slice(html.indexOf('<script>const ART=')+8,html.indexOf('</script>',html.indexOf('<script>const ART=')));
assert(script,'game bootstrap');
new vm.Script(script,'index.html JS');
const boot='load();if(!state.merchant)rollShop();save();render();';
const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},focus(){}});
const sandbox={document:{getElementById:node,querySelectorAll:()=>[],createElement:node},
 localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},alert(){},confirm:()=>true,console};
const injected='fresh();render=renderStash=renderCombat=save=()=>{};globalThis.qa={state,newBadge,markItemSeen,markAllAsSeen,previewItem,makeItem};';
vm.runInNewContext(script.replace(boot,injected),sandbox,{timeout:8000});
const q=sandbox.qa;
const forged=q.makeItem(5,'weapon',null,'forge','Sword','Rare');forged.isNew=true;q.state.stash.push(forged);
q.previewItem(forged,'forge');assert(forged.isNew,'Forge inspect popup leaves NEW flag');
const bought=q.makeItem(5,'offhand',null,'merchant','Shield','Rare');bought.isNew=true;q.state.stash.push(bought);
assert(q.newBadge(forged).includes('NEW')&&q.newBadge(bought).includes('NEW'));
q.markItemSeen(forged.id);assert.equal(forged.isNew,false);assert(bought.isNew);
q.markAllAsSeen();assert.equal(bought.isNew,false);
console.log('PASS full-body assets, avatar background, Merchant stock confirmation removed and NEW badges persist');
