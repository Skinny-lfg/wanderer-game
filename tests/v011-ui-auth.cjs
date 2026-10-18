const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const economics=fs.readFileSync('economy/v0101.js','utf8');
const handler=fs.readFileSync('online/auth-action.mjs','utf8');
const authPage=fs.readFileSync('auth-action.html','utf8');
const ctx=vm.createContext({});
vm.runInContext(economics,ctx);
const e=ctx.WandererEconomyV0101;
const base={Common:.478,Uncommon:.30,Rare:.1542,Epic:.0678,Legendary:0};
const odds=[0,1,2].map(x=>e.qualityOdds(base,x));
for(const n of odds)assert(Math.abs(Object.values(n).reduce((a,b)=>a+b,0)-1)<1e-8,'Forge odds total 100%');
assert(odds[2].Rare>odds[1].Rare&&odds[1].Rare>odds[0].Rare);
assert(odds[2].Epic>odds[1].Epic&&odds[1].Epic>odds[0].Epic);
assert(odds.every(x=>x.Legendary===0),'Forge cannot craft Legendary');
assert.equal(e.qualityOdds(base,true).Epic,odds[1].Epic,'High Quality legacy boolean still works');
for(const fragment of ['Wanderer v0.11.0</title>','function dungeonEquippedSetSummary()','dungeonEquippedSets',
 'forgeCraftLayout','forgeCraftOdds','Masterwork · 3× Fragments',
 "equipItem(o.id,target);view='forge';renderForge()",'forgeAffinityDelta',
 'forgeQualityToggle','data-forge-invest','.scene .eliteCombatant #enemyPortrait{width:min(185px,100%);height:170px'])
 assert(html.includes(fragment),'Missing v0.11 UI: '+fragment);
for(const fragment of ['mode','oobCode','verifyEmail','resetPassword','recoverEmail',
 'applyActionCode','verifyPasswordResetCode','confirmPasswordReset','assertProductionFirebaseConfig'])
 assert(handler.includes(fragment),'Missing custom email handler function: '+fragment);
assert(authPage.includes('online/auth-action.mjs?v=v0110-1'));
assert(!authPage.includes('firebase deploy'),'Action page should never deploy anything');
console.log('PASS v0.11 Forge investment, visual layout, Dungeon equipped sets and branded email handler smoke checks');
