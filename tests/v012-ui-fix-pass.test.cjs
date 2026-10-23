'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ui=fs.readFileSync(path.join(root,'online/v012-ui4.css'),'utf8'),frames=fs.readFileSync(path.join(root,'online/v012-ui4f.css'),'utf8');
test('dialogs retain dark Home Stats surface and item art stays square',()=>{
 assert.match(ui,/phase3IntegratedPreview dialog\{background:var\(--ui4-home-stats-bg\)/);
 assert.match(ui,/\.potionOffer>img[^}]*aspect-ratio:1\/1[^}]*object-fit:contain/);
 assert.match(frames,/rarityImageFrame--merchant[^}]*height:auto;aspect-ratio:1\/1/);
 assert.match(frames,/rarityImageFrame--inspect[^}]*height:auto;aspect-ratio:1\/1/);
});
test('primary buttons use neutral dark fills and crimson pressed feedback',()=>{
 assert.match(ui,/button\.primary:not\(\.phase3Start\)[^{]*\{[^}]*background:linear-gradient\(145deg,#393436,#262326/);
 assert.match(ui,/button:not\(\.phase3Start\)[^{]*:active:not\(:disabled\)\{[^}]*#512a31/);
});
test('chamfer outline is a separate layer and leaves host shadow unclipped',()=>{
 assert.match(frames,/border-color:transparent;[\s\S]*?clip-path:none/);
 assert.match(frames,/::after\{[\s\S]*?clip-path:polygon[\s\S]*?mask-composite:exclude/);
 assert.match(ui,/phase3IntegratedPreview dialog\{[^}]*background:var\(--ui4-home-stats-bg\)/);
});
test('Camp Health track keeps a fitted frame and crimson fill',()=>{
 assert.match(ui,/phase3CampCharacter \.phase3ResourceTrack\{[^}]*box-sizing:border-box[^}]*height:24px/);
 assert.match(ui,/phase3CampCharacter \.phase3Resource\.health \.phase3ResourceTrack>i\{[^}]*#b95458/);
});
