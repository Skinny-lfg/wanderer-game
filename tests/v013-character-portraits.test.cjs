const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={};
vm.runInNewContext(fs.readFileSync(path.join(root,'online/v013-character-art.js'),'utf8'),context);
const image=context.WandererCharacterArt.imageForEquipment;
const folder=path.join(root,'assets/characters/loadouts');
test('all weapon and offhand pairs resolve to real optimized images',()=>{
  const mains={Sword:'sword',Mace:'mace',Daggers:'dagger',Wand:'wand'};
  const hands={Shield:'shield',Orb:'orb',Tome:'tome',Charm:'charm','Off-Hand Dagger':'dagger'};
  for(const [mainKey,mainName] of Object.entries(mains)){
    for(const [offKey,offName] of Object.entries(hands)){
      const result=image({weapon:{subtype:mainKey},offhand:{subtype:offKey}});
      assert.equal(result,'assets/characters/loadouts/'+mainName+'-'+offName+'.webp');
      assert.ok(fs.existsSync(path.join(root,result)),result);
    }
  }
});
test('single-hand, two-hand, empty, unknown item and stale offhand fall back safely',()=>{
  for(const [type,name] of Object.entries({Sword:'sword',Mace:'mace',Daggers:'dagger',Wand:'wand',Bow:'bow',Staff:'staff','Two-Handed':'twohand'})){
    assert.equal(image({weapon:{subtype:type}}),'assets/characters/loadouts/'+name+'.webp');
  }
  for(const type of ['Bow','Staff','Two-Handed']){
    assert.equal(image({weapon:{subtype:type},offhand:{subtype:'Shield'}}),'assets/characters/loadouts/'+({Bow:'bow',Staff:'staff','Two-Handed':'twohand'})[type]+'.webp');
  }
  assert.equal(image({}),'assets/characters/loadouts/base.webp');
  assert.equal(image(null),'assets/characters/loadouts/base.webp');
  assert.equal(image({weapon:{subtype:'unrecognized'},offhand:{subtype:'Orb'}}),'assets/characters/loadouts/base.webp');
  assert.equal(image({weapon:{subtype:'Sword'},offhand:{subtype:'unrecognized'}}),'assets/characters/loadouts/sword.webp');
  assert.equal(image({weapon:{subtype:'Sword'},offhand:{subtype:'Daggers'}}),'assets/characters/loadouts/sword-dagger.webp');
});
test('all 28 images are WebP with preserved transparency',()=>{
  const names=fs.readdirSync(folder).filter(n=>n.endsWith('.webp'));
  assert.equal(names.length,28);
  for(const name of names){
    const data=fs.readFileSync(path.join(folder,name));
    assert.equal(data.toString('ascii',0,4),'RIFF');
    assert.equal(data.toString('ascii',8,12),'WEBP');
    assert.ok(data.length<250_000,name+' is unexpectedly large');
  }
});
test('character picker removed and both camp and combat use dynamic images',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.includes('online/v013-character-art.js'));
  assert.ok(html.includes('WandererCharacterArt?.imageForEquipment(state.equip)'));
  assert.ok(!html.includes('phase3CharacterPickerHitbox'));
  assert.ok(!html.includes('data-phase1-hero'));
  assert.ok(html.includes('id="heroPortrait" src="${heroFullImage()}"'));
  assert.ok(html.includes('class="model" src="${heroFullImage()}"'));
});

test('camp portrait is reduced and has ground-only shadow',()=>{
  const css=fs.readFileSync(path.join(root,'online/v012-ui5-camp.css'),'utf8');
  const tuned=css.slice(css.indexOf('/* v0.13: scaled equipment portrait'));
  assert.ok(tuned.length>400,'portrait tuning CSS missing');
  assert.match(tuned,/\.phase3CampCharacter \.paper>\.model\s*\{[^}]*scale\(\.80\)[^}]*filter:none/s,'portrait must shrink without silhouette drop-shadow');
  assert.match(tuned,/\.phase3CampCharacter \.paper::before\s*\{[^}]*radial-gradient\(ellipse at center[^}]*pointer-events:none/s,'contact shadow should sit below boots');
  assert.match(tuned,/top:calc\(var\(--camp-vitals-row\) \+ 4 \* var\(--camp-slot-row\) - 18px\)/,'shadow must track equipment grid, not viewport');
  assert.match(tuned,/@media\(max-width:700px\)/,'mobile portrait sizing must be defined');
});
