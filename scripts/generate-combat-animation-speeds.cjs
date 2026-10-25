#!/usr/bin/env node
'use strict';
// Convert approved ×1 animated GIFs to ×2/×4 without re-encoding artwork.
// Only frame-delay values in Graphic Control Extensions are changed:
// original pixels, palettes, transparencies, dimensions and frame count remain.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const check=process.argv.includes('--check');
const dirs=['assets/mobs/animated','assets/elites/animated'];
function inspect(buffer){
 assert.equal(buffer.toString('ascii',0,3),'GIF','Not a GIF');
 const width=buffer.readUInt16LE(6),height=buffer.readUInt16LE(8);
 assert(width>0&&width<=768,'GIF width must be at most 768px');
 assert(height>0,'GIF height must be positive');
 let offset=13;
 if(buffer[10]&0x80)offset+=3*(1<<((buffer[10]&7)+1));
 const delayOffsets=[];
 let frames=0,done=false;
 function skipBlocks(){
  while(offset<buffer.length){
   const size=buffer[offset++];
   if(!size)return;
   offset+=size;
   if(offset>buffer.length)throw Error('Corrupt GIF sub-block');
  }
  throw Error('Unterminated GIF sub-blocks');
 }
 while(offset<buffer.length){
  const kind=buffer[offset++];
  if(kind===0x3b){done=true;break;}
  if(kind===0x21){
   const label=buffer[offset++];
   if(label===0xf9){
    assert.equal(buffer[offset++],4,'Unexpected GIF graphic control size');
    delayOffsets.push(offset+1);
    offset+=4;
    assert.equal(buffer[offset++],0,'GIF graphic control terminator missing');
   }else skipBlocks();
  }else if(kind===0x2c){
   frames++;
   const flags=buffer[offset+8];
   offset+=9;
   if(flags&0x80)offset+=3*(1<<((flags&7)+1));
   offset++; // LZW code size
   skipBlocks();
  }else throw Error('Unexpected GIF block '+kind+' at '+(offset-1));
 }
 assert(done,'GIF is missing trailer');
 assert.equal(frames,delayOffsets.length,'Each frame must carry its own timing');
 assert(frames>1,'Source must be an animated GIF');
 const delays=delayOffsets.map(i=>buffer.readUInt16LE(i));
 assert(delays.every(n=>n>=2),'Source has unsafe frame delay below 20ms');
 return {width,height,frames,delayOffsets,delays,totalCs:delays.reduce((a,b)=>a+b,0)};
}
function acceleratedDelays(original,speed){
 const minCs=2;
 const target=Math.max(original.length*minCs,Math.round(original.reduce((a,b)=>a+b,0)/speed));
 const exact=original.map(n=>n/speed);
 const scaled=exact.map(n=>Math.max(minCs,Math.floor(n)));
 let remainder=target-scaled.reduce((a,b)=>a+b,0);
 const order=exact.map((n,i)=>({i,fraction:n-Math.floor(n)})).sort((a,b)=>b.fraction-a.fraction||a.i-b.i);
 for(let i=0;remainder>0;i++,remainder--)scaled[order[i%order.length].i]++;
 for(let j=0;remainder<0;j++){
  const candidates=scaled.map((n,i)=>({n,i})).filter(({n})=>n>minCs).sort((a,b)=>b.n-a.n||a.i-b.i);
  assert(candidates.length,'Cannot meet GIF minimum frame delay');
  scaled[candidates[0].i]--;
  remainder++;
 }
 assert.equal(scaled.reduce((a,b)=>a+b,0),target);
 return scaled;
}
let total=0,created=0,checked=0;
for(const dir of dirs){
 const directory=path.join(root,dir);
 const sources=fs.readdirSync(directory).filter(name=>name.endsWith('.gif')&&!/_x[124]\.gif$/i.test(name)).sort();
 assert.equal(sources.length,dir.includes('/mobs/')?24:4,'Unexpected original GIF count in '+dir);
 for(const name of sources){
  const original=fs.readFileSync(path.join(directory,name)),timing=inspect(original);
  for(const speed of [2,4]){
   const target=path.join(directory,name.replace(/\.gif$/i,'_x'+speed+'.gif'));
   const edited=Buffer.from(original);
   const delays=acceleratedDelays(timing.delays,speed);
   timing.delayOffsets.forEach((at,i)=>edited.writeUInt16LE(delays[i],at));
   assert.equal(edited.length,original.length);
   const confirmed=inspect(edited);
   assert.equal(confirmed.frames,timing.frames);
   assert.equal(confirmed.width,timing.width);
   assert.equal(confirmed.height,timing.height);
   assert.deepEqual(confirmed.delays,delays);
   if(check){
    assert(fs.existsSync(target),'Missing accelerated GIF: '+target);
    assert(fs.readFileSync(target).equals(edited),'Outdated accelerated GIF: '+target);
    checked++;
   }else if(!fs.existsSync(target)||!fs.readFileSync(target).equals(edited)){
    fs.writeFileSync(target,edited);created++;
   }
   total++;
  }
  console.log('PASS '+dir+'/'+name+': '+timing.frames+' frames, '+(timing.totalCs*10)+'ms x1');
 }
}
console.log('PASS '+total+' speed variants '+(check?'verified ('+checked+' exact matches)':'processed ('+created+' written)')+'. Original GIFs unchanged.');
