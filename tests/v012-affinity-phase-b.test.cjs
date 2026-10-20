const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');const {api,build,base}=require('./v012-affinity-fixture.cjs');
const seeded=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
test('B 1200 seeded drafts: useful distinct cards, categories, caps, elements and hybrid limits',()=>{
 for(let seed=1;seed<=1200;seed++){
  const families=[['blood','decay','magic'],['vitality','aegis','fury'],['magic','fury','blood']][seed%3],b=build([],families,['fire','frost','lightning'][seed%3]);b.unlockedFamilies=[];for(const f of families)api.initial(b,f);b.runtime.draftStats=base;const rng=seeded(seed);
  for(let realm=1;realm<15;realm++){
   b.realmIndex=realm;const family=families[realm%3],cards=api.options(b,family,rng);assert.equal(cards.length,3);assert.equal(new Set(cards.map(p=>p.id)).size,3);assert(cards.filter(p=>p.requires.length).length<=1);
   for(const p of cards){assert(api.eligible(b,p.family).some(q=>q.id===p.id));assert(['Upgrade','Synergy','Discovery'].includes(p.category));assert(p.preview.useful);if(p.element)assert.equal(p.element,b.element);}
   api.choose(b,family,cards[Math.floor(rng()*3)].id,cards);api.validate(b);
  }
 }
});
test('B late second affinity: third eligible draft presents pity hybrid, counters serialize',()=>{
 const b=build(['bleeding_edge'],['blood','decay']);b.unlockedFamilies=['blood'];b.realmIndex=12;api.initial(b,'decay');
 for(let realm=12;realm<=14;realm++){b.realmIndex=realm;const cards=api.options(b,'decay',()=>.99);if(realm<14)assert(!cards.some(p=>p.requires.length));else assert(cards.some(p=>p.requires.length));api.validate(JSON.parse(JSON.stringify(b)));}
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
 const full=build([],['blood']);full.picks=api.CATALOG.filter(p=>p.family==='blood'&&!p.requires.length).flatMap(p=>Array(p.max).fill(p.id));const raw=JSON.stringify(full);assert.throws(()=>api.options(full,'blood'),/checkpoint retained/);assert.equal(JSON.stringify(full),raw);
});
