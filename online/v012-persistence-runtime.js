// v0.12 persistence runtime. Canonical state transitions; UI effects are injected.
(function(root){'use strict';
function create(ports){
function gameRandom(){
 if(!ports.PHASE1_PREVIEW||ports.phase4Seed===null)return Math.random();
 ports.phase4Seed=(Math.imul(ports.phase4Seed,1664525)+1013904223)>>>0;return ports.phase4Seed/4294967296;
}

function phase4Session(entry=false){
 const continuity=ports.phase1Continuity?ports.phase4Clone(ports.phase1Continuity):null;
 if(continuity?.legendaryState)delete continuity.legendaryState.enemy;
 return ports.phase4Clone({version:1,entry,controller:ports.phase1Controller.state,build:ports.phase1Build,vitals:ports.phase1Vitals,
  integration:ports.phase6Run,clock:ports.phase1Clock,supplies:ports.phase3Supplies,lootIds:[...ports.phase3LootIds],home:ports.phase4Home,
  seed:ports.phase4Seed,prefix:ports.phase4Prefix,stamp:ports.phase4Stamp,idCounter:ports.uid,continuity,draft:ports.phase1Draft,results:ports.phase5Results});
}

function phase4CommitRealm(){
 if(ports.PHASE5_VALIDATION)ports.phase5Snapshot.expedition.awardKeys=[...new Set([...ports.phase5Snapshot.expedition.awardKeys,...ports.phase4WaveKeys])];
 ports.phase4WaveKeys=[];ports.phase4Entry=null;ports.phase4Resume=false;
}

function phase4LoseLoot(){
 const lost=ports.phase3LootIds;
 const homeIds=new Set(Object.values(ports.phase4Home||{}).filter(Boolean).map(item=>item.id));
 ports.state.stash=ports.state.stash.filter(item=>!lost.has(item.id)&&!homeIds.has(item.id));
 ports.state.expeditionOverflow=ports.state.expeditionOverflow.filter(item=>!lost.has(item.id)&&!homeIds.has(item.id));
 if(ports.phase4Home)ports.state.equip=ports.phase4Clone(ports.phase4Home);
 ports.phase3LootIds=new Set();ports.phase4Home=null;
}

function phase4Extract(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||!ports.phase3IsBetweenPlanes()||ports.phase3BagOverflow()||ports.phase4Resume)return false;
 ports.phase6ReturnPotions('extracted');
 ports.phase5MakeSummary('extracted');ports.phase5Results.review='summary';
 ports.phase1Controller.abandon();if(ports.phase1Build)WandererV012Buildcraft.clear(ports.phase1Build);
 ports.phase1Build=null;ports.phase1Draft=null;ports.phase1Vitals=null;ports.phase1Continuity=null;ports.phase3LootIds=new Set();ports.phase4Home=null;ports.phase4Seed=null;ports.phase4Prefix=null;ports.phase4Entry=null;ports.phase4WaveKeys=[];
 if(ports.PHASE5_VALIDATION)ports.phase5Snapshot.expedition.lastOutcome='extracted';
 ports.view='phase1';if(!ports.phase5Persist())return false;ports.render();
 ports.bannerMessage(ports.state.expeditionOverflow.length?'Extracted. Free Stash space to claim '+ports.state.expeditionOverflow.length+' secured items.':'Extraction complete. Loot kept; next difficulty remains locked.');return true;
}

function phase4Restore(session){
 ports.phase1Controller.restore(session.controller);
 if(session.build)WandererV012Buildcraft.validate(session.build);
 ports.phase6Run=session.integration||null;
 ports.phase1Build=session.build;if(ports.phase1Build&&ports.phase6Run?.effects.echo)ports.phase1Build.runtime.echo=ports.phase6Run.effects.echo;ports.phase1Draft=session.draft;ports.phase1Vitals=session.vitals;ports.phase1Clock=session.clock;ports.phase3Supplies=session.supplies;
 ports.phase3LootIds=new Set(session.lootIds);ports.phase4Home=session.home;ports.phase4Seed=session.seed;ports.phase4Prefix=session.prefix;ports.phase4Stamp=session.stamp;ports.uid=session.idCounter;ports.phase1Continuity=session.continuity;
 if(ports.phase1Build){ports.phase1Build.families=ports.phase1Controller.state.families;if(ports.phase1Draft?.kind==='reward'){
  const eligible=WandererV012Buildcraft.eligible;
  if(!ports.phase1Controller.state.rewardPending||!Array.isArray(ports.phase1Draft.options)||ports.phase1Draft.options.length!==3||new Set(ports.phase1Draft.options.map(p=>p.id)).size!==3||!ports.phase1Draft.options.every(p=>eligible(ports.phase1Build,p.family).some(v=>v.id===p.id)))throw Error('Invalid saved passive choice');
  ports.phase1Draft.plane=ports.phase1Controller.state.rewardPending;
  ports.phase1Draft.options=ports.phase1Draft.options.map(p=>WandererV012Buildcraft.CATALOG.find(v=>v.id===p.id));
 }}
 if(session.results)ports.phase5Results=ports.phase4Clone(session.results);
 ports.state.run=null;ports.phase4WaveKeys=[];ports.phase4Resume=session.entry;
 ports.phase4Entry=session.entry?{profile:ports.phase4Clone({...ports.state,run:null}),session:ports.phase4Clone(session),ledger:[...(ports.phase5Snapshot?.expedition.awardKeys||[])]}:null;
 ports.view='phase1';
}

function phase4ResumeRealm(){
 if(!ports.phase4Resume||!ports.phase4Entry||ports.state.run||ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 ports.phase4Resume=false;ports.phase2Launch(ports.phase1Controller.state.selected);return true;
}

function phase5Capture(){
 const g=ports.phase1Controller.state,active=['choice','combat'].includes(g.stage),entry=ports.phase4Entry;
 const session=entry?entry.session:active||ports.phase3NeedsBagResolution()?ports.phase4Session():null;
 return {...ports.phase5Snapshot,idCounter:entry?entry.session.idCounter:ports.uid,profile:entry?entry.profile:{...ports.state,run:null},expedition:{...ports.phase5Snapshot.expedition,
  awardKeys:entry?entry.ledger:ports.phase5Snapshot.expedition.awardKeys,session,presentation:entry?.session.results||ports.phase5Results,
  unlocked:g.unlocked,active:active?{attempt:ports.phase5Snapshot.expedition.attempts,level:g.expedition,plane:g.planeIndex,wave:g.wave,stage:g.stage}:null}};
}

function phase5Persist(){
 if(!ports.PHASE5_VALIDATION)return true;
 if(!ports.phase5Ready||ports.saveBlocked)return false;
 try{ports.phase5Pending=WandererV012Save.validate(ports.phase5Capture(),ports.phase5Snapshot.binding);ports.phase5Snapshot=ports.phase5Store.commit(ports.phase5Pending);ports.phase5Pending=null;return true;}
 catch(error){ports.phase5Fail(error);return false;}
}

function phase5Init(){
 if(!ports.PHASE5_VALIDATION)return;
 ports.saveBlocked=true;
 try{
  if(!globalThis.WandererV012Save||!globalThis.navigator?.locks)throw Error('Save validation requires the save module and a browser with Web Locks');
  const binding=new URLSearchParams(globalThis.location.search).get('validationSlot')||'local';
  const key=WandererV012Save.key(binding);
  navigator.locks.request(key,{ifAvailable:true},async lock=>{
   if(!lock){ports.phase5Fail(Error('This validation slot is already open in another tab'));return;}
   try{
    ports.phase5Store=WandererV012Save.createStore(localStorage,binding);ports.phase5Raw=localStorage.getItem(key);
    const stored=ports.phase5Store.load();
    if(stored){
     const recovered=WandererV012Save.recover(stored,binding);ports.phase5Snapshot=recovered.save;
     ports.state=JSON.parse(JSON.stringify(recovered.save.profile));ports.uid=Math.max(ports.uid,recovered.save.idCounter);
     // Also avoid collisions with IDs from an older classic session imported as a copy.
     for(const item of [...ports.state.stash,...Object.values(ports.state.equip).filter(Boolean),...ports.state.expeditionOverflow,...ports.state.runes,...ports.state.sigils,...(ports.state.merchant?.stock||[]),...(ports.state.pendingRuneReward?.options||[])]){
      const match=String(item.id).match(/^[a-z0-9]+-([a-z0-9]+)$/);const number=match?parseInt(match[1],36):0;
      if(Number.isSafeInteger(number))ports.uid=Math.max(ports.uid,number);
     }
     ports.phase1Controller.state.unlocked=ports.phase5Snapshot.expedition.unlocked;ports.phase5PersonalBest=ports.phase5Snapshot.expedition.completed;
     ports.phase1Vitals=null;ports.phase1Build=null;ports.phase1Draft=null;
     if(ports.phase5Snapshot.expedition.presentation)ports.phase5Results=ports.phase4Clone(ports.phase5Snapshot.expedition.presentation);
     if(ports.phase5Snapshot.expedition.session)ports.phase4Restore(ports.phase5Snapshot.expedition.session);
    }else ports.phase5Snapshot=WandererV012Save.create({...ports.state,run:null},{binding});
    ports.phase5Ready=true;ports.saveBlocked=false;
    if(ports.phase5Persist()){if(!ports.phase2EnterInitialRealm())ports.render();}
   }catch(error){ports.phase5Fail(error);}
   await new Promise(resolve=>globalThis.addEventListener('pagehide',()=>{
    if(ports.phase5Ready)ports.phase5Persist();ports.phase5Ready=false;resolve();
   },{once:true}));
  }).catch(ports.phase5Fail);
  globalThis.addEventListener('storage',event=>{if(event.key===key&&ports.phase5Ready)ports.phase5Fail(Error('Validation slot changed in another tab'));});
  globalThis.addEventListener('pageshow',event=>{if(event.persisted)globalThis.location.reload();});
 }catch(error){ports.phase5Fail(error);}
}

function phase5Fail(error){
 ports.saveBlocked=true;ports.phase5Ready=false;clearInterval(ports.clock);ports.view='phase1';
 ports.closeDialogs();
 ports.phase5Message='Validation save blocked: '+String(error?.message||error)+'. Existing saves are retained. Export before closing if a write failed.';
 ports.phase5RenderBlocked();
}
return {gameRandom,phase4Session,phase4CommitRealm,phase4LoseLoot,phase4Extract,phase4Restore,phase4ResumeRealm,phase5Capture,phase5Persist,phase5Init,phase5Fail};
}
root.WandererV012PersistenceRuntime=Object.freeze({create});
})(globalThis);
