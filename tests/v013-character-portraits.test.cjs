'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sandbox={};vm.runInNewContext(read('online/v013-character-art.js'),sandbox);
const choose=sandbox.WandererCharacterArt.imageForEquipment;
test('All 28 source WebP portraits survive with byte-identical Pages mirrors',()=>{
 const folder=path.join(root,'assets/characters/loadouts');
 const names=fs.readdirSync(folder).filter(n=>n.endsWith('.webp'));
 assert.equal(names.length,28);
 for(const name of names){
  const a=fs.readFileSync(path.join(folder,name));
  const b=fs.readFileSync(path.join(root,'docs/assets/characters/loadouts',name));
  assert.equal(a.toString('ascii',0,4),'RIFF');
  assert.equal(a.toString('ascii',8,12),'WEBP');
  assert(a.length<250000,name);
  assert.deepEqual(a,b);
 }
});
test('All native single-handed loadouts map to real restored images',()=>{
 for(const w of ['Sword','Mace','Daggers','Wand'])
  for(const o of ['Shield','Orb','Tome','Charm','Off-Hand Dagger']){
   const image=choose({weapon:{subtype:w},offhand:{subtype:o}});
   assert(fs.existsSync(path.join(root,image)),image);
  }
 for(const w of ['Bow','Staff','Two-Handed'])
  assert.equal(choose({weapon:{subtype:w},offhand:{subtype:'Shield'}}),choose({weapon:{subtype:w}}));
 assert.equal(choose(null),'assets/characters/loadouts/base.webp');
});
test('Both HTML variants use equipment-driven portraits, not the old character picker',()=>{
 for(const p of ['index.html','docs/index.html']){
  const h=read(p);
  assert(h.includes('online/v013-character-art.js?v=20261121'));
  assert(h.includes('online/v013-portrait-integration.css?v=20261121'));
  assert(h.includes('globalThis.WandererCharacterArt?.imageForEquipment(state.equip)'));
  assert(!h.includes('phase3CharacterPickerHitbox'));
  assert(!h.includes('data-phase1-hero'));
  assert.equal((h.match(/class="characterGroundShadow"/g)||[]).length,1);
  assert(h.includes('class="model" src="\${heroFullImage()}"'));
  assert(h.includes('id="heroPortrait" src="\${heroFullImage()}"'));
 }
});
test('Source and Pages retain the same Stage 6 color grade, plus improved shadow positions',()=>{
 for(const p of ['v012-ui5-camp.css','v012-ui6-unified-inventory.css','v013-portrait-integration.css']){
  assert.equal(read('online/'+p),read('docs/online/'+p));
 }
 assert(read('online/v012-ui5-camp.css').includes('saturate(1.20)'));
 assert(read('online/v012-ui6-unified-inventory.css').includes('saturate(1.20)'));
 assert(!read('online/v012-ui5-camp.css').includes('phase3CharacterPickerHitbox'));
 const css=read('online/v013-portrait-integration.css');
 assert(css.includes('scale(.80)')&&css.includes('filter:blur(6px)'));
 assert(css.includes('.phase3BagInventory .equipmentLoadout .paper>.characterGroundShadow'));
});
