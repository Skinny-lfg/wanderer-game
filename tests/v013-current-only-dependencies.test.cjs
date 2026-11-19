'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const legacyModules=['combat/automatic-talents.js','combat/automatic-talent-layout.js','tests/v013-legacy-fixture.cjs'];
test('fresh v0.13 has no retired Talent module or old route test fixture',()=>{
 for(const p of legacyModules)assert(!fs.existsSync(p),'Retired source unexpectedly present: '+p);
 for(const name of ['legacyTopology','legacyBasic','legacyFocused','legacyV14'])
  assert(!read('combat/talent-graph-next.js').includes(name),'Old graph option '+name);
 const graph=read('combat/talent-graph-runtime.js');
 assert(graph.includes('root.WandererTalentCatalog'));
 assert(graph.includes('WandererAutomaticTalents'));
});
test('only the deterministic Dungeon generator and checkpoint restoration are available',()=>{
 const controller=read('online/v012-expedition-controller.js');
 for(const name of ['makeRouteMobCounts','offerRealms','planAffinities','routeMobCounts','routeMap','routeEdges','routePositions'])
  assert(!controller.includes(name),'Retired generator leaked: '+name);
 assert(controller.includes('Only the deterministic Dungeon is supported'));
 assert(controller.includes('function startDungeon('));
 assert(controller.includes('function validateDungeonCheckpoint('));
 const ui=read('index.html');
 assert(ui.includes('dungeonMapMarkup('));
 assert(!ui.includes('expeditionRouteMap('));
 assert(!ui.includes('src="combat/automatic-talent-layout.js"'));
});
test('active integration and simulator source load v15 catalog without old automatic module',()=>{
 for(const path of ['index.html','tests/v012-economy-harness.cjs','scripts/simulate-progression.cjs','preview/talent-rebuild/index.html']){
  const s=read(path);
  assert(!s.includes('combat/automatic-talents.js'),'Legacy runtime reference in '+path);
  assert(s.includes('talent-catalog.js'),'Missing catalog in '+path);
 }
});
