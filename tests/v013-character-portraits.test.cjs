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

test('all paper dolls render one dedicated shadow beneath the avatar',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/class="model" src="\$\{heroFullImage\(\)\}"[^>]+><span class="characterGroundShadow" aria-hidden="true"><\/span>/);
  assert.equal((html.match(/class="characterGroundShadow"/g)||[]).length,1,'shared markup must supply a single ground shadow to each view');
});
test('camp portrait is reduced and shadow stays under the boots',()=>{
  const css=fs.readFileSync(path.join(root,'online/v012-ui5-camp.css'),'utf8');
  const tuned=css.slice(css.indexOf('/* v0.13: one visible ground shadow'));
  assert.ok(tuned.length>500,'camp portrait tuning missing');
  assert.match(tuned,/\.paper>\.model\s*\{[^}]*scale\(\.80\)[^}]*filter:none/s);
  assert.match(tuned,/\.paper>\.characterGroundShadow\s*\{[^}]*top:calc\(var\(--camp-vitals-row\)[^}]*radial-gradient\(ellipse at center[^}]*pointer-events:none/s);
  assert.match(tuned,/filter:blur\(6px\)/,'contact shadow must feather at the edges');
  assert.ok(!tuned.includes('rgba(0,0,0,.94)'),'contact shadow must not be a solid black oval');
  assert.ok(!tuned.includes('.paper::before'),'old unreliable pseudo shadow removed');
});
test('inventory and equipment portraits match camp scale and have no silhouette filter',()=>{
  const css=fs.readFileSync(path.join(root,'online/v012-ui6-unified-inventory.css'),'utf8');
  const portrait=css.slice(css.indexOf('.phase3IntegratedPreview :is(.equipmentOverview,.phase3BetweenGear) .equipmentLoadout .paper>.model'));
  assert.match(portrait,/transform:translateY\(-22px\) scale\(\.80\)!important/);
  assert.match(portrait,/filter:none!important/);
  assert.match(css,/\.paper>\.characterGroundShadow\s*\{[^}]*top:calc\(5 \* var\(--gear-row\) - 11px\)[^}]*radial-gradient\(ellipse at center/s);
  assert.match(css,/\.phase3BagInventory \.equipmentLoadout \.paper>\.characterGroundShadow/,'expedition inventory is also covered');
});

test('GitHub Pages preview includes the same feathered ground shadow as source',()=>{
  const sourceHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const pagesHTML=fs.readFileSync(path.join(root,'docs/index.html'),'utf8');
  assert.equal((pagesHTML.match(/class="characterGroundShadow"/g)||[]).length,1,'Pages paper doll has a single shadow layer');
  assert.ok(sourceHTML.includes('<span class="characterGroundShadow" aria-hidden="true"></span>'));
  for(const cssName of ['v012-ui5-camp.css','v012-ui6-unified-inventory.css']){
    const source=fs.readFileSync(path.join(root,'online',cssName),'utf8');
    const pages=fs.readFileSync(path.join(root,'docs/online',cssName),'utf8');
    assert.equal(pages,source,'Pages should match source shadow styles: '+cssName);
    assert.ok(pages.includes('filter:blur(6px)'),'soft feathered shadow present on Pages');
    assert.ok(!pages.includes('rgba(0,0,0,.94)'),'no opaque black oval on Pages');
  }
});
