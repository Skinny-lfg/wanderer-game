'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const manifest=require('../assets/c3-assets.json');
const html=fs.readFileSync('index.html','utf8');
const ids=['crimson-fang','chalice-hollow-king','gravewake','eye-of-morrow','verdant-oath','heartroot-carapace','oathwall','veil-thousand-seals','kingsbreaker','tempest-talon','astrafall','voidglass'];
function checkImage(path){
  assert.ok(fs.existsSync(path),'Missing '+path);
  const file=fs.readFileSync(path);
  assert.ok((path.endsWith('.webp')&&file.toString('ascii',0,4)==='RIFF'&&file.toString('ascii',8,12)==='WEBP') || (path.endsWith('.png')&&file.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))),'Unsupported asset: '+path);
  assert.ok(file.byteLength>1024,'Too small: '+path);
}
test('C.3.1: every new Legendary is mapped to a real PNG',()=>{
  assert.deepEqual(Object.keys(manifest.legendary).sort(),ids.slice().sort());
  for(const id of ids){
    const record=manifest.legendary[id];
    assert.equal(record.path,'assets/legendary/'+id+'.webp');
    checkImage(record.path);
    const line=html.split('\n').find(line=>line.includes("catalogueNew:true,id:'"+id+"'"));
    assert.ok(line?.includes("image:'"+id+".webp'"),'Legendary not mapped: '+id);
  }
});
test('C.3.1: six affinity families and Magic choices have PNG icons',()=>{
  const names=['families/blood','families/decay','families/vitality','families/aegis','families/fury','families/magic','magic/fire','magic/frost','magic/lightning'];
  assert.deepEqual(Object.keys(manifest.affinities).sort(),names.slice().sort());
  for(const n of names)checkImage(manifest.affinities[n].path);
  assert.ok(html.includes('class="affinityFamilyIcon"'));
  assert.ok(html.includes('class="magicChoiceIcon"'));
  assert.ok(html.includes("function phase2FamilyIcon(family)"));
});
test('C.3.1: preserves original gameplay configuration and legacy status glyphs',()=>{
  assert.ok(html.includes('const WANDERER_NEW_LEGENDARY_DROPS_ENABLED=true;'));
  assert.ok(html.includes('const NEW_LEGENDARY_CATALOG=['));
  assert.ok(html.includes('const AFFINITY_ART=['));
  assert.ok(html.includes("item-icons-simplified.svg"));
});

test('C.3.3: all twelve stable dungeon IDs use optimized desktop and mobile WebP',()=>{
 const d=require('../assets/dungeons/c3/manifest.json');
 assert.equal(Object.keys(d.themeIds).length,12);
 assert.equal(Object.keys(d.backgrounds).length,24);
 for(const [id,slug] of Object.entries(d.themeIds)){
  const desktop=d.backgrounds[slug],mobile=d.backgrounds[slug+'_mobile'];
  assert.ok(desktop && mobile,id+' missing background pair');
  for(const path of [desktop,mobile]){
   assert.ok(fs.existsSync(path),'missing '+path);
   const b=fs.readFileSync(path);
   assert.equal(b.toString('ascii',0,4),'RIFF');
   assert.equal(b.toString('ascii',8,12),'WEBP');
  }
  assert.ok(html.includes('"'+id+'":"'+desktop+'"'),'Dungeon UI mapping '+id);
 }
 assert.ok(html.includes("window.matchMedia('(max-width: 650px)')"));
});

test('C.3.2: Cloth/Leather/Plate artwork maps to the correct five slots',()=>{
 const m=require('../assets/equipment/c3/manifest.json');
 assert.equal(Object.keys(m.variants).length,3);
 let count=0;
 for(const [kind,slots] of Object.entries(m.variants)){
  assert.ok(['Cloth','Leather','Plate'].includes(kind));
  assert.deepEqual(Object.keys(slots).sort(),['helm','armor','gloves','boots','belt'].sort());
  for(const [slot,paths] of Object.entries(slots)){
   assert.equal(paths.length,2,kind+' '+slot);
   for(const path of paths){
    count++;
    assert.ok(path.startsWith('assets/equipment/c3/armor_'+kind.toLowerCase()+'_'));
    assert.ok(fs.existsSync(path),'missing '+path);
    const b=fs.readFileSync(path);
    assert.equal(b.toString('ascii',0,4),'RIFF');
    assert.equal(b.toString('ascii',8,12),'WEBP');
   }
  }
 }
 assert.equal(count,30);
 assert.ok(html.includes('function c3ArmorImage(o)'));
 assert.ok(html.includes('const c3Armor=c3ArmorImage(o);if(c3Armor)return c3Armor;'));
});


test('C.3.4: all 47 weapons, off-hands and jewelry are valid WebP and mapped to known categories',()=>{
 const m=require('../assets/equipment/c3/non-armor-manifest.json');
 assert.equal(Object.keys(m.weapons).length,7);
 assert.equal(Object.keys(m.offhands).length,4);
 assert.deepEqual(Object.keys(m.jewelry).sort(),['amulet','ring']);
 assert.deepEqual(Object.keys(m.weapons).sort(),['Bow','Daggers','Mace','Staff','Sword','Two-Handed','Wand'].sort());
 assert.deepEqual(Object.keys(m.offhands).sort(),['Charm','Orb','Shield','Tome'].sort());
 let count=0;
 const paths=new Set();
 for(const catalog of [m.weapons,m.offhands,m.jewelry]){
  for(const list of Object.values(catalog)){
   for(const p of list){checkImage(p);assert.ok(!paths.has(p),'duplicate path '+p);paths.add(p);count++;}
  }
 }
 assert.equal(count,47);
 assert.ok(html.includes('const C3_WEAPON_ART='));
 assert.ok(html.includes('const C3_OFFHAND_ART='));
 assert.ok(html.includes('const C3_JEWELRY_ART='));
 assert.ok(html.includes('function c3EquipmentImage(o)'));
 assert.ok(html.includes('const c3Other=c3EquipmentImage(o);if(c3Other)return c3Other;'));
 assert.ok(html.includes("subtype==='Daggers'||subtype==='Off-Hand Dagger'"));
});
