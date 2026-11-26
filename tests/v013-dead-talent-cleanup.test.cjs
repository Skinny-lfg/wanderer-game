'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const create=require('./v012-economy-harness.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

for(const base of ['', 'docs/']){
 test(base+'active talent UI contains no unreachable manual primary-stat controls',()=>{
  const html=read(base+'index.html');
  const start=html.indexOf('function renderAutomaticTalents(){');
  const end=html.indexOf('function renderRebuiltTalents(){',start);
  assert(start>=0&&end>start,'the native rebuilt talent adapter is still mounted');
  const adapter=html.slice(start,end);
  assert.match(adapter,/return renderRebuiltTalents\(\);/);
  assert(!html.includes('function automaticTalentTree(){'),'retired talent UI must be absent');
  assert(!html.includes('function skillRank(node,progress){'),'old-only helper must be absent');
  assert(!html.includes('data-auto-attribute'),'manual attribute controls must be absent');
  assert(!html.includes('automaticTalentReset'),'legacy reset controls must be absent');
  assert(!html.includes('system.attributePoints('),'legacy attribute points UI must be absent');
  assert(!html.includes('system.allocateAttribute('),'legacy attribute action must be absent');
  assert.match(html,/WandererTreeAPI=\{/,'real v15 tree API must remain');
  assert.match(html,/reset:\(\)=>\{/,'real v15 reset must remain');
 });
 test(base+'v15 exposes talent nodes and reset, not unused manual attribute allocation',()=>{
  const source=read(base+'combat/talent-graph-runtime.js');
  assert.match(source,/function attributeBonuses\(/,'bonuses from actual talent nodes retained');
  assert.match(source,/function reset\(/);
  assert(!source.includes('function migrate('),'clean-sheet v15 must not migrate old trees');
  assert(!source.includes('function allocateAttribute('));
  assert(!source.includes('function attributePoints('));
  assert(!source.includes('bonuses,attributePoints'));
 });
}

test('integrated native talent graph still works after cleanup',()=>{
 const a=create(8801,undefined,{}, {skipPersistence:true,now:1720000008801});
 const T=a.talents;
 assert.equal(T.create().treeVersion,15);
 assert.equal(typeof T.allocateAttribute,'undefined');
 assert.equal(typeof T.attributePoints,'undefined');
 assert.equal(typeof T.attributeBonuses,'function');
 let p={...T.create(),xp:100};
 p=T.allocate(p,'root_blood');
 assert(p);
 const next=T.reset(p);
 assert.equal(next.nodes.length,0);
 assert.equal(next.xp,p.xp);
 assert.equal(T.valid(next),true);
});

test('clean sheet rejects obsolete talent saves, keeps fresh v15 accounts',()=>{
 const a=create(8802,undefined,{}, {skipPersistence:true,now:1720000008802});
 const T=a.talents;
 assert.equal(typeof T.migrate,'undefined');
 assert.equal(T.valid({treeVersion:10,xp:1200,nodes:['root_arcane'],attributes:{int:2}}),false);
 assert.equal(T.valid(T.create()),true);
 assert.equal(T.valid({...T.create(),starterPoints:2}),false);
});

test('current character stats ignore retired manually allocated attribute fields',()=>{
 const a=create(8810,undefined,{}, {skipPersistence:true,now:1720000008810});
 const base=a.baseStats();
 a.state().automaticTalents.attributes={str:40,agi:40,int:40,end:40,cha:40};
 const after=a.baseStats();
 for(const stat of ['str','agi','int','end','cha','attack','defense','maxhp'])
  assert.equal(after[stat],base[stat],stat+' must only depend on gear and live talent nodes');
 for(const p of ['combat/v012-gear-stats.js','docs/combat/v012-gear-stats.js'])
  assert(!read(p).includes('automaticTalents?.attributes'),'legacy attribute projection present in '+p);
});
