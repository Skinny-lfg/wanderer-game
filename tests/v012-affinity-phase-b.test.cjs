const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');const {api,build,base}=require('./v012-affinity-fixture.cjs');
const seeded=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
test('B 1200 seeded drafts: useful distinct cards, categories, caps, elements and hybrid limits',()=>{
 for(let seed=1;seed<=1200;seed++){
  const families=[['blood','decay','magic'],['vitality','aegis','fury'],['magic','fury','blood']][seed%3],b=build([],families,['fire','frost','lightning'][seed%3]);b.unlockedFamilies=[];for(const f of families)api.initial(b,f);b.runtime.draftStats=base;const rng=seeded(seed);
  for(let realm=1;realm<15;realm++){
   b.realmIndex=realm;const family=families[realm%3],cards=api.options(b,family,rng);assert(cards.length>0&&cards.length<=3);assert.equal(new Set(cards.map(p=>p.id)).size,cards.length);assert(cards.every(p=>p.family===family),'all Realm rewards are affinity-local');assert(cards.filter(p=>p.requires.length).length<=1);
   for(const p of cards){assert(api.eligible(b,p.family).some(q=>q.id===p.id));assert(['Upgrade','Synergy','Discovery'].includes(p.category));assert(p.preview.useful);if(p.element)assert.equal(p.element,b.element);}
   api.choose(b,family,cards[Math.floor(rng()*cards.length)].id,cards);api.validate(b);
  }
 }
});
test('B late second affinity: third eligible draft presents affinity-local pity hybrid, counters serialize',()=>{
 const b=build(['bleeding_edge'],['blood','decay']);b.unlockedFamilies=['blood'];b.realmIndex=12;api.initial(b,'decay');
 for(let realm=12;realm<=14;realm++){b.realmIndex=realm;const cards=api.options(b,'blood',()=>.99);assert(cards.every(p=>p.family==='blood'));if(realm<14)assert(!cards.some(p=>p.requires.length));else assert(cards.some(p=>p.requires.length));api.validate(JSON.parse(JSON.stringify(b)));}
 assert.equal(b.runtime.hybridPity['blood:decay'],0);
});
test('B new draft is stable after restore; first win gives starter plus one choice exactly once',()=>{
 const a=create(33);a.start(1);a.initial('blood');assert.equal(a.build().picks.length,0);a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();
 while(a.state().run?.status==='fight'){a.state().run.enemy.hp=0;a.win();a.flush();}
 assert.equal(a.build().picks.length,1);assert.equal(a.build().picks[0],'bleeding_edge');const before=JSON.stringify(a.draft()),cp=a.checkpoint.capture();a.checkpoint.restore(cp);assert.equal(JSON.stringify(a.draft()),before);
 const id=a.draft().options[0].id;assert(a.passive(id));assert.equal(a.passive(id),false);assert.equal(a.build().picks.length,2);
});
test('B triggers and caps, equipment block, one hybrid per pair, controlled exhausted pool',()=>{
 const b=build(['bleeding_edge','toxic_touch'],['blood','decay']);b.realmIndex=4;assert(!api.eligible(b,'blood').some(p=>p.requires.length));b.realmIndex=5;assert(api.eligible(b,'blood').some(p=>p.id==='carrion_detonation'));b.picks.push('carrion_detonation');assert(!api.eligible(b,'blood').some(p=>p.id==='plague_rupture'));
 const a=build(['iron_skin','quick_hands'],['aegis','fury']);assert(!api.eligible(a,'aegis').some(p=>p.id==='counterstrike'));a.runtime.draftStats={...base,blockChance:20};assert(api.eligible(a,'aegis').some(p=>p.id==='counterstrike'));
 const full=build([],['blood']);full.picks=api.CATALOG.filter(p=>p.family==='blood'&&!p.requires.length).flatMap(p=>Array(p.max).fill(p.id));const raw=JSON.stringify(full);assert.deepEqual(Array.from(api.options(full,'blood')),[]);assert.equal(JSON.stringify(full),raw);
 const unlock=(ids)=>{const b=build([...full.picks],['blood']);for(const id of ids){const index=b.picks.lastIndexOf(id);assert(index>=0);b.picks.splice(index,1);}b.runtime.draftStats=base;return b;};
 const one=unlock(['bleeding_edge']),two=unlock(['bleeding_edge','deep_cuts']);
 for(const [b,count] of [[one,1],[two,2]]){const cards=api.options(b,'blood',seeded(31337));assert.equal(cards.length,count);assert.equal(new Set(cards.map(p=>p.id)).size,count);assert(cards.every(p=>api.eligible(b,p.family).some(q=>q.id===p.id)));const selected=cards[0];api.choose(b,'blood',selected.id,cards);assert(b.picks.includes(selected.id));}
});
test('B legacy overcap draft migrates deterministically without removing picks; modern draft remains byte-identical',()=>{
 const a=create(42);a.start();a.initial('blood');a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();while(a.state().run?.status==='fight'){a.state().run.enemy.hp=0;a.win();a.flush();}
 const cp=a.checkpoint.capture();cp.session.build.version=2;cp.session.build.picks=Array(8).fill('bleeding_edge');delete cp.session.draft.version;cp.session.draft.options=['bleeding_edge','deep_cuts','executioner'].map(id=>api.CATALOG.find(p=>p.id===id));
 a.checkpoint.restore(cp);const cards=JSON.stringify(a.draft()),seed=a.checkpoint.seed();assert.equal(a.build().picks.length,8);assert.equal(api.rank(a.build(),'bleeding_edge'),5);assert(!a.draft().options.some(p=>p.id==='bleeding_edge'));assert.equal(a.draft().version,3);
 a.checkpoint.restore(cp);assert.equal(JSON.stringify(a.draft()),cards);assert.equal(a.checkpoint.seed(),seed);
 const modern=a.checkpoint.capture();a.checkpoint.restore(modern);assert.equal(JSON.stringify(a.draft()),cards);
 const old=build(['plague_rupture','carrion_detonation'],['blood','decay']);old.version=2;api.validate(old);assert.equal(api.rank(old,'plague_rupture'),1);assert.equal(api.rank(old,'carrion_detonation'),0);assert.equal(old.picks.length,2);
});

test('B restored reward with 0, 1 or 2 legal offers continues without duplicate picks',()=>{
 for(const count of [0,1,2]){
  const a=create(4200+count);a.start(1);a.initial('blood');
  a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();
  while(a.state().run?.status==='fight'){a.state().run.enemy.hp=0;a.win();a.flush();}
  const cp=a.checkpoint.capture(),before=cp.session.build.picks.length;
  cp.session.draft.options=cp.session.draft.options.slice(0,count);
  a.checkpoint.restore(cp);assert.equal(a.draft().options.length,count);
  const stable=JSON.stringify(a.draft()),seed=a.checkpoint.seed();
  a.checkpoint.restore(cp);assert.equal(JSON.stringify(a.draft()),stable);assert.equal(a.checkpoint.seed(),seed);
  assert.equal(a.passive(count?a.draft().options[0].id:null),true);assert.equal(a.draft(),null);
  assert.equal(a.build().picks.length,before+(count?1:0));
  assert.equal(a.controller().state.rewardPending,null);
  assert.equal(a.passive(null),false);
 }
});

test('old reward checkpoint drops foreign-affinity offers without changing saved build',()=>{
 const a=create(5800);a.start(1);a.initial('blood');a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();
 while(a.state().run?.status==='fight'){a.state().run.enemy.hp=0;a.win();a.flush();}
 const cp=a.checkpoint.capture(),picks=JSON.stringify(cp.session.build.picks);
 const foreign=api.CATALOG.find(p=>p.family==='decay'&&!p.requires.length);assert(foreign);
 cp.session.draft.options[0]={...foreign,category:'Discovery'};
 a.checkpoint.restore(cp);
 assert(a.draft().options.every(p=>p.family===a.draft().plane.family));
 assert.equal(JSON.stringify(a.build().picks),picks,'saved passives remain untouched');
 assert.equal(a.draft().options.length,cp.session.draft.options.length-1,'only obsolete foreign offer is removed');
});
