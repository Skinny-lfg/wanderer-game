'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const manifest=require('../assets/c3-assets.json');
const html=fs.readFileSync('index.html','utf8');
const ids=['crimson-fang','chalice-hollow-king','gravewake','eye-of-morrow','verdant-oath','heartroot-carapace','oathwall','veil-thousand-seals','kingsbreaker','tempest-talon','astrafall','voidglass'];
function checkPng(path){
  assert.ok(fs.existsSync(path),'Missing '+path);
  const file=fs.readFileSync(path);
  assert.ok(file.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Not PNG: '+path);
  assert.ok(file.byteLength>1024,'Too small: '+path);
}
test('C.3.1: every new Legendary is mapped to a real PNG',()=>{
  assert.deepEqual(Object.keys(manifest.legendary).sort(),ids.slice().sort());
  for(const id of ids){
    const record=manifest.legendary[id];
    assert.equal(record.path,'assets/legendary/'+id+'.png');
    checkPng(record.path);
    const line=html.split('\n').find(line=>line.includes("catalogueNew:true,id:'"+id+"'"));
    assert.ok(line?.includes("image:'"+id+".png'"),'Legendary not mapped: '+id);
  }
});
test('C.3.1: six affinity families and Magic choices have PNG icons',()=>{
  const names=['families/blood','families/decay','families/vitality','families/aegis','families/fury','families/magic','magic/fire','magic/frost','magic/lightning'];
  assert.deepEqual(Object.keys(manifest.affinities).sort(),names.slice().sort());
  for(const n of names)checkPng(manifest.affinities[n].path);
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
