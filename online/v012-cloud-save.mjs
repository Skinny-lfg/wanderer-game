/* Owner-bound v0.12 save coordinator. v092 is never read. */
export function createCloudSaveCoordinator({backend,uid,projectId,readSnapshot,applySnapshot,onStatus=()=>{},storage=null,delay=600}){
 if(!backend||!uid||!projectId||typeof readSnapshot!=='function')throw Error('Cloud save coordinator configuration is incomplete.');
 const memory=new Map();storage??={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
 const key='wanderer_v012_cloud_outbox_'+uid;let revision=0,timer=null,chain=Promise.resolve(),closed=false,lastRaw='',sessionWrote=false;
 const status=(value,error=null)=>{try{onStatus(value,error);}catch{}try{globalThis.dispatchEvent?.(new CustomEvent('wanderer:save-status',{detail:{state:value,error:error?.name||null}}));}catch{}};
 const valid=raw=>{const save=globalThis.WandererV012Save.validate(raw,uid);if(save.format!=='wanderer-expedition'||save.schemaVersion!==globalThis.WandererV012Save.VERSION)throw Error('Unsupported v0.12 save version.');const bytes=new TextEncoder().encode(JSON.stringify(save)).byteLength;if(bytes>680000)throw Error('Cloud save exceeds the safe 680,000-byte UTF-8 payload limit.');return save;};
 function queue(save,{immediate=false}={}){
  if(closed) return Promise.reject(Error('Cloud save session is closed.'));
  const clean=valid(save);clean.revision=revision;
  const raw=JSON.stringify(clean);if(raw===lastRaw)return chain;
  lastRaw=raw;try{storage?.setItem(key,JSON.stringify({uid,baseRevision:revision,save:clean}));}catch{}
  if(timer)clearTimeout(timer);
  status('saving');
  const send=()=>{chain=chain.catch(()=>{}).then(async()=>{
   if(closed)return;const current=storage?.getItem(key);if(!current)return;
   const outbox=JSON.parse(current);if(outbox.uid!==uid)throw Error('Offline save belongs to another account.');
   if(outbox.baseRevision!==revision){if(sessionWrote&&outbox.baseRevision<revision){outbox.baseRevision=revision;storage?.setItem(key,JSON.stringify(outbox));}else throw Error('Cloud save changed in another session. Local recovery copy retained.');}
   const payload=valid(outbox.save);payload.revision=revision;
   const result=await backend.writeV012Save(uid,payload,revision);
   revision=result.revision;sessionWrote=true;try{const latest=storage?.getItem(key);if(latest===current)storage.removeItem(key);else if(latest){const next=JSON.parse(latest);next.baseRevision=revision;storage.setItem(key,JSON.stringify(next));}}catch{}
   status('saved');
  }).catch(error=>{status(/changed|diverged/i.test(String(error?.message||''))?'conflict':'error',error);throw error;});return chain;};
  if(immediate)return send();
  timer=setTimeout(()=>{timer=null;send().catch(()=>{});},delay);return chain;
 }
 async function initialize(initialSave){
  status('saving');
  const record=await backend.readV012Save(uid);
  if(record){
   if(record.format!=='wanderer-expedition'||record.schemaVersion!==globalThis.WandererV012Save.VERSION||!Number.isSafeInteger(record.revision)||record.revision<1||typeof record.payload!=='string')throw Error('Cloud save envelope is invalid or unsupported.');
   let cloud=valid(JSON.parse(record.payload));cloud.revision=0;revision=record.revision;
   const pendingRaw=storage?.getItem(key);
   if(pendingRaw){const pending=JSON.parse(pendingRaw);if(pending.uid!==uid||!Number.isSafeInteger(pending.baseRevision)||!pending.save)throw Error('Offline recovery copy is invalid; it has been retained.');const local=valid(pending.save);local.revision=0;
    const same=JSON.stringify({...cloud,revision:0})===JSON.stringify(local);
    if(same){storage?.removeItem(key);}
    else if(pending.baseRevision===revision){const result=await backend.writeV012Save(uid,local,revision);revision=result.revision;cloud=local;storage?.removeItem(key);}
    else {const error=Error('Cloud and offline saves diverged. Local recovery copy retained; automatic overwrite was blocked.');status('conflict',error);throw error;}
   }
   await applySnapshot(cloud);lastRaw=JSON.stringify(cloud);status('saved');return cloud;
  }
  const fresh=valid(initialSave);fresh.revision=0;revision=0;
  const created=await backend.createV012SaveIfMissing(uid,fresh);
  if(created.revision!==1){
   if(created.format!=='wanderer-expedition'||created.schemaVersion!==globalThis.WandererV012Save.VERSION)throw Error('Cloud save envelope is invalid or unsupported.');
   const cloud=valid(JSON.parse(created.payload));cloud.revision=0;revision=created.revision;await applySnapshot(cloud);lastRaw=JSON.stringify(cloud);status('saved');return cloud;
  }
  revision=1;lastRaw=JSON.stringify(fresh);status('saved');return fresh;
 }
 function persist(save){return queue(save);}
 function exportRecovery(){const raw=storage?.getItem(key);if(!raw)throw Error('No local recovery copy is available.');return raw;}
 async function reloadCloud(){
  status('saving');const record=await backend.readV012Save(uid);
  if(!record||record.format!=='wanderer-expedition'||record.schemaVersion!==globalThis.WandererV012Save.VERSION||!Number.isSafeInteger(record.revision)||typeof record.payload!=='string')throw Error('The current cloud save could not be validated. Local recovery copy retained.');
  const cloud=valid(JSON.parse(record.payload));cloud.revision=0;revision=record.revision;
  await applySnapshot(cloud);try{storage?.removeItem(key);}catch{}
  lastRaw=JSON.stringify(cloud);status('saved');return cloud;
 }
 async function flush(){if(timer){clearTimeout(timer);timer=null;lastRaw='';await queue(readSnapshot(),{immediate:true});return;}const pending=storage?.getItem(key);if(pending){lastRaw='';await queue(JSON.parse(pending).save,{immediate:true});return;}await chain;}
 const online=()=>flush().catch(()=>{});globalThis.addEventListener?.('online',online);
 async function close(){try{await flush();}finally{closed=true;if(timer)clearTimeout(timer);globalThis.removeEventListener?.('online',online);}}
 return Object.freeze({initialize,persist,flush,close,exportRecovery,reloadCloud,get revision(){return revision;}});
}
