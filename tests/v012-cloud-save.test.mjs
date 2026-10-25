import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createCloudSaveCoordinator} from '../online/v012-cloud-save.mjs';

const context={console,Math,JSON,Object,Array,Set,Number,String,Error,RegExp,Date};
vm.runInNewContext(readFileSync('online/v012-save.js','utf8'),context);
globalThis.WandererV012Save=context.WandererV012Save;
function initial(uid='alice'){
 return {format:'wanderer-expedition',schemaVersion:13,binding:uid,identity:null,revision:0,idCounter:0,
  profile:{attemptCompleted:false,characterId:'wanderer',stashCapacity:40,maxDungeon:1,chosen:1,fragments:0,gold:0,stash:[],equip:{},valuables:[],runes:[],runeSlots:[null,null,null],sigils:[],expeditionOverflow:[],run:null},
  legacyHistory:{maxDungeon:1,onlineProgress:null,attemptCompleted:false},migration:null,
  expedition:{completed:0,unlocked:1,attempts:0,active:null,awardKeys:[],lastOutcome:'new'}};
}
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}

test('missing cloud save creates exactly once and subsequent login restores cloud state',async()=>{
 let record=null,creates=0,writes=0;const backend={async readV012Save(){return record;},async createV012SaveIfMissing(uid,save){creates++;if(!record)record={payload:JSON.stringify(save),revision:1,schemaVersion:13,format:'wanderer-expedition'};return record;},async writeV012Save(uid,save,revision){writes++;record={payload:JSON.stringify(save),revision:revision+1,schemaVersion:13,format:'wanderer-expedition'};return record;}};
 let applied;const coordinator=createCloudSaveCoordinator({backend,uid:'alice',projectId:'test',readSnapshot:()=>initial(),applySnapshot:save=>{applied=save;},storage:memory(),delay:0});
 const first=await coordinator.initialize(initial());assert.equal(first.expedition.lastOutcome,'new');assert.equal(creates,1);
 const second=createCloudSaveCoordinator({backend,uid:'alice',projectId:'test',readSnapshot:()=>initial(),applySnapshot:save=>{applied=save;},storage:memory()});
 await second.initialize(initial());assert.equal(creates,1);assert.equal(applied.binding,'alice');
 await second.close();assert.equal(writes,0);
});

test('concurrent/stale revision is surfaced and offline outbox is retained',async()=>{
 const storage=memory();let status='';const backend={async readV012Save(){return null;},async createV012SaveIfMissing(){return {revision:1,payload:JSON.stringify(initial()),schemaVersion:13,format:'wanderer-expedition'};},async writeV012Save(){throw Error('revision conflict');}};
 const coordinator=createCloudSaveCoordinator({backend,uid:'alice',projectId:'test',readSnapshot:initial,applySnapshot:()=>{},onStatus:value=>status=value,storage,delay:60000});
 await coordinator.initialize(initial());const save=initial();save.profile.gold=5;coordinator.persist(save);await assert.rejects(coordinator.flush(),/revision conflict/);assert.equal(status,'error');assert.ok(storage.getItem('wanderer_v012_cloud_outbox_alice'));
});

test('offline outbox resumes only when its base cloud revision still matches',async()=>{
 const storage=memory(),base=initial(),pending=initial();pending.profile.gold=9;
 let record={payload:JSON.stringify(base),revision:1,schemaVersion:13,format:'wanderer-expedition'},writes=0,applied;
 storage.setItem('wanderer_v012_cloud_outbox_alice',JSON.stringify({uid:'alice',baseRevision:1,save:pending}));
 const backend={async readV012Save(){return record;},async writeV012Save(uid,save,revision){writes++;assert.equal(revision,1);record={payload:JSON.stringify(save),revision:2,schemaVersion:13,format:'wanderer-expedition'};return record;}};
 const coordinator=createCloudSaveCoordinator({backend,uid:'alice',projectId:'test',readSnapshot:()=>pending,applySnapshot:save=>{applied=save;},storage});
 await coordinator.initialize(base);assert.equal(writes,1);assert.equal(applied.profile.gold,9);assert.equal(storage.getItem('wanderer_v012_cloud_outbox_alice'),null);
});

test('foreign UID snapshots are rejected before writing',async()=>{
 let writes=0;const backend={async readV012Save(){return null;},async createV012SaveIfMissing(){return {revision:1,payload:JSON.stringify(initial()),schemaVersion:13,format:'wanderer-expedition'};},async writeV012Save(){writes++;}};
 const coordinator=createCloudSaveCoordinator({backend,uid:'alice',projectId:'test',readSnapshot:initial,applySnapshot:()=>{},storage:memory()});await coordinator.initialize(initial());
 const foreign=initial('bob');assert.throws(()=>coordinator.persist(foreign),/foreign account/);assert.equal(writes,0);
});

test('payload cap is measured in UTF-8 bytes before any Cloud write',async()=>{
 const backend={async readV012Save(){return null;},async createV012SaveIfMissing(){return {revision:1,payload:JSON.stringify(initial()),schemaVersion:13,format:'wanderer-expedition'};},async writeV012Save(){throw Error('must not write');}};
 const coordinator=createCloudSaveCoordinator({backend,uid:'alice',projectId:'test',readSnapshot:initial,applySnapshot:()=>{},storage:memory()});await coordinator.initialize(initial());
 const unicode=initial();unicode.profile.stash.push({id:'unicode-item',name:'🧭'.repeat(180000),slot:'helm',subtype:'Helm',tier:1,rarity:'Common'});
 assert.ok(JSON.stringify(unicode).length<700000);assert.ok(new TextEncoder().encode(JSON.stringify(unicode)).byteLength>700000);
 assert.throws(()=>coordinator.persist(unicode),/UTF-8 payload limit/);
});

test('diverged outbox is retained until an explicit cloud reload resolution',async()=>{
 const storage=memory(),local=initial(),cloud=initial();local.profile.gold=12;cloud.profile.gold=31;
 const key='wanderer_v012_cloud_outbox_alice';storage.setItem(key,JSON.stringify({uid:'alice',baseRevision:1,save:local}));
 const record={payload:JSON.stringify(cloud),revision:4,schemaVersion:13,format:'wanderer-expedition'};let applied;
 const backend={async readV012Save(){return record;},async writeV012Save(){throw Error('must not overwrite divergent cloud');}};
 const coordinator=createCloudSaveCoordinator({backend,uid:'alice',projectId:'test',readSnapshot:()=>local,applySnapshot:save=>{applied=save;},storage,onStatus:()=>{}});
 await assert.rejects(coordinator.initialize(local),/diverged/);assert.ok(coordinator.exportRecovery());
 await coordinator.reloadCloud();assert.equal(applied.profile.gold,31);assert.equal(storage.getItem(key),null);
});
