'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),runtime=fs.readFileSync(path.join(root,'combat/v012-combat-runtime.js'),'utf8');
function readGif(file){
 const data=fs.readFileSync(path.join(root,file));
 assert.equal(data.toString('ascii',0,3),'GIF',file);
 const width=data.readUInt16LE(6),height=data.readUInt16LE(8);
 let pos=13,transparency=false,frames=0,offsets=[],timings=[];
 if(data[10]&128)pos+=3*(1<<((data[10]&7)+1));
 function blocks(){while(true){const n=data[pos++];if(n===0)return;pos+=n;assert(pos<=data.length,'invalid GIF blocks');}}
 while(pos<data.length){
  const t=data[pos++];
  if(t===0x3b)break;
  if(t===0x21){
   const label=data[pos++];
   if(label===0xf9){
    assert.equal(data[pos++],4);
    transparency||=!!(data[pos]&1);
    offsets.push(pos+1);
    timings.push(data.readUInt16LE(pos+1)*10);
    pos+=4;assert.equal(data[pos++],0);
   }else blocks();
  }else if(t===0x2c){
   frames++;
   const flags=data[pos+8];pos+=9;
   if(flags&128)pos+=3*(1<<((flags&7)+1));
   pos++;blocks();
  }else throw Error('Unexpected GIF block '+t+' at '+pos);
 }
 assert.equal(frames,timings.length);
 return {data,width,height,frames,transparency,timings,offsets,total:timings.reduce((a,b)=>a+b,0)};
}
const bosses=[
 {style:'guardian',key:'abyssal_guardian',frames:4,impact:850,expected:[330,520,300,450]},
 {style:'leech',key:'rift_harbinger',frames:4,impact:860,expected:[360,500,250,490]},
 {style:'berserker',key:'ember_sovereign',frames:8,impact:710,expected:[180,220,180,130,200,180,240,270]}
];
for(const boss of bosses)test('Boss '+boss.style+' attack is transparent, 768px and frame-synced at x1/x2/x4',()=>{
 const pngs=[1,2,4].map(speed=>readGif('assets/bosses/animated/'+boss.key+'_attack_x'+speed+'.gif'));
 for(let i=0;i<pngs.length;i++){
  const speed=[1,2,4][i],gif=pngs[i];
  assert.equal(gif.width,768);assert.equal(gif.height,768);
  assert.equal(gif.frames,boss.frames);assert.equal(gif.transparency,true);
  assert.equal(gif.total,1600/speed,'combat duration must scale with speed');
  assert(gif.timings.every(t=>t>=20),'no sub-20ms frames');
  assert(Math.abs(gif.timings.slice(0,boss.frames===8?4:2).reduce((a,b)=>a+b,0)-boss.impact/speed)<=35,'contact frame should match hit tick');
  if(i===0)assert.deepEqual(gif.timings,boss.expected);
  const baseline=Buffer.from(pngs[0].data),candidate=Buffer.from(gif.data);
  for(const off of pngs[0].offsets){baseline[off]=0;baseline[off+1]=0;}
  for(const off of gif.offsets){candidate[off]=0;candidate[off+1]=0;}
  assert(baseline.equals(candidate),'speed variant must not alter artwork pixels');
 }
 assert(html.includes(boss.key+'_attack_x1.gif'),'missing boss animation map');
 assert(html.includes(boss.style+':'+boss.impact),'missing impact timing map');
});
test('Boss windups and effects use the chosen GIF playback speed without modifying damage',()=>{
 assert.match(html,/const playbackSrc=bossStyle\?attackSrc\.replace/);
 assert.match(html,/BOSS_ATTACK_DURATION_MS\[bossStyle\]\/speed/);
 assert.match(html,/impact\/speed-\(Date\.now\(\)-img\._mobAttackStartedAt\)/);
 assert.match(html,/e\.boss\?\(BOSS_ATTACK_ART\[e\.bossStyle\]/);
 assert.match(runtime,/guardian:\.85,leech:\.86,berserker:\.71/);
 assert.match(runtime,/enemyAbilityVfx='BossEmber'/);
 assert.match(runtime,/enemyAbilityVfx='BossAbyssal'/);
});
