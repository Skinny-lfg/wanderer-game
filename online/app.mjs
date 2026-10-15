import {CHARACTERS,character,validateSave,summary,safeProgress,MILESTONES} from './model.mjs';
const game=globalThis.WandererGame,GUEST='wanderer_browser_proto_v01';
let backendPromise,backend,user=null,profile=null,revision=null,synced='',epoch=0,writing=false,suppress=false,timer=null,dialog=null;
let message='Guest · Local save',selectedCharacter=game.snapshot().characterId||'wanderer';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const accountKey=()=>user?'wanderer_account_'+user.uid:null;
function status(text){message=text;document.getElementById('onlineStatus').textContent=text;}
function errorText(error){
 const code=String(error?.code||error?.message||'');
 if(code.includes('permission-denied'))return 'Firebase access denied. The project needs the supplied Firestore Rules. Your local save is safe.';
 if(code.includes('unauthorized-domain'))return 'This site is not an authorized Firebase sign-in domain. Continue as Guest or ask the owner to authorize it.';
 if(code.includes('popup-blocked'))return 'The sign-in popup was blocked. Allow popups and try again.';
 if(code.includes('popup-closed')||code.includes('cancelled-popup'))return 'Sign-in was cancelled. You can continue as Guest.';
 if(code.includes('cloud-conflict'))return 'Another device changed the cloud save. Auto-sync is paused. Review both saves before choosing.';
 if(code.includes('unavailable')||code.includes('network')||code.includes('offline'))return 'Cloud connection unavailable. Progress stays on this device; retry when online.';
 return error?.message||'The operation failed. Your local save has been kept.';
}
function close(){const previous=dialog;dialog=null;if(previous){previous.close();previous.remove();}}
function modal(title,content){
 close();dialog=document.createElement('dialog');dialog.className='itemDialog onlineDialog';dialog.setAttribute('aria-labelledby','onlineDialogTitle');
 dialog.innerHTML=`<div class="topline"><h2 id="onlineDialogTitle">${esc(title)}</h2><button data-close aria-label="Close dialog">×</button></div><p class="onlineError" role="alert"></p>${content}`;
 const current=dialog;current.addEventListener('close',()=>{current.remove();if(dialog===current)dialog=null;});current.querySelector('[data-close]').onclick=close;document.body.append(current);current.showModal();return current;
}
function action(selector,fn){const element=dialog?.querySelector(selector);if(!element)return;element.onclick=async()=>{const current=dialog;try{element.disabled=true;current.querySelector('.onlineError').textContent='';await fn();}catch(error){if(current.isConnected)current.querySelector('.onlineError').textContent=errorText(error);status(errorText(error));}finally{if(element.isConnected)element.disabled=false;}};}
function ensureSafeSwitch(allowProtected=false){if(game.busy())throw new Error('Finish or extract from your expedition before changing accounts or saves.');if(game.blocked()&&!allowProtected)throw new Error('The local save is protected. Export a backup, then reload before switching.');}
function sessionGuard(token){if(token!==epoch)throw new Error('The signed-in account changed. Reopen Account before continuing.');}
async function connect(){
 if(!backendPromise)backendPromise=import('./firebase-client.mjs').then(m=>m.createBackend()).then(b=>{
  backend=b;b.watchAuth(async next=>{
   const previous=user?.uid,token=++epoch;user=next;profile=null;revision=null;synced='';clearTimeout(timer);timer=null;
   if(previous&&previous!==next?.uid&&!game.busy()&&!game.blocked()){suppress=true;try{game.switchSave(GUEST);}finally{suppress=false;}}
   if(!next){status('Guest · Local save');if(dialog?.dataset.account)showAccount();return;}
   status('Signed in · Cloud sync paused until you choose a save');
   try{const p=await b.profile();sessionGuard(token);profile=p;selectedCharacter=p?.characterId||game.snapshot().characterId||'wanderer';if(dialog?.dataset.account)showAccount();}catch(e){if(token===epoch)status(errorText(e));}
  });return b;
 }).catch(error=>{backendPromise=null;throw error;});
 return backendPromise;
}
function characterPicker(){return `<div class="characterPicker">${CHARACTERS.map(c=>`<button type="button" data-character="${c.id}" aria-pressed="${selectedCharacter===c.id}"><img src="${c.fullBody}" alt="${esc(c.name)}"><span>${esc(c.name)}</span></button>`).join('')}</div><p class="small muted">Cosmetic only. No classes or stat bonuses.</p>`;}
function bindCharacters(){dialog.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>{selectedCharacter=b.dataset.character;dialog.querySelectorAll('[data-character]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});}
function download(data,name){const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function showBackups(){const keys=Object.keys(localStorage).filter(k=>k.startsWith('wanderer_backup_')).sort().reverse();modal('Local recovery backups',`<p>These backups stay on this browser. Export them before clearing browser data.</p>${keys.map((key,i)=>`<button data-backup="${i}">Export backup ${esc(key.slice(16))}</button>`).join('')||'<p>No recovery backups yet.</p>'}`);dialog.querySelectorAll('[data-backup]').forEach(b=>b.onclick=()=>download(localStorage.getItem(keys[Number(b.dataset.backup)]),'wanderer-recovery.json'));}
function showAccount(){
 selectedCharacter=profile?.characterId||game.snapshot().characterId||'wanderer';
 const signedIn=!!user;
 const content=`<p>${signedIn?`Signed in${profile?' as <b>'+esc(profile.nickname)+'</b>':''}`:'Play as Guest or sign in with Google. Guest progress stays on this browser.'}</p><p class="small muted">${esc(message)}</p>
 ${!signedIn?'<button id="googleSignIn" class="primary">Sign in with Google</button>':''}
 ${signedIn&&!profile?'<label class="profileField">Unique nickname<input id="nickname" maxlength="20" minlength="3" pattern="[A-Za-z0-9_]{3,20}" autocomplete="username" placeholder="wanderer_123"></label><p class="small muted">3–20 letters, numbers or underscores. Nicknames are case-insensitive and cannot be renamed yet.</p>':''}
 ${characterPicker()}
 <div class="buttonRow">${signedIn&&!profile?'<button id="createProfile" class="primary">Create profile</button>':'<button id="saveCharacter" class="primary">Save character</button>'}
 ${signedIn&&profile?'<button id="reviewCloud">Review local & cloud saves</button><button id="syncNow">Sync now</button>':''}
 ${signedIn?'<button id="googleSignOut">Sign out & return to Guest</button>':''}</div>
 <hr><h3>Local backup</h3><p class="small muted">${esc(summary(game.snapshot()))}</p><div class="buttonRow"><button id="exportSave">Export current save</button><button id="backups">Recovery backups</button></div>
 <label class="profileField">Import a save backup<input id="importSave" type="file" accept=".json,application/json"></label>
 <p class="small muted">Imports and account switches require an explicit choice. No save is replaced just by signing in.</p>`;
 modal('Account & Character',content).dataset.account='true';bindCharacters();
 action('#googleSignIn',async()=>{ensureSafeSwitch();const b=await connect();await b.signIn();});
 action('#createProfile',async()=>{ensureSafeSwitch();const token=epoch;const name=dialog.querySelector('#nickname').value;const p=await backend.createProfile(name,selectedCharacter);sessionGuard(token);profile=p;status('Profile created · Review your saves to enable sync');showAccount();});
 action('#saveCharacter',async()=>{
  if(game.busy())throw new Error('Change your character after the expedition.');
  const token=epoch;
  if(profile){const updated=await backend.updateCharacter(selectedCharacter);sessionGuard(token);profile=updated;if(game.key()===accountKey())game.setCharacter(selectedCharacter);}
  else game.setCharacter(selectedCharacter);
  status(profile?'Character saved to your profile':'Character saved on this device');showAccount();
 });
 action('#reviewCloud',reviewCloud);
 action('#syncNow',async()=>{if(revision===null)await reviewCloud();else await syncNow();});
 action('#googleSignOut',async()=>{ensureSafeSwitch();revision=null;await backend.signOut();suppress=true;try{game.switchSave(GUEST);}finally{suppress=false;}showAccount();});
 action('#exportSave',()=>download(game.raw()||JSON.stringify(game.snapshot()),'wanderer-save.json'));
 action('#backups',showBackups);
 dialog.querySelector('#importSave').onchange=async event=>{
  const current=dialog;try{ensureSafeSwitch(true);const file=event.target.files[0];if(!file)return;if(file.size>750000)throw new Error('Backup is too large.');const value=JSON.parse(await file.text());const payload=validateSave(value.raw||value);modal('Import backup?',`<p>${esc(summary(payload))}</p><p>Your current local save will be backed up. Cloud sync will pause until you review both saves.</p><button id="confirmImport" class="primary">Import this backup</button>`);action('#confirmImport',()=>{ensureSafeSwitch(true);revision=null;game.switchSave(game.key(),payload);status('Backup imported locally · Cloud sync paused');close();});}catch(error){if(current.isConnected)current.querySelector('.onlineError').textContent=errorText(error);}
 };
}
function localCandidate(){
 const key=accountKey();if(game.key()===key)return validateSave(game.snapshot());
 const raw=localStorage.getItem(key)||localStorage.getItem(GUEST);
 return validateSave(raw||game.snapshot());
}
async function reviewCloud(){
 ensureSafeSwitch();if(!profile)throw new Error('Create a profile first.');const token=epoch;
 status('Checking cloud save…');const remote=await backend.readSave();sessionGuard(token);
 const local=localCandidate(),cloud=remote?validateSave(remote.payload):null;
 modal('Choose your save',`<p>Nothing is replaced until you choose. A recovery backup is saved on this device before switching.</p><div class="saveChoices"><section><h3>This device</h3><p>${esc(summary(local))}</p><button id="uploadLocal">Use this device save</button></section><section><h3>Cloud</h3><p>${esc(summary(cloud))}</p><button id="downloadCloud" ${remote?'':'disabled'}>Use cloud save</button></section></div><p class="small muted">${remote?'Choosing this device will replace cloud revision '+remote.revision+'.':'There is no cloud save. Signing in has not erased your local progress.'}</p>`);
 action('#uploadLocal',async()=>{
  ensureSafeSwitch();sessionGuard(token);
  // Re-read in-memory local state: progress can change while the choice dialog is open.
  const payload={...localCandidate(),characterId:profile.characterId};
  game.backup(JSON.stringify(payload),'before-first-upload');if(remote)game.backup(remote.payload,'cloud-before-replace');
  const record=await backend.writeSave(payload,remote?.revision||0);sessionGuard(token);
  suppress=true;try{game.switchSave(accountKey(),payload);}finally{suppress=false;}
  revision=record.revision;synced=JSON.stringify(game.snapshot());status('Cloud synced · '+profile.nickname);close();
 });
 action('#downloadCloud',async()=>{
  ensureSafeSwitch();sessionGuard(token);const latest=await backend.readSave();sessionGuard(token);
  if(!latest||latest.revision!==remote.revision)throw new Error('cloud-conflict');
  const payload={...validateSave(latest.payload),characterId:profile.characterId};
  suppress=true;try{game.switchSave(accountKey(),payload);}finally{suppress=false;}
  revision=latest.revision;synced=JSON.stringify(game.snapshot());status('Cloud synced · '+profile.nickname);close();
 });
}
async function syncNow(){
 if(!user||!profile||revision===null||game.key()!==accountKey())throw new Error('Review local and cloud saves before syncing.');
 if(game.blocked())throw new Error('Local save is protected. Export a backup and reload.');
 if(game.busy()){status('Cloud sync waits until this expedition ends');return;}
 if(writing)return;
 const payload=validateSave(game.snapshot()),raw=JSON.stringify(payload);if(raw===synced){status('Cloud synced · '+profile.nickname);return;}
 const token=epoch;writing=true;status('Saving to cloud…');
 try{const record=await backend.writeSave(payload,revision);sessionGuard(token);revision=record.revision;synced=raw;status('Cloud synced · '+profile.nickname);}
 catch(error){if(token===epoch){revision=null;status(errorText(error));}throw error;}
 finally{writing=false;if(token===epoch&&revision!==null&&JSON.stringify(game.snapshot())!==synced)queueSync();}
}
function queueSync(){
 if(suppress||!user||!profile||revision===null||game.key()!==accountKey()||game.blocked())return;
 status(game.busy()?'Local save · Cloud sync after expedition':'Local save · Cloud sync pending');
 if(timer)return;timer=setTimeout(()=>{timer=null;syncNow().catch(()=>{});},30000);
}
async function showLeaderboard(metric='deepest',milestone=10){
 modal('Experimental leaderboard',`<p class="experimental">UNVERIFIED TEST RESULTS — client-reported progress can be manipulated. These are not trusted competitive rankings.</p><div class="filterBar"><label>Ranking<select id="ranking"><option value="deepest">Deepest Dungeon</option><option value="first">First to Clear</option><option value="fastest">Fastest Progression</option></select></label><label>Milestone<select id="milestone">${MILESTONES.map(n=>`<option value="${n}">D${n}</option>`).join('')}</select></label></div><p id="metricDescription" class="small muted"></p><div id="rankingRows" aria-live="polite">Loading…</div>${profile?'<button id="publishResults">Share my unverified test results</button>':'<p>Sign in and create a profile to share test results.</p>'}`);
 const current=dialog;current.querySelector('#ranking').value=metric;current.querySelector('#milestone').value=String(milestone);current.querySelector('#milestone').disabled=metric==='deepest';
 current.querySelector('#metricDescription').textContent=metric==='deepest'?'Highest dungeon reported as completed and extracted.':metric==='first'?'First server receipt of a reported milestone, not verified completion time. Imported history is not backdated.':'Reported foreground play time to a milestone. Legacy imports have no eligible timing. Client time is untrusted.';
 current.querySelector('#ranking').onchange=e=>showLeaderboard(e.target.value,Number(current.querySelector('#milestone').value));current.querySelector('#milestone').onchange=e=>showLeaderboard(metric,Number(e.target.value));
 action('#publishResults',async()=>{ensureSafeSwitch();if(game.key()!==accountKey()||revision===null)throw new Error('Choose and sync your account save before sharing results.');await syncNow();await backend.publishTestResults(game.snapshot());await showLeaderboard(metric,milestone);});
 try{const b=await connect();const rows=await b.leaderboard(metric,milestone);if(!current.isConnected)return;
 current.querySelector('#rankingRows').innerHTML=rows.length?`<ol class="rankingList">${rows.map((row,i)=>{const c=character(row.profile.characterId);const detail=metric==='deepest'?`D${row.deepest}`:metric==='first'?`D${milestone} · received ${row.receivedAt?.toDate?row.receivedAt.toDate().toLocaleString():'pending'}`:`D${milestone} · ${Math.floor(row.activeMs/60000)}m ${Math.floor(row.activeMs/1000)%60}s`;return `<li><span>${i+1}</span><img src="${c.avatar}" alt="${esc(c.name)}"><b>${esc(row.profile.nickname)}</b><span>${esc(detail)}</span><small>Unverified</small></li>`}).join('')}</ol>`:'<p>No test results yet.</p>';
 }catch(error){if(current.isConnected){current.querySelector('#rankingRows').textContent='Leaderboard unavailable.';current.querySelector('.onlineError').textContent=errorText(error);}}
}
document.querySelector('[data-online-action="account"]').onclick=showAccount;
document.querySelector('[data-online-action="leaderboard"]').onclick=()=>showLeaderboard();
globalThis.addEventListener('wanderer:saved',queueSync);
globalThis.addEventListener('wanderer:conflict',()=>{revision=null;status('Local save needs attention. Export a backup from Account and reload.');});
globalThis.addEventListener('online',()=>{if(revision!==null)queueSync();});
let lastTick=performance.now();setInterval(()=>{const now=performance.now(),delta=now-lastTick;lastTick=now;if(document.visibilityState==='visible'&&document.hasFocus())game.recordActive(delta);},5000);
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();});
// Auth restoration is read-only. Cloud writes remain paused until a deliberate save choice.
connect().catch(error=>status('Guest · '+errorText(error)));
