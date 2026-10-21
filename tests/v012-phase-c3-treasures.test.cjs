'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../online/v012-treasures.js');
require('../online/v012-save.js');
const S=globalThis.WandererV012Save;
const T=globalThis.WandererV012Treasures;
const create=require('./v012-economy-harness.cjs');
const expected=[
 ['gem-pouch','Gem Pouch',8,'treasure_gem_pouch.webp'],
 ['jeweled-chalice','Jeweled Chalice',16,'treasure_jeweled_chalice.webp'],
 ['golden-lion-statuette','Golden Lion Statuette',24,'treasure_golden_lion_statuette.webp'],
 ['jeweled-gold-platter','Jeweled Gold Platter',32,'treasure_jeweled_gold_platter.webp'],
 ['royal-crown','Royal Crown',40,'treasure_royal_crown.webp'],
 ['ornate-chest','Ornate Chest',55,'treasure_ornate_chest.webp']
];
test('C.3 six named treasures have exact values and valid WebP assets',()=>{
 assert.equal(T.CATALOG.length,6);
 for(const [treasureId,name,worth,file] of expected){
  const t=T.CATALOG.find(t=>t.id===treasureId);
  assert.deepEqual([t.name,t.worth,t.image],[name,worth,'assets/loot/'+file]);
  const bytes=fs.readFileSync(t.image);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.byteLength>1024);
  const picked=T.create('loot-'+treasureId,50);
  const variant=T.byDropId(picked.id);
  assert.deepEqual([picked.id,picked.name,picked.worth,picked.image],['loot-'+treasureId,variant.name,variant.worth,variant.image]);
 }
});
test('C.3 old names and unknown valuables gain images without changing IDs or sale values',()=>{
 const a=create(231),profile=a.state();
 const legacy=[['Antique Coins',8,'gem-pouch'],['Golden Chalice',18,'jeweled-chalice'],['Runic Gem',27,'gem-pouch'],['Ancient Idol',40,'golden-lion-statuette'],['Jeweled Crown',55,'royal-crown'],['Mystery',93,'gem-pouch']];
 profile.valuables=legacy.map(([name,worth],n)=>({id:'old-'+n,kind:'valuable',name,worth}));
 const raw=S.create({...profile,run:null});
 assert.deepEqual(profile.valuables.map(v=>v.name),legacy.map(v=>v[0]),'source profile remains unchanged');
 const restored=S.validate(JSON.stringify(raw)).profile.valuables;
 for(let i=0;i<legacy.length;i++){
  assert.equal(restored[i].id,'old-'+i);
  assert.equal(restored[i].worth,legacy[i][1]);
  assert.equal(restored[i].treasureType,legacy[i][2]);
  assert.equal(restored[i].image,T.CATALOG.find(t=>t.id===legacy[i][2]).image);
 }
 const oldV12=structuredClone(raw);
 oldV12.profile.valuables=legacy.map(([name,worth],n)=>({id:'old-'+n,kind:'valuable',name,worth}));
 const storedText=JSON.stringify(oldV12),reloaded=S.validate(storedText);
 assert.equal(JSON.stringify(oldV12),storedText,'validation never edits the saved payload');
 assert.deepEqual(reloaded.profile.valuables.map(v=>v.worth),legacy.map(v=>v[1]));
 assert.deepEqual(reloaded.profile.valuables.map(v=>v.image),restored.map(v=>v.image));
 oldV12.expedition.presentation={...a.results(),review:'realm',realm:{level:1,plane:1,outcome:'cleared',name:'Test Realm',family:'blood',enemy:'Test Enemy',seconds:1,gold:0,fragments:0,loot:[],treasures:[{id:'old-result',name:'Golden Chalice',worth:18}],log:[]}};
 const result=S.validate(oldV12).expedition.presentation.realm.treasures[0];
 assert.deepEqual([result.id,result.name,result.worth,result.image],['old-result','Jeweled Chalice',18,'assets/loot/treasure_jeweled_chalice.webp']);
});
test('C.3 Stash, bag, reward and extraction summary render images; Sell All preserves the total',()=>{
 const a=create(232),s=a.state(),one={id:'loot-one',kind:'valuable',treasureType:'jeweled-chalice',name:'Jeweled Chalice',worth:16,image:'assets/loot/treasure_jeweled_chalice.webp',tier:1},two={id:'loot-two',kind:'valuable',treasureType:'ornate-chest',name:'Ornate Chest',worth:55,image:'assets/loot/treasure_ornate_chest.webp',tier:1};
 s.valuables=[one,two];
 assert.match(a.treasures.stash(),/treasure_jeweled_chalice\.webp/);
 assert.match(a.treasures.stash(),/treasure_ornate_chest\.webp/);
 a.bag.mark(one);
 assert.match(a.treasures.bag(),/treasure_jeweled_chalice\.webp/);
 const result=a.results();
 result.review='realm';result.realm={level:1,plane:1,outcome:'cleared',name:'Test Realm',family:'blood',seconds:1,gold:0,fragments:0,loot:[],treasures:[one],log:[]};
 assert.match(a.treasures.result(),/Realm treasures[\s\S]*treasure_jeweled_chalice\.webp/);
 result.review='summary';result.summary={level:1,outcome:'extracted',realms:1,families:['blood'],picks:[],seconds:1,gold:0,fragments:0,kept:[],lost:[],discarded:[],treasuresKept:[one,two],treasuresLost:[],runeTier:null};
 assert.match(a.treasures.result(),/EXTRACTION COMPLETE[\s\S]*treasure_ornate_chest\.webp/);
 result.summary={...result.summary,outcome:'victory',realms:15};
 assert.match(a.treasures.result(),/EXPEDITION COMPLETE[\s\S]*treasure_jeweled_chalice\.webp/);
 result.summary={...result.summary,outcome:'defeat',treasuresKept:[],treasuresLost:[one]};
 assert.match(a.treasures.result(),/EXPEDITION LOST[\s\S]*treasure_jeweled_chalice\.webp/);
 result.review=null;
 const before=s.gold;
 assert.equal(a.treasures.sell(),true);
 assert.equal(s.gold-before,71);
 assert.equal(s.valuables.length,0);
 assert.match(a.treasures.stash(),/No valuables in Stash/);
});
test('C.3 expedition reward keeps the existing single drop check and renders its treasure',()=>{
 const a=create(233);a.start();a.initial('blood');
 const offer=a.controller().state.offers.find(x=>x.family==='blood');offer.waves=1;
 a.select(offer.id);a.enter();a.rng(0);
 a.state().run.enemy.hp=0;a.win();
 const loot=a.state().run.valuables;
 assert.equal(loot.length,1);
 assert.equal(loot[0].image,T.resolve(loot[0]).image);
 assert.ok(T.CATALOG.some(t=>t.name===loot[0].name&&t.worth===loot[0].worth));
 assert.ok(a.treasures.combat().includes(loot[0].image));
 assert.equal(a.results().realm.treasures.length,1);
});
test('C.3 older active checkpoint restores treasure image and summary ledger once',()=>{
 const a=create(234);a.start();
 const old={id:'old-run-loot',kind:'valuable',name:'Golden Chalice',worth:18,tier:1};
 a.state().valuables.push(old);a.bag.mark(old);
 const checkpoint=a.checkpoint.capture();delete checkpoint.session.results.realm;
 a.checkpoint.restore(checkpoint);
 assert.equal(a.state().valuables[0].id,'old-run-loot');
 assert.equal(a.state().valuables[0].worth,18);
 assert.equal(a.state().valuables[0].image,'assets/loot/treasure_jeweled_chalice.webp');
 assert.equal(a.state().valuables[0].name,'Jeweled Chalice');
});
