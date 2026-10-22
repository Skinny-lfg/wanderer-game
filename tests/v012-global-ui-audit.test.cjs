'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'online/v012-core.css'),'utf8'),ux=fs.readFileSync(path.join(root,'online/ux39.css'),'utf8');
test('global UI CSS is externalized once and shared tokens have a single source',()=>{
 assert.match(html,/href="online\/v012-core\.css"/);assert.doesNotMatch(html,/<style\b/i);assert.equal((css.match(/:root\s*\{/g)||[]).length,1);
 assert.doesNotMatch(css,/url\((?:['"]?)assets\//);assert.match(css,/--space-4:16px/);assert.match(css,/--wine-edge:#674853/);
});
test('Shrine art placeholder uses the shipped image and keeps responsive styles scoped to v0.12',()=>{
 assert.match(html,/class="phase3ShrineArtPlaceholder"/);assert.match(html,/src="assets\/dungeons\/backgrounds\/shrine\.webp"/);
 assert.match(ux,/\.phase3IntegratedPreview \.phase3ShrineLayout/);assert.match(ux,/\.phase3ShrineArtPlaceholder img/);
});
