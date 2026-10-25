'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),style=read('online/v012-uiux-tuning.css'),corners=read('online/v012-gothic-panels.css');
test('elite first-frame idle PNGs match new GIFs, not old portraits',()=>{
 for(const type of ['tank','caster','vampire','berserker']){
  const dir='assets/elites/animated/',idle=fs.readFileSync(path.join(root,dir+type+'_idle.png'));
  assert.equal(idle.subarray(0,8).toString('hex'),'89504e470d0a1a0a',type+' PNG signature');
  assert.equal(idle.readUInt32BE(16),768,'no exported image wider than 768');
  assert(fs.statSync(path.join(root,dir+type+'_attack.gif')).size>1000);
  assert(html.includes(type+":'"+dir+type+"_idle.png'"));
 }
 assert.match(html,/data-idle-src="\$\{e\.miniboss\?\(ELITE_ART\[e\.eliteType\]/);
 assert.match(style,/eliteCombatant #enemyPortrait\[data-elite-type\]/);
 assert.match(style,/transform:scaleX\(-1\)!important/);
});
test('equip popup is standard except for rings',()=>{
 assert(html.includes("if(!['ring1','ring2'].includes(item.slot))dialog.classList.add('equipmentStandardDialog')"));
 assert.match(style,/equipmentItemDialog\.equipmentStandardDialog\[open\]/);
});
test('rune visible amount uses display rounding not changed gameplay formulas',()=>{
 assert(html.includes('formatItemStat(runeValue(r.family,r.tier))'));
});
test('popup corners use dialog-relative positioning through zoom',()=>{
 assert.match(corners,/\.gothic-corner-layer--viewport \{[\s\S]*?position: absolute;[\s\S]*?inset: 0;/);
});
