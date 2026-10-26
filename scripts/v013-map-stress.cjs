/* Wanderer v0.13 isolated map stress test: no network, no saves, no Firebase. */
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
function numeric(flag,fallback){const i=process.argv.indexOf(flag);if(i<0)return fallback;const n=Number(process.argv[i+1]);if(!Number.isInteger(n)||n<0)throw Error('Invalid '+flag);return n;}
(async()=>{
 await import(pathToFileURL(path.resolve(__dirname,'../online/v013-map-prototype.js')).href);
 const api=globalThis.WandererV013MapPrototype;
 const seeds=numeric('--seeds',10000),minutes=numeric('--minutes',0);
 if(seeds>50000000||minutes>180)throw Error('Safety cap: 50m seeds / 180 minutes');
 if(!seeds&&!minutes)throw Error('Choose at least one limit');
 const outIndex=process.argv.indexOf('--out'),out=outIndex>=0?process.argv[outIndex+1]:null;
 const began=Date.now(),until=minutes?began+minutes*60000:Infinity;
 const result={model:'isolated-map-v013',seedStart:0,requestedSeeds:seeds,requestedMinutes:minutes,checked:0,failures:0,events3:0,events4:0,firstFailure:null,seconds:0};
 for(let i=0;i<(seeds||50000000)&&Date.now()<until;i++){
  try{
   const map=api.create(i,{eventCount:i%2===0?3:4});
   api.validate(map);
   const visited=api.walk(map,[i%3,(i+1)%3,(i+2)%3]);
   if(visited.length!==15||visited[14].id!==map.bossId)throw Error('Invalid path');
   if(i%100===0&&JSON.stringify(api.create(i,{eventCount:i%2===0?3:4}))!==JSON.stringify(map))throw Error('Non deterministic map');
   result.checked++;
   if(map.eventCount===3)result.events3++;else result.events4++;
  }catch(error){result.failures++;if(result.firstFailure===null)result.firstFailure={seed:i,error:String(error)};break;}
  if((i+1)%10000===0)process.stdout.write('MAP_STRESS checked='+result.checked+' failures='+result.failures+' elapsed='+(Date.now()-began)/1000+'s\n');
 }
 result.seconds=Math.round((Date.now()-began)/10)/100;
 const output=JSON.stringify(result,null,2);
 if(out)fs.writeFileSync(out,output+'\n');
 process.stdout.write(output+'\n');
 if(result.failures||result.checked===0)process.exitCode=1;
})().catch(e=>{process.stderr.write(String(e.stack||e)+'\n');process.exitCode=1;});