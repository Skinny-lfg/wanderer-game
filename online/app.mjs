import {publicLoadout,cleanEquipment} from './public-loadout.mjs';
import {practiceDuel} from './pvp.mjs';
import {CHARACTERS,character,validateSave,summary,safeProgress,MILESTONES} from './model.mjs';
const game=globalThis.WandererGame,GUEST='wanderer_browser_proto_v01';
let backendPromise,backend,user=null,profile=null,revision=null,synced='',epoch=0,writing=false,suppress=false,timer=null,dialog=null;
let ready=false,lastPublished='',lastLoadout='',profileState='loading';
let message='Sign in to play',selectedCharacter=game.snapshot().characterId||'wanderer';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const accountKey=()=>user?'wanderer_account_'+user.uid:null;
function status(text){message=text;}
function report(error){status(errorText(error));const el=document.getElementById('accountError');el.textContent=message;el.hidden=false;}
function clearError(){document.getElementById('accountError').hidden=true;}
function accountLabel(){document.querySelector('[data-online-action="account"]').textContent=profile?.nickname||'Account & Character';}
function gate(){accountLabel();for(const id of ['screen','nav'])document.getElementById(id).inert=!ready||game.blocked();}
function remember(){localStorage.setItem(accountKey()+'_synced',JSON.stringify(game.snapshot()));}
async function publishResults(){
 if(!ready||revision===null||game.busy())return;
 const publishingEpoch=epoch;
 try{const loadoutSignature=JSON.stringify(publicLoadout(game.snapshot()));
 if(loadoutSignature!==lastLoadout){const token=epoch;await backend.publishLoadout(game.snapshot());sessionGuard(token);lastLoadout=loadoutSignature;}}catch(error){if(publishingEpoch!==epoch)return;report(error);}
 if(publishingEpoch!==epoch||!ready||game.key()!==accountKey())return;
 const progress=safeProgress(game.snapshot()),signature=JSON.stringify([progress.deepestCleared,progress.milestones]);
 if(signature===lastPublished)return;
 const token=epoch;await backend.publishTestResults(game.snapshot());sessionGuard(token);lastPublished=signature;
}

function errorText(error){
 const code=String(error?.code||error?.message||'');
 if(code.includes('permission-denied'))return 'Firebase access denied. The project needs the supplied Firestore Rules. Your local save is safe.';
 if(code.includes('unauthorized-domain'))return 'This site is not an authorized Firebase sign-in domain. Ask the owner to authorize it.';
 if(code.includes('popup-blocked'))return 'The sign-in popup was blocked. Allow popups and try again.';
 if(code.includes('popup-closed')||code.includes('cancelled-popup'))return 'Sign-in was cancelled. Please try again.';
 if(code.includes('cloud-conflict'))return 'Another device changed the cloud save. Auto-sync is paused. Review both saves before choosing.';
 if(code.includes('unavailable')||code.includes('network')||code.includes('offline'))return 'Cloud connection unavailable. Progress stays on this device; retry when online.';
 return error?.message||'The operation failed. Your local save has been kept.';
}
function close(){if(!ready&&dialog?.dataset.account)return;const previous=dialog;dialog=null;if(previous){previous.close();previous.remove();}}
function modal(title,content){
 if(dialog)delete dialog.dataset.account;close();dialog=document.createElement('dialog');dialog.className='itemDialog onlineDialog';dialog.setAttribute('aria-labelledby','onlineDialogTitle');
 dialog.innerHTML=`<div class="topline"><h2 id="onlineDialogTitle">${esc(title)}</h2><button data-close aria-label="Close dialog">×</button></div><p class="onlineError" role="alert"></p>${content}`;
 const current=dialog;current.addEventListener('close',()=>{current.remove();if(dialog===current)dialog=null;});current.querySelector('[data-close]').onclick=close;document.body.append(current);current.showModal();return current;
}
function action(selector,fn){const element=dialog?.querySelector(selector);if(!element)return;element.onclick=async()=>{const current=dialog;try{element.disabled=true;current.querySelector('.onlineError').textContent='';await fn();}catch(error){if(current.isConnected)current.querySelector('.onlineError').textContent=errorText(error);status(errorText(error));}finally{if(element.isConnected)element.disabled=false;}};}
function ensureSafeSwitch(allowProtected=false){if(writing)throw new Error('Saving your progress. Please try again in a moment.');if(game.busy())throw new Error('Finish or extract from your expedition before changing accounts or saves.');if(game.blocked()&&!allowProtected)throw new Error('The local save is protected. Reload before switching. Your recovery copies are retained.');}
function sessionGuard(token){if(token!==epoch)throw new Error('The signed-in account changed. Reopen Account before continuing.');}
async function connect(){
 if(!backendPromise)backendPromise=import('./firebase-client.mjs?v=players-pvp-4').then(m=>m.createBackend()).then(b=>{
  backend=b;b.watchAuth(async next=>{
   const previous=user?.uid,token=++epoch;ready=false;gate();clearError();lastPublished='';lastLoadout='';user=next;profile=null;profileState='loading';revision=null;synced='';clearTimeout(timer);timer=null;
   if(previous&&previous!==next?.uid&&!game.busy()&&!game.blocked()){suppress=true;try{game.switchSave(GUEST);}finally{suppress=false;gate();}}
   if(!next){gate();status('Sign in to play');showAccount();return;}
   await restoreProfile(token);
  });return b;
 }).catch(error=>{backendPromise=null;throw error;});
 return backendPromise;
}
async function restoreProfile(token=epoch){
 profileState='loading';showAccount();
 try{
  const p=await backend.profile();sessionGuard(token);profile=p;profileState=p?'found':'missing';
  selectedCharacter=p?.characterId||game.snapshot().characterId||'wanderer';
  if(profile)await resumeAccount();else showAccount();
 }catch(error){
  if(token!==epoch)return;
  if(!profile)profileState='error';
  showAccount();dialog.querySelector('.onlineError').textContent=errorText(error);
 }
}
function characterPicker(){return `<div class="characterPicker">${CHARACTERS.map(c=>`<button type="button" data-character="${c.id}" aria-pressed="${selectedCharacter===c.id}"><img src="${c.fullBody}" alt="${esc(c.name)}"><span>${esc(c.name)}</span></button>`).join('')}</div><p class="small muted">Cosmetic only. No classes or stat bonuses.</p>`;}
function bindCharacters(){dialog.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>{selectedCharacter=b.dataset.character;dialog.querySelectorAll('[data-character]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});}
function showAccount(){
 accountLabel();
 selectedCharacter=profile?.characterId||game.snapshot().characterId||'wanderer';
 const signedIn=!!user,needsProfile=signedIn&&profileState==='missing';
 const content=`<p>${signedIn?`Signed in${profile?' as <b>'+esc(profile.nickname)+'</b>':''}`:'Sign in with Google to play Wanderer.'}</p>
 ${!signedIn?'<button id="googleSignIn" class="primary">Sign in with Google</button>':''}
 ${needsProfile?'<label class="profileField">Unique nickname<input id="nickname" maxlength="20" minlength="3" pattern="[A-Za-z0-9_]{3,20}" autocomplete="username"></label>':''}
 ${signedIn&&profileState==='loading'?'<p role="status">Loading your profile…</p>':''}
 ${signedIn&&profileState==='error'?'<p>Your profile could not be loaded. Please retry; you do not need a new nickname.</p><button id="retryProfile">Retry</button>':''}
 ${profile||needsProfile?characterPicker():''}
 <div class="buttonRow">${needsProfile?'<button id="createProfile" class="primary">Create profile</button>':profile?'<button id="saveCharacter" class="primary">Save character</button>':''}
 ${signedIn&&profile&&!ready?'<button id="retryAccount">Continue</button>':''}
 ${signedIn?'<button id="googleSignOut">Sign out</button>':''}</div>`;
 modal('Account & Character',content).dataset.account='true';dialog.addEventListener('cancel',e=>{if(!ready)e.preventDefault();});dialog.querySelector('[data-close]').hidden=!ready;bindCharacters();
 action('#googleSignIn',async()=>{ensureSafeSwitch();const b=await connect();await b.signIn();});
 action('#createProfile',async()=>{ensureSafeSwitch();const token=epoch;const name=dialog.querySelector('#nickname').value;const p=await backend.createProfile(name,selectedCharacter);sessionGuard(token);profile=p;profileState='found';await resumeAccount();});
 action('#saveCharacter',async()=>{
  if(game.busy())throw new Error('Change your character after the expedition.');
  const token=epoch;
  if(profile){const updated=await backend.updateCharacter(selectedCharacter);sessionGuard(token);profile=updated;if(game.key()===accountKey())game.setCharacter(selectedCharacter);}
  else game.setCharacter(selectedCharacter);
  status(profile?'Character saved to your profile':'Character saved on this device');showAccount();
 });
 action('#retryProfile',()=>restoreProfile());
 action('#retryAccount',resumeAccount);
 action('#googleSignOut',async()=>{ensureSafeSwitch();if(ready&&revision!==null){await syncNow();await publishResults();}await backend.signOut();gate();});
}

function localCandidate(){
 const key=accountKey();if(game.key()===key)return validateSave(game.snapshot());
 const raw=localStorage.getItem(key)||localStorage.getItem(GUEST);
 return validateSave(raw||game.snapshot());
}
async function resumeAccount(){
 ensureSafeSwitch();const token=epoch,remote=await backend.readSave();sessionGuard(token);
 const own=localStorage.getItem(accountKey()),claimed=localStorage.getItem(GUEST+'_claimed');
 let local=localCandidate();const baseline=localStorage.getItem(accountKey()+'_synced');
 const remoteRaw=remote?JSON.stringify(validateSave(remote.payload)):null;
 const localDirty=own&&baseline!==JSON.stringify(local);
 if(remote&&validateSave(remote.payload).maxDungeon<local.maxDungeon)return reviewCloud();
 if(remote&&localDirty&&remoteRaw!==JSON.stringify(local)&&remoteRaw!==baseline)return reviewCloud();
 if(remote&&!own&&!claimed)return reviewCloud();
 let payload=remote&&!localDirty?validateSave(remote.payload):local;
 if(!remote&&!own&&claimed&&claimed!==user.uid){
  // A different account must never inherit the previous player's Guest progress.
  payload=game.newSave();
 }
 payload={...payload,characterId:profile.characterId};
 let record=remote;
 if(!remote||localDirty){game.backup(JSON.stringify(payload),'before-account-migration');record=await backend.writeSave(payload,remote?.revision||0);sessionGuard(token);}
 suppress=true;try{game.switchSave(accountKey(),payload);}finally{suppress=false;}
 revision=record.revision;synced=JSON.stringify(game.snapshot());remember();localStorage.setItem(GUEST+'_claimed',user.uid);ready=true;gate();clearError();close();
 publishResults().catch(report);
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
  revision=record.revision;synced=JSON.stringify(game.snapshot());remember();localStorage.setItem(GUEST+'_claimed',user.uid);ready=true;gate();clearError();close();publishResults().catch(report);
 });
 action('#downloadCloud',async()=>{
  ensureSafeSwitch();sessionGuard(token);const latest=await backend.readSave();sessionGuard(token);
  if(!latest||latest.revision!==remote.revision)throw new Error('cloud-conflict');
  const payload={...validateSave(latest.payload),characterId:profile.characterId};
  suppress=true;try{game.switchSave(accountKey(),payload);}finally{suppress=false;}
  revision=latest.revision;synced=JSON.stringify(game.snapshot());remember();localStorage.setItem(GUEST+'_claimed',user.uid);ready=true;gate();clearError();close();publishResults().catch(report);
 });
}
async function syncNow(){
 if(!user||!profile||revision===null||game.key()!==accountKey())throw new Error('Review local and cloud saves before syncing.');
 if(game.blocked())throw new Error('Local save is protected. Reload to continue. Your recovery copies are retained.');
 if(game.busy()){status('Cloud sync waits until this expedition ends');return;}
 if(writing)return;
 const payload=validateSave(game.snapshot()),raw=JSON.stringify(payload);if(raw===synced){status('Cloud synced · '+profile.nickname);return;}
 const token=epoch;writing=true;status('Saving to cloud…');
 try{const record=await backend.writeSave(payload,revision);sessionGuard(token);revision=record.revision;synced=raw;localStorage.setItem(accountKey()+'_synced',raw);status('Cloud synced · '+profile.nickname);clearError();}
 catch(error){if(token===epoch){if(String(error?.message||error?.code).includes('cloud-conflict'))revision=null;report(error);}throw error;}
 finally{writing=false;if(token===epoch&&revision!==null&&JSON.stringify(game.snapshot())!==synced)queueSync();}
}
function queueSync(){
 if(suppress||!user||!profile||revision===null||game.key()!==accountKey()||game.blocked())return;
 status(game.busy()?'Local save · Cloud sync after expedition':'Local save · Cloud sync pending');
 if(timer)return;timer=setTimeout(()=>{timer=null;syncNow().then(publishResults).catch(error=>{report(error);if(revision===null)reviewCloud().catch(report);});},30000);
}
async function showLeaderboard(metric='deepest',milestone=10){
 modal('Leaderboard',`<form id="playerSearch" class="playerSearch"><label for="playerNickname">Find player by full nickname</label><div class="buttonRow"><input id="playerNickname" placeholder="Nickname" minlength="3" maxlength="20" required autocomplete="off"><button type="submit">Search</button></div></form><div class="filterBar"><label>Ranking<select id="ranking"><option value="deepest">Deepest Dungeon</option><option value="first">First to Clear</option><option value="fastest">Fastest Progression</option></select></label><label>Milestone<select id="milestone">${MILESTONES.map(n=>`<option value="${n}">D${n}</option>`).join('')}</select></label></div><p id="metricDescription" class="small muted"></p><div id="rankingRows" aria-live="polite">Loading…</div>`);
 const current=dialog;current.querySelector('#playerSearch').onsubmit=async event=>{event.preventDefault();const button=current.querySelector('[type=submit]');button.disabled=true;try{if(!user)throw Error('Sign in to find players.');const result=await backend.findPlayer(current.querySelector('#playerNickname').value);if(current.isConnected)showPlayer(result);}catch(error){if(current.isConnected)current.querySelector('.onlineError').textContent=errorText(error);}finally{button.disabled=false;}};current.querySelector('#ranking').value=metric;current.querySelector('#milestone').value=String(milestone);current.querySelector('#milestone').disabled=metric==='deepest';
 current.querySelector('#metricDescription').textContent=metric==='deepest'?'Highest dungeon completed and extracted.':metric==='first'?'First recorded milestone completion.':'Active play time to reach a milestone.';
 current.querySelector('#ranking').onchange=e=>showLeaderboard(e.target.value,Number(current.querySelector('#milestone').value));current.querySelector('#milestone').onchange=e=>showLeaderboard(metric,Number(e.target.value));

 try{const b=await connect();const rows=await b.leaderboard(metric,milestone);if(!current.isConnected)return;
 current.querySelector('#rankingRows').innerHTML=rows.length?`<ol class="rankingList">${rows.map((row,i)=>{const c=character(row.profile.characterId);const detail=metric==='deepest'?`D${row.deepest}`:metric==='first'?`D${milestone} · received ${row.receivedAt?.toDate?row.receivedAt.toDate().toLocaleString():'pending'}`:`D${milestone} · ${Math.floor(row.activeMs/60000)}m ${Math.floor(row.activeMs/1000)%60}s`;return `<li><span>${i+1}</span><img src="${c.avatar}" alt="${esc(c.name)}"><button class="playerLink" data-player="${esc(row.uid)}">${esc(row.profile.nickname)}</button><span>${esc(detail)}</span></li>`}).join('')}</ol>`:'<p>No results yet.</p>';
 current.querySelectorAll('[data-player]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const result=await b.player(button.dataset.player);if(current.isConnected)showPlayer(result);}catch(error){if(current.isConnected)current.querySelector('.onlineError').textContent=errorText(error);}finally{button.disabled=false;}});
 }catch(error){if(current.isConnected){current.querySelector('#rankingRows').textContent='Leaderboard unavailable.';current.querySelector('.onlineError').textContent=errorText(error);}}
}
function showPlayer(player){
 const c=character(player.profile.characterId),own=player.uid===user?.uid;
 const equipment=player.loadout?cleanEquipment(player.loadout.equipment):null;
 modal(player.profile.nickname,`<div class="playerHeading"><img width="64" height="64" src="${c.avatar}" alt="${esc(c.name)}"><p>${esc(c.name)}${player.loadout?' · D'+esc(player.loadout.maxDungeon)+' unlocked':''}</p></div>${equipment?game.inspectLoadout(equipment):'<p>This player has not shared their equipment yet. Their profile updates when they next sign in and sync.</p>'}<section class="arenaPanel"><h3>Practice Arena</h3><p>Fight their last shared equipment. No equipment loss or Gold transfer.</p><p class="small muted">Gold raids are not available yet.</p><button id="practiceAttack" class="primary" ${own||!equipment||!ready?'disabled':''}>${own?'Your profile':'Attack · Practice'}</button></section><button id="backToLeaderboard">Back to leaderboard</button>`);
 action('#backToLeaderboard',()=>showLeaderboard());
 action('#practiceAttack',()=>{
  ensureSafeSwitch();if(!ready||!user||own||!equipment)throw Error('Sign in and choose another player.');
  const result=practiceDuel(game.snapshot().equip,equipment,crypto.getRandomValues(new Uint32Array(1))[0]);
  modal(result.winner==='attacker'?'Victory':result.winner==='defender'?'Defeat':'Draw',`<p>Practice duel against <b>${esc(player.profile.nickname)}</b> · ${result.seconds}s</p><p>Your HP: ${result.remainingHp[0]} · Opponent HP: ${result.remainingHp[1]}</p><p>No Gold transferred. Equipment and saves are unchanged.</p><details><summary>Combat log</summary><ol class="duelLog">${result.events.map(e=>`<li>${e.time}s · ${e.side===0?'You':esc(player.profile.nickname)}: ${esc(e.text)}</li>`).join('')}</ol></details><button id="returnToPlayer">Back to player</button>`);
  action('#returnToPlayer',()=>showPlayer(player));
 });
}
document.querySelector('[data-online-action="account"]').onclick=showAccount;
document.querySelector('[data-online-action="leaderboard"]').onclick=()=>showLeaderboard();
globalThis.addEventListener('wanderer:saved',queueSync);
globalThis.addEventListener('wanderer:conflict',()=>{revision=null;gate();report(new Error('Another tab changed your save. Reload to continue. Your progress has been backed up.'));});
globalThis.addEventListener('online',()=>{if(revision!==null)queueSync();else if(user&&profile)resumeAccount().catch(report);});
let lastTick=performance.now();setInterval(()=>{const now=performance.now(),delta=now-lastTick;lastTick=now;if(ready&&document.visibilityState==='visible'&&document.hasFocus())game.recordActive(delta);},5000);
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();});
// Restore the account automatically; only divergent saves require a choice.
gate();showAccount();connect().catch(error=>{status(errorText(error));dialog.querySelector('.onlineError').textContent=errorText(error);});
