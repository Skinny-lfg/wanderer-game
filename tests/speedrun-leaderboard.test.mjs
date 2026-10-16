import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('D200 best survives reset and only improves on a faster complete attempt',async()=>{
 const records=new Map();
 const snapshot=path=>({exists:()=>records.has(path),data:()=>records.get(path),id:path.split('/').at(-1)});
 globalThis.__speedrunSdk={
  initializeApp:()=>({}),getAuth:()=>({currentUser:{uid:'alice'}}),
  getFirestore:()=>({}),setPersistence:async()=>{},browserLocalPersistence:{},
  doc:(_,...parts)=>parts.join('/'),collection:(_,...parts)=>parts.join('/'),
  serverTimestamp:()=>123,
  getDoc:async path=>snapshot(path),
  orderBy:(field,direction)=>({field,direction}),
  limit:n=>({limit:n}),query:(path,...parts)=>({path,parts}),
  getDocs:async q=>{
   const prefix=q.path+'/',order=q.parts.find(x=>x.field);
   const rows=[...records.entries()].filter(([key])=>key.startsWith(prefix)&&!key.slice(prefix.length).includes('/'))
    .sort((a,b)=>(a[1][order.field]-b[1][order.field])*(order.direction==='desc'?-1:1))
    .slice(0,q.parts.find(x=>x.limit)?.limit||50);
   return {docs:rows.map(([key])=>snapshot(key))};
  },
  runTransaction:async(_,callback)=>{
   const pending=[];
   await callback({get:async path=>snapshot(path),set:(path,value)=>pending.push([path,value])});
   for(const [path,data]of pending)records.set(path,data);
  }
 };
 let source=await readFile(new URL('../online/firebase-client.mjs',import.meta.url),'utf8');
 source=source.replace("import * as sdk from './vendor/firebase-sdk.mjs';",'const sdk=globalThis.__speedrunSdk;');
 for(const name of ['firebase-config','model','public-loadout'])source=source.replace(`'./${name}.mjs'`,JSON.stringify(new URL(`../online/${name}.mjs`,import.meta.url).href));
 try{
  const {createBackend}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const backend=await createBackend();
  records.set('publicProfiles/alice',{nickname:'alice',characterId:'wanderer'});
  const make=(id,deepest,time)=>({
   gold:0,fragments:0,maxDungeon:Math.max(1,deepest),stash:[],equip:{},run:null,
   onlineProgress:{attemptId:id,deepestCleared:deepest,timingEligible:true,activeMs:time??0,milestones:time==null?{}:{200:{activeMs:time}}}
  });
  const depth='testSeasons/v092-launch-1/deepest/alice',best='testSeasons/v092-launch-1/speedruns/alice';
  await backend.publishTestResults(make('attempt-a',100,null));
  assert.equal(records.get(depth).deepest,100);
  assert.equal(records.has(best),false,'no D200 record without completion');
  await backend.publishTestResults(make('attempt-a',200,650000));
  assert.equal(records.get(best).bestMs,650000);
  await backend.publishTestResults(make('attempt-b',0,null));
  assert.equal(records.get(depth).deepest,0,'new attempt resets current depth');
  assert.equal(records.get(best).bestMs,650000,'reset keeps prior best');
  await backend.publishTestResults(make('attempt-b',200,760000));
  assert.equal(records.get(best).bestMs,650000,'slower completion never replaces best');
  await backend.publishTestResults(make('attempt-c',200,480000));
  assert.equal(records.get(best).bestMs,480000,'faster clear becomes the record');
  assert.equal((await backend.leaderboard('fastest'))[0].bestMs,480000);
  assert.equal((await backend.leaderboard('deepest'))[0].deepest,200);
  await backend.publishTestResults(make('attempt-d',0,null));
  assert.equal((await backend.leaderboard('deepest'))[0].deepest,0);
  assert.equal((await backend.leaderboard('fastest'))[0].bestMs,480000);
  await assert.rejects(backend.leaderboard('first'),/Unknown leaderboard category/);
 }finally{delete globalThis.__speedrunSdk;}
});
