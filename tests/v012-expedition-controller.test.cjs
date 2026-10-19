// v0.12 Phase 1 - isolated Expedition state-machine regression.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'online/v012-expedition-controller.js'),'utf8');
const env={};
vm.runInNewContext(source,env,{filename:'v012-expedition-controller.js'});
const engine=env.WandererV012Expedition;
const THEMES=['temple','forge','crypt','bastion','frost','ash','void','ward','grove','shrine','storm','drowned','quarry'].map(id=>({id,name:id,image:'assets/dungeons/backgrounds/'+id+'.webp'}));
const rng=(initial=0xABCD)=>{let seed=initial;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}};
test('Phase 1 produces exactly fifteen Planes, three visible offers, sequential Waves and boss-only unlock',()=>{
 const ctrl=engine.create(THEMES,rng());
 const state=ctrl.state;
 assert.equal(state.unlocked,1);
 assert.throws(()=>ctrl.start(2),/locked/);
 ctrl.start(1);
 assert.equal(state.rooms.length,15);
 assert.equal(state.rooms.filter(k=>k==='boss').length,1);
 assert.equal(state.rooms.at(-1),'boss');
 for(let i=1;i<=15;i++){
  assert.equal(state.planeIndex,i);
  assert.equal(state.stage,'choice');
  assert.equal(state.offers.length,3);
  assert.equal(new Set(state.offers.map(p=>p.family)).size,3);
  const p=state.offers[0];
  assert(p.waves>=1&&p.waves<=3);
  assert.equal(p.boss,i===15);
  assert.equal(p.event,['chest','event','altar'].includes(state.rooms[i-1])?state.rooms[i-1]:null);
  assert(p.image.includes('assets/dungeons/backgrounds'));
  ctrl.select(p.id);
  assert.equal(state.stage,'combat');
  for(let wave=1;wave<=p.waves;wave++){
   assert.equal(state.wave,wave);
   const outcome=ctrl.waveWon();
   if(wave<p.waves){assert.equal(outcome.planeComplete,false);assert.equal(outcome.nextWave,wave+1);}
   else {assert.equal(outcome.planeComplete,true);assert.equal(!!outcome.expeditionComplete,i===15);}
  }
  if(i<15)assert.equal(state.unlocked,1,'no early Expedition unlock');
 }
 assert.equal(state.stage,'finished');
 assert.equal(state.history.length,15);
 assert.equal(state.unlocked,2);
 assert.equal(state.families.length,0,'temporary affinities expire on completed Expedition');
 ctrl.start(2);
 assert.equal(state.planeIndex,1);
 assert.equal(state.unlocked,2);
});
test('first affinity cannot repeat until second; after second repeats immediately; three-family cap',()=>{
 const ctrl=engine.create(THEMES,rng(99));
 ctrl.start(1);
 const first=ctrl.state.offers[0];
 ctrl.select(first.id);
 for(let i=0;i<first.waves;i++)ctrl.waveWon();
 assert.equal(ctrl.state.planeIndex,2);
 assert(!ctrl.allowed().includes(first.family));
 assert(ctrl.state.offers.every(p=>p.family!==first.family));
 const second=ctrl.state.offers[0];assert.notEqual(second.family,first.family);
 ctrl.select(second.id);
 for(let i=0;i<second.waves;i++)ctrl.waveWon();
 assert.equal(ctrl.state.families.length,2);
 assert(ctrl.allowed().includes(first.family));
 assert(ctrl.allowed().includes(second.family));
 const third=ctrl.state.offers.find(p=>!ctrl.state.families.includes(p.family));
 assert(third,'a third family is eligible and shown');
 ctrl.select(third.id);
 for(let i=0;i<third.waves;i++)ctrl.waveWon();
 assert.equal(ctrl.state.families.length,3);
 assert.equal(ctrl.state.offers.length,3);
 assert(ctrl.state.offers.every(p=>ctrl.state.families.includes(p.family)));
 for(let i=0;i<4;i++){
  const current=ctrl.state.offers[0];ctrl.select(current.id);
  for(let n=0;n<current.waves;n++)ctrl.waveWon();
  assert.equal(ctrl.state.families.length,3);
  assert(ctrl.state.stage==='choice');
 }
});
test('defeat does not unlock difficulty, clears temporary affinities and allows a fresh Expedition',()=>{
 const ctrl=engine.create(THEMES,rng(777));ctrl.start();
 const p=ctrl.state.offers[0];ctrl.select(p.id);
 assert.throws(()=>ctrl.start(1),/already active/);
 ctrl.defeat();
 assert.equal(ctrl.state.unlocked,1);
 assert.equal(ctrl.state.stage,'failed');
 assert.equal(ctrl.state.families.length,0);
 assert.throws(()=>ctrl.waveWon(),/No active/);
 ctrl.start(1);assert.equal(ctrl.state.planeIndex,1);
 assert.equal(ctrl.state.history.length,0);
});
test('invalid and missing content never enters the classic engine through an illegitimate selection',()=>{
 assert.deepEqual(Array.from(engine.FAMILIES),['blood','decay','vitality','aegis','fury','magic']);
 assert.throws(()=>engine.create([]),/themes/);
 assert.throws(()=>engine.create(THEMES.filter(t=>t.id!=='forge')),/Missing classic themes/);
 const ctrl=engine.create(THEMES,rng(41));
 assert.throws(()=>ctrl.select('forge'),/not available/i);
 ctrl.start(1);
 assert.throws(()=>ctrl.select('not-offered'),/Not an offered/);
 assert.throws(()=>ctrl.waveWon(),/No active/);
 assert.equal(ctrl.state.stage,'choice');
});
test('preview bridge stays opt-in, imports production enemies/art/VFX, and cannot save to account',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert(html.includes("new URLSearchParams(globalThis.location?.search||'').get('expeditionPhase1')==='1'"));
 assert(html.includes('if(PHASE1_PREVIEW||saveBlocked)return;'));
 assert(html.includes("if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}"));
 for(const required of ['function phase1Choose(id)','function phase1StartWave()','function phase1WaveWon()',
  'function phase1Death()','enemyFor(r.tier,r.enc,{theme,boss:',
  'setRuntime(r)','updateFight();','legendaryKill(r)','dungeonEquipmentPick(theme,[])',
  'function phase1DecorateCombat()','globalThis.WandererGame']){
  assert(html.includes(required),required);
 }
 assert(html.includes('if(isPhase1Run()){phase1WaveWon();return;}'));
 assert(html.includes('if(isPhase1Run()){phase1Death();return;}'));
 assert(html.includes('v012PrototypeLoader')&&html.includes('onlineAccountLoader'),'classic modules conditionally loaded outside preview');
 assert(html.includes('document.write('),'classic modules retain parser-inserted timing');
 assert.equal(fs.existsSync(path.join(root,'online/v012-phase1.css')),true);
});

test('Phase 3 rerolls are capped per Expedition and preserve the original Plane risk contract',()=>{
 const ctrl=engine.create(THEMES,rng(212));
 ctrl.start(1);
 assert.equal(ctrl.state.rerollsLeft,2);
 const firstKind=ctrl.state.rooms[0];
 const offer=ctrl.state.offers[0];
 const firstId=ctrl.state.offers.map(x=>x.id).join(',');
 assert.equal(ctrl.reroll().length,3);
 assert.equal(ctrl.state.rerollsLeft,1);
 assert.equal(ctrl.state.rooms[0],firstKind);
 assert.equal(ctrl.state.offers.every(x=>x.boss===offer.boss),true);
 assert.notEqual(ctrl.state.offers.map(x=>x.id).join(','),firstId,'reroll offers a new route selection');
 ctrl.reroll();
 assert.equal(ctrl.state.rerollsLeft,0);
 assert.throws(()=>ctrl.reroll(),/No Plane rerolls/);
 const chosen=ctrl.state.offers[0];ctrl.select(chosen.id);
 assert.throws(()=>ctrl.reroll(),/No Plane rerolls/);
 for(let n=0;n<chosen.waves;n++)ctrl.waveWon();
 assert.equal(ctrl.state.rerollsLeft,0,'new Plane does not refill rerolls');
 assert.equal(ctrl.state.stage,'choice');
});
