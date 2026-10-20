// Deterministic scheduling tests only: no combat or balance simulation.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),env={};
vm.runInNewContext(fs.readFileSync(path.join(root,'online/v012-expedition-controller.js'),'utf8'),env);
const api=env.WandererV012Expedition;
const themes=['temple','forge','bloodscar','crypt','bastion','frost','ash','void','ward','grove','shrine','storm','drowned','quarry'].map(id=>({id,name:id,image:id+'.webp'}));
const rng=(seed=42)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const create=()=>api.create(themes,rng());
function clear(c){const selected=c.state.selected;if(selected.eventId)c.eventWon();else for(let i=0;i<selected.waves;i++)c.waveWon();}
test('initial affinity is explicit, guaranteed in first offers, and cannot be changed twice',()=>{
 for(const family of api.FAMILIES){
  const c=create();c.start();assert.equal(c.state.offers.length,0);
  assert.throws(()=>c.select('forge'),/not available/);assert.throws(()=>c.enter(),/Select/);
  c.chooseInitial(family);assert(c.state.offers.some(o=>o.family===family));assert.equal(c.state.families.length,1);
  assert.throws(()=>c.chooseInitial('blood'),/unavailable/);assert.equal(c.state.offers.length,3);
 }
});
test('selecting changes no combat or acquired affinity; Enter Realm is the commitment',()=>{
 const c=create();c.start();c.chooseInitial('blood');const chosen=c.state.offers.find(o=>o.family!=='blood');
 c.select(chosen.id);assert.equal(c.state.stage,'choice');assert.equal(c.state.wave,0);assert.deepEqual(Array.from(c.state.families),['blood']);
 c.enter();assert.equal(c.state.stage,'combat');assert.equal(c.state.wave,1);assert(c.state.families.includes(chosen.family));
 assert.throws(()=>c.enter(),/Select/);assert.throws(()=>c.select(chosen.id),/not available/);
});
test('three rerolls belong to each card; other cards, selection, risk template and first affinity survive',()=>{
 const c=create();c.start();c.chooseInitial('blood');const i=c.state.offers.findIndex(o=>o.family==='blood'),j=(i+1)%3;
 c.select(c.state.offers[j].id);const other=c.state.offers[j],selected=c.state.selected;
 for(let n=0;n<3;n++){c.reroll(i);assert.equal(c.state.offers[j],other);assert.equal(c.state.selected,selected);assert(c.state.offers.some(o=>o.family==='blood'));}
 assert.deepEqual(Array.from(c.state.rerollsByRealm[0]).sort(),[0,3,3]);assert.throws(()=>c.reroll(i),/rerolls/);
 for(const bad of [-1,3,NaN,undefined,'0'])assert.throws(()=>c.reroll(bad),/rerolls/);
 c.reroll(j);assert.equal(c.state.selected,null);assert.equal(c.state.rooms[0],'combat');
 c.select(c.state.offers[0].id);c.enter();assert.throws(()=>c.reroll(0),/rerolls/);clear(c);
 assert(c.state.rewardPending);assert.equal(c.state.offers.length,0);assert.throws(()=>c.reroll(0),/rerolls/);
 c.claimReward();assert.deepEqual(Array.from(c.state.rerollsByRealm[1]),[3,3,3]);assert.equal(c.state.rerollsByRealm[0][i],0);
});
test('initial repeat exception only applies to first Realm; two distinct affinities then allow repeats, maximum three',()=>{
 const c=create();c.start();c.chooseInitial('blood');c.select(c.state.offers.find(o=>o.family==='blood').id);c.enter();clear(c);c.claimReward();
 assert(!c.allowed().includes('blood'));assert(c.state.offers.every(o=>o.family!=='blood'));
 c.select(c.state.offers[0].id);c.enter();clear(c);c.claimReward();assert(c.allowed().includes('blood'));
 const third=c.state.offers.find(o=>!c.state.families.includes(o.family));assert(third);c.select(third.id);c.enter();clear(c);c.claimReward();
 assert.equal(c.state.families.length,3);assert(c.state.offers.every(o=>c.state.families.includes(o.family)));
});
test('fifteen Realms, sequential Waves, a single passive gate per cleared Realm, and boss-only unlock',()=>{
 const c=create();assert.throws(()=>c.start(2),/locked/);c.start();c.chooseInitial('aegis');
 assert.equal(c.state.rooms.length,15);assert.equal(c.state.rooms.at(-1),'boss');
 for(let realm=1;realm<=15;realm++){
  const offered=c.state.offers[0];c.select(offered.id);c.enter();assert.equal(offered.boss,realm===15);
  if(offered.eventId){assert.equal(offered.waves,1);assert.equal(c.state.wave,1);assert.throws(()=>c.waveWon(),/No active combat/);c.eventWon();}
  else for(let wave=1;wave<=offered.waves;wave++){assert.equal(c.state.wave,wave);c.waveWon();}
  assert.throws(()=>c.waveWon(),/No active/);
  if(realm<15){assert.equal(c.state.unlocked,1);assert(c.state.rewardPending);assert.throws(()=>c.select(offered.id),/not available/);c.claimReward();assert.throws(()=>c.claimReward(),/No Realm passive/);}
 }
 assert.equal(c.state.unlocked,2);assert.equal(c.state.stage,'finished');assert.equal(c.state.history.length,15);assert.equal(c.state.families.length,0);
});
test('defeat and abandonment clear pending choices without unlocking; invalid content fails closed',()=>{
 assert.throws(()=>api.create([]),/themes/);assert.throws(()=>api.create(themes.filter(t=>!['forge','bloodscar'].includes(t.id))),/Missing/);
 const c=create();c.start();c.chooseInitial('decay');c.select(c.state.offers[0].id);c.enter();c.defeat();
 assert.equal(c.state.stage,'failed');assert.equal(c.state.unlocked,1);assert.equal(c.state.families.length,0);
 c.start();c.abandon();assert.equal(c.state.stage,'failed');assert.equal(c.state.rewardPending,null);
});


test('exactly 3 or 4 distinct non-combat events; boss and guaranteed elites survive',()=>{
 const count={3:0,4:0};
 for(let seed=0;seed<500;seed++){
  const c=api.create(themes,rng(Math.imul(seed+1,2654435761)>>>0));c.start();
  const g=c.state,events=g.eventIds.filter(Boolean),groupNames=events.map(id=>api.EVENT_BY_ID[id].group);
  assert([3,4].includes(events.length));count[events.length]++;
  assert.equal(g.rooms.filter(x=>x==='event').length,events.length);
  assert.equal(g.rooms.filter(x=>x==='elite').length,2);
  assert.equal(g.rooms.at(0),'combat');assert.equal(g.rooms.at(-1),'boss');
  assert.equal(new Set(events).size,events.length);
  assert.equal(new Set(groupNames).size,events.length);
  assert.equal(g.eventIds.at(0),null);assert.equal(g.eventIds.at(-1),null);
 }
 assert(count[3]>0&&count[4]>0,'both event counts must be attainable');
});
test('new Expedition routes contain precisely 2 live Realms per family and never archive classic themes',()=>{
 const active=Object.keys(api.THEME_FAMILIES).filter(id=>!['frost','quarry'].includes(id));
 for(const family of api.FAMILIES)assert.equal(active.filter(id=>api.THEME_FAMILIES[id]===family).length,2,family);
 const c=api.create(themes,rng(70));c.start();c.chooseInitial('magic');
 assert(c.state.offers.every(p=>p.id!=='frost'&&p.id!=='quarry'));
});
test('event is one-time, cannot masquerade as combat, and save restores next reward safely',()=>{
 const c=api.create(themes,rng(5));c.start();c.chooseInitial('blood');
 for(let i=1;i<=15;i++){
  c.select(c.state.offers[0].id);c.enter();
  if(c.state.selected.eventId){
   const snapshot=JSON.parse(JSON.stringify(c.state)),replay=api.create(themes,rng(44));
   replay.restore(snapshot);
   assert.equal(replay.state.selected.eventId,c.state.selected.eventId);
   assert.throws(()=>replay.waveWon(),/No active combat/);
   replay.eventWon();assert.throws(()=>replay.eventWon(),/No active event/);
   assert(replay.state.rewardPending&&replay.state.stage==='choice');
   return;
  }
  clear(c);if(i<15)c.claimReward();
 }
 throw Error('At least three events must appear');
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
