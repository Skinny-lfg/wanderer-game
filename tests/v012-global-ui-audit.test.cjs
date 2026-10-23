'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'online/v012-core.css'),'utf8'),ui=fs.readFileSync(path.join(root,'online/v012-ui4.css'),'utf8');
test('global UI CSS is externalized once and shared tokens have a single source',()=>{
 assert.match(html,/href="online\/v012-core\.css"/);assert.doesNotMatch(html,/<style\b/i);assert.equal((css.match(/:root\s*\{/g)||[]).length,1);
 assert.doesNotMatch(css,/url\((?:['"]?)assets\//);assert.match(css,/--space-4:16px/);assert.match(css,/--wine-edge:#674853/);
});
test('Initial affinity selection is an image-free modal with responsive affinity cards',()=>{
 assert.match(html,/function phase3OpenInitialAffinity\(g\)/);assert.match(html,/phase3AffinityPending/);const initialStart=html.indexOf('function phase3OpenInitialAffinity(g)');const initialEnd=html.indexOf('function phase3CombatBuildMarkup()',initialStart);assert.doesNotMatch(html.slice(initialStart,initialEnd),/phase3ShrineArtPlaceholder/);
 assert.match(ui,/dialog\.phase3InitialAffinityDialog/);assert.match(ui,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);assert.match(ui,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
