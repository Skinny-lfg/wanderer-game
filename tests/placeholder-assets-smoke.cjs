// Equipment placeholder pack and Common-only Old Sword checks. Node built-ins only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const assets=['sword','mace','daggers','two_handed','bow','staff','wand','shield','orb','tome','charm','helmet','chest','amulet','ring','boots','gloves','off_hand_dagger'];
for(const key of assets){
 const data=fs.readFileSync(path.join(root,'assets','placeholders',key+'.svg'),'utf8');
 const match=data.match(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/);
 assert(match,'PNG embedded in placeholder '+key);
 const png=Buffer.from(match[1],'base64');
 assert(png.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),'PNG signature '+key);
 assert.equal(png.readUInt32BE(16),256,'image width '+key);
 assert.equal(png.readUInt32BE(20),256,'image height '+key);
 assert.equal(png[25],6,'RGBA transparency '+key);
}
assert(html.includes('.slotTile:not(.filled) img{opacity:.5}'),'empty gear slots at 50% opacity');
assert(html.includes("placeholderIcon(kind)"),'favored dungeon images use the supplied placeholder pack');
const src=html.match(/<script>([\s\S]*?)<\/script>/)?.[1],boot="load();if(!state.merchant)rollShop();save();render();";
assert(src&&src.includes(boot),'game bootstrap present');
const testCode=String.raw`
fresh();
function check(ok,msg){if(!ok)throw Error(msg);}
check(starter().name==='Old Sword'&&starter().rarity==='Common','new starter is Common Old Sword');
check(itemImg(starter())===placeholderIcon('Sword'),'starter image is supplied old sword art');
check(itemImg({name:'Training Sword',subtype:'Sword',rarity:'Common',slot:'weapon'})===placeholderIcon('Sword'),'legacy Training Sword artwork still works');
const legacyStarter={...starter(),name:'Training Sword'},migrated=migrateItem(legacyStarter);
check(migrated.name==='Old Sword'&&migrated.atk===legacyStarter.atk&&migrated.id===legacyStarter.id,'legacy starter save renamed without item loss');
let foundOld=0;
for(let i=0;i<500;i++){
 const item=makeItem(5,'weapon',null,'loot','Sword','Common');
 if(item.name==='Old Sword'){foundOld++;check(itemImg(item)===placeholderIcon('Sword'),'Old Sword uses placeholder image');}
}
check(foundOld>0,'Old Sword can drop as Common');
for(const rarity of ['Uncommon','Rare','Epic','Legendary']){
 for(let i=0;i<300;i++)check(makeItem(20,'weapon',null,'loot','Sword',rarity).name!=='Old Sword','Old Sword never drops above Common');
}
const fav=THEMES[0],gear=favoredGearMarkup(fav,['Sword','Ring','Boots']);
check((gear.match(/assets\/placeholders\//g)||[]).length===3,'all three dungeon affinity images are placeholders');
check(!gear.includes('assets/equipment/'),'favored previews have no ordinary randomized item art');
check(gear.includes(placeholderIcon('Ring'))&&gear.includes(placeholderIcon('Boots')),'dungeon affinities use new Ring and Boots icons');
const added={
  'Amulet':'amulet','Ring':'ring','Boots':'boots','Gloves':'gloves','Off-Hand Dagger':'off_hand_dagger',
  amulet:'amulet',ring1:'ring',ring2:'ring',boots:'boots',gloves:'gloves'
};
for(const [kind,icon] of Object.entries(added)){
 check(placeholderIcon(kind)==='assets/placeholders/'+icon+'.svg',kind+' maps to its dedicated placeholder');
}
for(const kind of [...TYPES,...OFFHAND_TYPES]){
 check(forgePreviewImage('weapon',kind)===placeholderIcon(kind),'Forge preview uses dedicated '+kind+' placeholder');
}
for(const slot of SLOTS){
 check(forgePreviewImage(slot,'random')===placeholderIcon(slot),'Forge random subtype preview uses '+slot+' placeholder');
}
check(forgePreviewImage('offhand','Off-Hand Dagger')===placeholderIcon('Off-Hand Dagger'),'Forge off-hand dagger uses its unique placeholder');
check(forgePreviewImage('weapon','Sword')===placeholderIcon('Sword'),'Forge Sword preview never uses random gear art');
globalThis.__placeholderPassed=true;
`;
const sandbox={localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,querySelectorAll:()=>[],createElement:()=>({})},console,setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0,clearTimeout:()=>{}};
vm.runInNewContext(src.replace(boot,testCode),sandbox,{timeout:6000});
assert(sandbox.__placeholderPassed,'placeholder gear regression');
console.log('PASS: 18 images, Forge preview, empty slots, dungeon affinity imagery, Common-only Old Sword');
