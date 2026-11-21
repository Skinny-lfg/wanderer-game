'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
const PLANNER=require('../scripts/v013-build-planner.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const newAccount=(seed=9101)=>create(seed,undefined,{}, {skipPersistence:true,now:1720000000000+seed});
const earned=(a,points)=>a.talents.award(a.state().automaticTalents,points*100);
const p=(id)=>N.PROFILES['smart-'+id];
test('The first acquired build skill is functional, not a cosmetic stat detour',()=>{
 const a=newAccount(),T=a.talents;
 for(const [family,skill] of Object.entries(PLANNER.OPENING_SKILLS)){
  const id={blood:'blood-pure',fury:'fury-pure',magic:'magic-arcane-pure',
   vitality:'vitality-pure',aegis:'aegis-vitality',decay:'decay-magic-aegis'}[family];
  const x=PLANNER.propose(T,earned(a,5),id);
  assert(x.expectedNodes.includes('affinity_'+family),family+JSON.stringify(x));
  assert(x.expectedNodes.includes(skill),family+JSON.stringify(x));
  assert(T.valid({...earned(a,5),nodes:x.expectedNodes,...(x.expectedElement!=='arcane'?{element:x.expectedElement}:{})}));
 }
});

test('Twelve explicit agent strategies represent pure, duo, mixed and adaptive third-affinity investments',()=>{
 assert.equal(Object.keys(PLANNER.BUILDS).length,12);
 for(const [id,b] of Object.entries(PLANNER.BUILDS)){
  assert(p(id),'missing agent '+id);assert.equal(p(id).plan,id);
  assert(PLANNER.getPlan(id).milestones.length>0);
  assert(['pure','two','three','adaptive'].includes(b.model));
 }
 assert.throws(()=>PLANNER.getPlan('random'),/Unknown strategic agent/);
});
test('Real v15 descriptions and talent prerequisites are read by the agent, not synthetic talent definitions',()=>{
 const a=newAccount(),T=a.talents;
 assert(T.NODES.some(x=>x.id==='root_blood'));
 assert(T.NODES.some(x=>x.id==='blood_harvest'&&x.description));
 assert(T.NODES.some(x=>x.id==='crimson_rush'&&x.kind==='mixed'));
 assert(T.NODES.some(x=>x.id==='arcane_bastion'&&x.advanced));
 const blood=PLANNER.getPlan('blood-pure');
 const route=PLANNER.routeTo(T,earned(a,30),'blood_harvest',blood,['blood']);
 assert(route?.includes('affinity_blood'),JSON.stringify(route));
 assert(route?.includes('blood_harvest'),JSON.stringify(route));
 const mixed=PLANNER.routeTo(T,earned(a,60),'crimson_rush',PLANNER.getPlan('blood-fury'),['blood','fury']);
 assert(mixed&&mixed.includes('crimson_rush')&&mixed.includes('affinity_blood')&&mixed.includes('affinity_fury'),JSON.stringify(mixed));
});
test('A pure focused build never spends talent points on foreign Affinities',()=>{
 const a=newAccount(),T=a.talents,before=earned(a,30);
 const plan=PLANNER.propose(T,before,'blood-pure');
 assert.equal(plan.allowed.length,1);assert.deepEqual(plan.allowed,['blood']);
 assert(plan.expectedNodes.includes('affinity_blood'));
 assert(plan.expectedNodes.every(id=>!['affinity_fury','affinity_aegis','affinity_vitality','affinity_magic','affinity_decay'].includes(id)));
 assert.equal(plan.earned,30);assert.equal(plan.spent,30);
 assert.equal(before.nodes.length,0);assert.equal(T.valid({...before,nodes:plan.expectedNodes}),true);
});
test('A second Affinity unlocks only at the real earned-point threshold, not on arbitrary luck',()=>{
 const a=newAccount(),T=a.talents;
 const early=PLANNER.propose(T,earned(a,11),'blood-fury');
 const later=PLANNER.propose(T,earned(a,12),'blood-fury');
 assert.deepEqual(early.allowed,['blood']);
 assert.deepEqual(later.allowed,['blood','fury']);
 assert(!early.expectedNodes.includes('affinity_fury'));
 assert(later.expectedNodes.includes('affinity_fury'),JSON.stringify(later));
});
test('Third Affinity is conditional on actual recorded combat pressure, not auto-added to every build',()=>{
 const a=newAccount(),T=a.talents,level=earned(a,33);
 const calm=PLANNER.propose(T,level,'blood-fury-vitality',[]);
 assert.deepEqual(calm.allowed,['blood','fury']);
 const history=[{status:'defeat',rooms:[{hpMax:100,hpStart:100,hpEnd:0,minHpPct:0,damageTaken:100,died:true}]}];
 const injured=PLANNER.propose(T,level,'blood-fury-vitality',history);
 assert.deepEqual(injured.allowed,['blood','fury','vitality']);
 assert(injured.expectedNodes.includes('affinity_vitality'),JSON.stringify(injured));
 const strict=PLANNER.propose(T,level,'blood-fury',history);
 assert.deepEqual(strict.allowed,['blood','fury']);
});
test('Magic agent chooses an actual available elemental mode through the real v15 API',()=>{
 const a=newAccount(),T=a.talents;let x=earned(a,22);
 const offer=PLANNER.propose(T,x,'magic-fire-aegis');
 assert(offer.expectedNodes.includes('affinity_magic'));
 assert(offer.expectedNodes.includes('element_choice'));
 assert.equal(offer.expectedElement,'fire');
 x={...x,nodes:offer.expectedNodes,element:'fire'};
 assert(T.valid(x));
 const arcane=PLANNER.propose(T,earned(a,22),'magic-arcane-pure');
 assert.equal(arcane.expectedElement,'arcane');
});
test('Native Camp actually executes one planned build and preserves XP',()=>{
 const a=newAccount(9111),T=a.talents,s=a.state();
 s.automaticTalents=earned(a,14);
 const xp=s.automaticTalents.xp;
 const actions=N.prepareCamp(a,p('blood-fury'),1,'adaptive',{history:[],priorResets:0});
 assert.equal(s.automaticTalents.xp,xp);
 assert(T.valid(s.automaticTalents));
 assert(actions.plan);assert.equal(actions.plan.id,'blood-fury');
 assert(actions.plan.allowed.includes('fury'));
 assert(actions.plan.spent<=T.earned(s.automaticTalents));
 assert(s.automaticTalents.nodes.includes('affinity_blood'));
 assert(s.automaticTalents.nodes.includes('affinity_fury'));
});
test('Gearing prefers proper weapons and pre-Boss potions, without creating either',()=>{
 const magic=p('magic-fire-aegis'),blood=p('blood-pure');
 const sword={slot:'weapon',subtype:'Sword',atk:9,rarity:'Uncommon',tier:2};
 const wand={...sword,subtype:'Wand'};
 assert(N.gearScore(wand,magic)>N.gearScore(sword,magic));
 const shield={slot:'offhand',subtype:'Shield',def:6};
 assert(N.gearScore(shield,p('aegis-vitality'))>N.gearScore(shield,p('magic-arcane-pure')));
 assert(N.potionScore('arcane',magic)>N.potionScore('arcane',blood));
 assert(N.potionScore('might',blood)>N.potionScore('might',magic));
 const consumables=require('../online/v012-consumables.js');
 assert(fs.readFileSync('online/v012-consumables.js','utf8').includes("'barrier'"));
 void consumables;
});
test('One full genuine E1 attempt from a new agent never invents XP or skips a Boss',()=>{
 const cfg=N.parseArgs(['--seeds=9901','--profiles=smart-blood-pure','--max-level=1','--max-attempts=1']);
 const run=N.run(cfg),account=run.accounts[0],attempt=account.attempts[0];
 assert.equal(run.coverage.errors,0,JSON.stringify(attempt.error));
 assert.equal(account.startXp,0);assert(attempt.before);
 assert.equal(attempt.before.earned,0);
 assert.equal(attempt.before.gear.starter,attempt.before.gear.total);
 assert(['defeat','extracted','victory'].includes(attempt.status),attempt.status);
});
test('New native runner and isolated planner cannot fabricate loot, XP or combat outcomes',()=>{
 for(const file of ['scripts/v013-build-planner.cjs','scripts/v013-natural-progression.cjs']){
  const s=fs.readFileSync(file,'utf8');
  for(const token of ['a.setup(','.setUnlocked(','.encounter(','.makeItem(','.award(','.hp=0'])
   assert(!s.includes(token),file+' '+token);
 }
});
