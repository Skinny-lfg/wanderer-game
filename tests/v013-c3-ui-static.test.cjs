'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('online/v012-uiux-tuning.css','utf8');
const app=fs.readFileSync('index.html','utf8');
const preview=fs.readFileSync('preview/talent-rebuild/index.html','utf8');
test('C3: obsolete parent inline tree renderer and its CSS are gone',()=>{
 for(const selector of ['.talentGraphCanvas','.talentGraphViewport','.talentGraphInspector','.talentPreparation','.automaticAttributes','.talentPath','.treeGraphNode']){
  assert(!css.includes(selector),selector+' must not survive in root CSS');
  assert(!app.includes(selector.slice(1)),'retired UI must not render '+selector);
 }
 assert.match(app,/iframe title="Talent tree"/);
 assert.match(preview,/id="svg"/);
});
test('C3: current talent XP, stat colors, map and Forge CSS remain',()=>{
 for(const selector of ['.automaticTalentTree{margin-top:18px}','.automaticXpTrack','.stat-bonus','.stat-penalty','.v013Forge','.realmDialogImage']){
  assert(css.includes(selector),'Expected current CSS '+selector);
 }
 for(const obsolete of ['.routeBranchCanvas','.routeMapViewport','.expeditionRouteMap','.routeLegend','.routeBranchNode'])assert(!css.includes(obsolete),'obsolete route CSS must stay deleted: '+obsolete);
 for(const selector of ['phase3RenderCityCenter','renderV013Forge','renderStash','WandererTreeAPI','data-dungeon-room']){
  assert(app.includes(selector),'Expected active UI '+selector);
 }
});
