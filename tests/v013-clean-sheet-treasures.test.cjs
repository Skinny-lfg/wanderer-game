'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v012-treasures.js');
const T=globalThis.WandererV012Treasures;
test('current treasure types are generated with IDs and can be resolved without names',()=>{
 assert.equal(T.CATALOG.length,6);
 for(let i=0;i<256;i++){
  const item=T.create('loot-'+i,1);
  assert(item.treasureType);
  assert.equal(T.resolve(item).id,item.treasureType);
  assert.equal(T.image(item),item.image);
  assert.equal(T.normalize({...item,name:'Not relevant'}).treasureType,item.treasureType);
 }
});
test('old treasure names are not silently migrated in clean-sheet runtime',()=>{
 assert.equal(T.resolve({name:'Ancient Idol'}).id,T.CATALOG[0].id);
 assert.equal(T.resolve({name:'Golden Chalice'}).id,T.CATALOG[0].id);
 for(const path of ['online/v012-treasures.js','docs/online/v012-treasures.js']){
  const source=fs.readFileSync(path,'utf8');
  assert(!source.includes('const LEGACY='));
  assert(!source.includes('LEGACY[item?.name]'));
 }
});
