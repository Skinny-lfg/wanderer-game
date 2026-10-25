'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'online/v012-combat-passive-clarity.css'),'utf8');
test('boss idle images match attack poses and exist as transparent PNGs',()=>{
 for(const boss of ['abyssal_guardian','rift_harbinger','ember_sovereign']){
  const src='assets/bosses/animated/'+boss+'_idle.png';
  assert(html.includes("image:'"+src+"'"),boss+' portrait points to mismatched asset');
  const file=path.join(root,src);
  assert(fs.existsSync(file),'missing '+src);
  assert.equal(fs.readFileSync(file).toString('hex',0,8),'89504e470d0a1a0a','invalid PNG');
 }
});
test('Voidborne Hexer reversed and floating damage remains readable',()=>{
 assert.match(css,/\[data-elite-type="caster"\]/);assert.match(css,/scaleX\(1\)/);
 assert.match(html,/className='float'\+\(damage\?' floatDamage'/);
 assert.match(css,/#scene > \.floatDamage/);
 assert.match(css,/font-size:15px!important/);
 assert.match(css,/\[data-elite-type="vampire"\]/);
 assert.doesNotMatch(css,/sanguine_leech/);
 assert.match(css,/brightness\(\.60\)/);
 assert.match(html,/function phase3PassiveDescriptionHtml\(value\)/);
 assert.match(html,/const safe=esc\(/);
 assert.match(html,/phase3PassiveDescriptionHtml\(description\)/);
});
