'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v013-map-fog.js');const fog=globalThis.WandererV013MapFog;
const points=[[10,50],[30,25],[70,70],[90,50]],render=(key,revealed)=>fog.render({key,points,revealed,family:'blood'});
test('fog renders transparent holes using exactly the supplied visible map coordinates',()=>{
 fog.reset();const html=render('run-a',[1,0,1]);assert.match(html,/data-fog-revealed="2"/);assert.match(html,/cx="10" cy="50"/);assert.match(html,/cx="30" cy="25"/);assert.doesNotMatch(html,/cx="70" cy="70"/);assert.doesNotMatch(html,/realmFogPrevious/);
});
test('revealing additional locations fades from the previous mask; repeated renders do not duplicate it',()=>{
 fog.reset();render('run-a',[0]);const transition=render('run-a',[0,1,2]);assert.match(transition,/realmFogPrevious/);assert.match(transition,/data-fog-revealed="3"/);assert.match(transition,/data-fog-revealed="1"/);
 assert.match(render('run-a',[0,1,2]),/realmFogPrevious/,'a rerender must not cut an ongoing reveal');
});
test('a new expedition or Realm resets the reveal transition instead of inheriting explored areas',()=>{
 fog.reset();render('run-a',[0,1,2,3]);const fresh=render('run-b',[0]);assert.doesNotMatch(fresh,/realmFogPrevious/);assert.match(fresh,/data-fog-revealed="1"/);assert.doesNotMatch(fresh,/cx="90" cy="50"/);
});
test('fog uses both supplied PNG textures, honors reduced motion, and never captures pointer events',()=>{
 const css=fs.readFileSync('online/v013-stage45-map-qa.css','utf8'),html=render('run-c',[0]);for(const name of ['dense','dispersed']){assert(html.includes('fog-'+name+'-blood.webp'));assert(!html.includes('feColorMatrix'));for(const family of ['blood','decay','vitality','aegis','fury','magic']){const optimized=fs.readFileSync('assets/expedition-map/fog-'+name+'-'+family+'.webp');assert(optimized.equals(fs.readFileSync('docs/assets/expedition-map/fog-'+name+'-'+family+'.webp')));assert(optimized.length<300000);}const original=fs.readFileSync('assets/expedition-map/fog-'+name+'.png'),pages=fs.readFileSync('docs/assets/expedition-map/fog-'+name+'.png');assert(original.equals(pages));assert.equal(original[25],6,'source PNG retains RGBA');}
 assert.match(css,/\.realmFog\{[^}]*pointer-events:none/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.realmFogDense,\.realmFogDispersed\{animation:none\}/);
});
test('successive reveals keep earlier holes and the cache resets even for a repeated Expedition key',()=>{
 const clock=Date.now;let time=100000;Date.now=()=>time;
 try{fog.reset();render('same-level-and-seed',[0]);time+=100;render('same-level-and-seed',[0,1]);time+=1100;const second=render('same-level-and-seed',[0,1,2]);assert.match(second,/data-fog-revealed="3"/);assert.match(second,/realmFogPrevious/);assert.match(second,/data-fog-revealed="2"/);time+=1100;assert.doesNotMatch(render('same-level-and-seed',[0,1,2]),/realmFogPrevious/);
  fog.reset();const fresh=render('same-level-and-seed',[0]);assert.match(fresh,/data-fog-revealed="1"/);assert.doesNotMatch(fresh,/realmFogPrevious/);
 }finally{Date.now=clock;fog.reset();}
});
test('rapid consecutive reveals keep both earlier fades at their original progress',()=>{
 const clock=Date.now;let time=50000;Date.now=()=>time;
 try{fog.reset();render('rapid',[0]);time+=100;render('rapid',[0,1]);time+=500;const html=render('rapid',[0,1,2]);
  assert.equal((html.match(/class="realmFog realmFogPrevious"/g)||[]).length,2);
  assert.match(html,/animation-delay:-0ms/);assert.match(html,/animation-delay:-500ms/);
  assert.match(html,/data-fog-revealed="1"/);assert.match(html,/data-fog-revealed="2"/);assert.match(html,/data-fog-revealed="3"/);
 }finally{Date.now=clock;fog.reset();}
});
