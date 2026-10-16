import {publicLoadout,cleanEquipment} from './public-loadout.mjs';
import {practiceDuel} from './pvp.mjs';
import {CHARACTERS,character,validateSave,recoverInterruptedSave,summary,safeProgress,SAVE_NAMESPACE} from './model.mjs?v=v092-global-reset-1';
const game=globalThis.WandererGame,GUEST='wanderer_browser_proto_v01';
let backendPromise,backend,user=null,profile=null,revision=null,synced='',epoch=0,writing=false,suppress=false,timer=null,dialog=null;
let ready=false,lastPublished='',lastLoadout='',profileState='loading';
let message='Sign in to play',selectedCharacter=game.snapshot().characterId||'wanderer';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const accountKey=()=>user?'wanderer_account_'+user.uid+'_'+SAVE_NAMESPACE:null;
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
 const progress=safeProgress(game.snapshot()),signature=JSON.stringify([progress.attemptId,progress.deepestCleared,progress.milestones[200]||null]);
 if(signature===lastPublished)return;
 const token=epoch;await backend.publishTestResults(game.snapshot());sessionGuard(token);lastPublished=signature;
}

function errorText(error){
 const code=String(error?.code||error?.message||'');
 if(code.includes('permission-denied'))return 'Firebase access denied. The project needs the supplied Firestore Rules. Your local save is safe.';
 if(code.includes('unauthorized-domain'))return 'This site is not an authorized Firebase sign-in domain. Ask the owner to authorize it.';
 if(code.includes('operation-not-allowed'))return 'Guest sign-in is disabled. Enable Anonymous in Firebase Console → Authentication → Sign-in method.';
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
 if(!backendPromise)backendPromise=import('./firebase-client.mjs?v=v092-global-reset-1').then(m=>m.createBackend()).then(b=>{
  backend=b;b.watchAuth(async next=>{
   // Do not reopen Account or gate an in-progress game for a duplicate auth event
   // for the already restored user. Login recovery itself still runs on startup.
   if(next?.uid&&next.uid===user?.uid&&ready&&game.key()===accountKey())return;
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
  // A failed profile refresh must expose Retry even if a previous profile is cached.
  // Never offer a new nickname merely because an existing profile read failed.
  profileState='error';
  showAccount();dialog.querySelector('.onlineError').textContent=errorText(error);
 }
}
function characterPicker(){return `<div class="characterPicker">${CHARACTERS.map(c=>`<button type="button" data-character="${c.id}" aria-pressed="${selectedCharacter===c.id}"><img src="${c.fullBody}" alt="${esc(c.name)}"><span>${esc(c.name)}</span></button>`).join('')}</div><p class="small muted">Cosmetic only. No classes or stat bonuses.</p>`;}
function bindCharacters(){dialog.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>{selectedCharacter=b.dataset.character;dialog.querySelectorAll('[data-character]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});}
function showAccount(){
 accountLabel();
 selectedCharacter=profile?.characterId||game.snapshot().characterId||'wanderer';
 const signedIn=!!user,isGuest=!!user?.isAnonymous,needsProfile=signedIn&&profileState==='missing';
 const content=`<p>${signedIn?`${isGuest?'Guest account':'Signed in'}${profile?' · <b>'+esc(profile.nickname)+'</b>':''}`:'Sign in with Google or play as a guest.'}</p>
 ${!signedIn?'<div class="buttonRow"><button id="googleSignIn" class="primary">Sign in with Google</button><button id="guestSignIn">Play as Guest</button></div><p class="small muted">Guest players can join the leaderboard after choosing a nickname. Keep this browser session to retain access to your guest account.</p>':''}
 ${isGuest?'<p class="small muted guestNotice">Guest account: signing out or clearing browser data may permanently remove access to this nickname and cloud progress.</p>':''}
 ${needsProfile?'<label class="profileField">Unique nickname<input id="nickname" maxlength="20" minlength="3" pattern="[A-Za-z0-9_]{3,20}" autocomplete="username"></label>':''}
 ${signedIn&&profileState==='loading'?'<p role="status">Loading your profile…</p>':''}
 ${signedIn&&profileState==='error'?'<p>Your profile could not be loaded. Please retry; you do not need a new nickname.</p><button id="retryProfile">Retry</button>':''}
 ${profile||needsProfile?characterPicker():''}
 <div class="buttonRow">${needsProfile?'<button id="createProfile" class="primary">Create profile</button>':profile?'<button id="saveCharacter" class="primary">Save character</button>':''}
 ${signedIn&&profile&&!ready?'<button id="retryAccount">Continue</button>':''}
 ${signedIn&&profile&&ready?'<button id="resetProgress" class="danger" type="button">Reset Progress · New Speedrun</button>':''}
 ${signedIn?`<button id="googleSignOut">${isGuest?'Leave guest account':'Sign out'}</button>`:''}</div>`;
 modal('Account & Character',content).dataset.account='true';dialog.addEventListener('cancel',e=>{if(!ready)e.preventDefault();});dialog.querySelector('[data-close]').hidden=!ready;bindCharacters();
 action('#googleSignIn',async()=>{ensureSafeSwitch();const b=await connect();await b.signIn();});
 action('#guestSignIn',async()=>{ensureSafeSwitch();const b=await connect();await b.signInGuest();});
 action('#createProfile',async()=>{ensureSafeSwitch();const token=epoch;const name=dialog.querySelector('#nickname').value;const p=await backend.createProfile(name,selectedCharacter);sessionGuard(token);profile=p;profileState='found';await resumeAccount();});
 action('#saveCharacter',async()=>{
  if(game.busy())throw new Error('Change your character after the expedition.');
  const token=epoch;
  if(profile){const updated=await backend.updateCharacter(selectedCharacter);sessionGuard(token);profile=updated;if(game.key()===accountKey())game.setCharacter(selectedCharacter);}
  else game.setCharacter(selectedCharacter);
  status(profile?'Character saved to your profile':'Character saved on this device');showAccount();
 });
 action('#resetProgress',()=>{
  ensureSafeSwitch();
  if(!ready||!profile||revision===null||game.key()!==accountKey())throw Error('Your account save must be synced before resetting.');
  modal('Start a new D200 speedrun?',`<p><b>All playable progress will be reset:</b> dungeons, equipment, inventory, runes, Gold, Fragments and upgrades.</p><p>Your nickname, cosmetic character and existing Fastest D200 personal best will remain.</p><p class="small muted">Your cloud save will be replaced. Type <b>RESET</b> to confirm. You cannot undo the reset from Account.</p><label>Confirmation<input id="resetConfirmation" autocomplete="off" placeholder="RESET"></label><div class="buttonRow"><button id="cancelReset" class="ghost" type="button">Cancel</button><button id="confirmReset" class="danger" type="button">Reset everything</button></div>`);
  action('#cancelReset',showAccount);
  action('#confirmReset',async()=>{
   if(dialog.querySelector('#resetConfirmation').value.trim()!=='RESET')throw Error('Type RESET exactly to confirm.');
   ensureSafeSwitch();
   const token=epoch,previous=game.snapshot();
   const next={...game.newSave(),characterId:profile.characterId,resetVersion:previous.resetVersion};
   game.backup(JSON.stringify(previous),'before-speedrun-reset');
   const record=await backend.writeSave(next,revision);sessionGuard(token);
   clearTimeout(timer);timer=null;
   suppress=true;
   try{game.switchSave(accountKey(),next);}finally{suppress=false;}
   revision=record.revision;synced=JSON.stringify(game.snapshot());remember();
   lastPublished='';lastLoadout='';ready=true;gate();clearError();close();
   status('New D200 speedrun started · D1');
   publishResults().catch(report);
  });
 });
 action('#retryProfile',()=>restoreProfile());
 action('#retryAccount',resumeAccount);
 action('#googleSignOut',async()=>{
  ensureSafeSwitch();
  if(user?.isAnonymous){
   modal('Leave guest account?', '<p>Guest accounts cannot be recovered after signing out or clearing browser data. Your nickname and cloud save may become inaccessible.</p><div class="buttonRow"><button id="keepGuest">Keep playing</button><button id="confirmLeaveGuest">Leave guest account</button></div>');
   action('#keepGuest',showAccount);
   action('#confirmLeaveGuest',signOutAccount);
   return;
  }
  await signOutAccount();
 });
}

async function signOutAccount(){
 ensureSafeSwitch();
 if(ready&&revision!==null){await syncNow();await publishResults();}
 await backend.signOut();gate();
}
function localCandidate(){
 const key=accountKey();
 const raw=game.key()===key?game.snapshot():localStorage.getItem(key)||game.newSave();
 // Old Guest and account saves never migrate into the v0.9.2 global reset.
 // Preserve the original unsynced save; only the unfinished expedition is abandoned.
 const {save,interrupted}=recoverInterruptedSave(raw);
 if(interrupted)game.backup(typeof raw==='string'?raw:JSON.stringify(raw),'interrupted-run-before-recovery');
 return save;
}
async function readRecoverableCloud(){
 const token=epoch,record=await backend.readSave();sessionGuard(token);if(!record)return null;
 const {save,interrupted}=recoverInterruptedSave(record.payload);
 if(interrupted)game.backup(record.payload,'interrupted-cloud-run-before-recovery');
 return {...record,payload:JSON.stringify(save),originalPayload:record.payload,interrupted};
}
async function resumeAccount(){
 ensureSafeSwitch();const token=epoch,remote=await readRecoverableCloud();sessionGuard(token);
 const own=localStorage.getItem(accountKey());
 let local=localCandidate();const baseline=localStorage.getItem(accountKey()+'_synced');
 const remoteRaw=remote?JSON.stringify(validateSave(remote.payload)):null;
 const localDirty=own&&baseline!==JSON.stringify(local);
 if(remote&&validateSave(remote.payload).maxDungeon<local.maxDungeon)return reviewCloud();
 if(remote&&localDirty&&remoteRaw!==JSON.stringify(local)&&remoteRaw!==baseline)return reviewCloud();
 let payload=remote&&!localDirty?validateSave(remote.payload):local;
 payload={...payload,characterId:profile.characterId};
 let record=remote;
 if(!remote||localDirty||remote.interrupted){game.backup(JSON.stringify(payload),'before-account-migration');record=await backend.writeSave(payload,remote?.revision||0);sessionGuard(token);}
 suppress=true;try{game.switchSave(accountKey(),payload);}finally{suppress=false;}
 revision=record.revision;synced=JSON.stringify(game.snapshot());remember();ready=true;gate();clearError();close();
 publishResults().catch(report);
}
async function reviewCloud(){
 ensureSafeSwitch();if(!profile)throw new Error('Create a profile first.');const token=epoch;
 status('Checking cloud save…');const remote=await readRecoverableCloud();sessionGuard(token);
 const local=localCandidate(),cloud=remote?validateSave(remote.payload):null;
 modal('Choose your save',`<p>Nothing is replaced until you choose. A recovery backup is saved on this device before switching.</p><div class="saveChoices"><section><h3>This device</h3><p>${esc(summary(local))}</p><button id="uploadLocal">Use this device save</button></section><section><h3>Cloud</h3><p>${esc(summary(cloud))}</p><button id="downloadCloud" ${remote?'':'disabled'}>Use cloud save</button></section></div><p class="small muted">${remote?'Choosing this device will replace cloud revision '+remote.revision+'.':'There is no cloud save. Signing in has not erased your local progress.'}</p>`);
 action('#uploadLocal',async()=>{
  ensureSafeSwitch();sessionGuard(token);
  // Re-read in-memory local state: progress can change while the choice dialog is open.
  const payload={...localCandidate(),characterId:profile.characterId};
  game.backup(JSON.stringify(payload),'before-first-upload');if(remote)game.backup(remote.originalPayload||remote.payload,'cloud-before-replace');
  const record=await backend.writeSave(payload,remote?.revision||0);sessionGuard(token);
  suppress=true;try{game.switchSave(accountKey(),payload);}finally{suppress=false;}
  revision=record.revision;synced=JSON.stringify(game.snapshot());remember();ready=true;gate();clearError();close();publishResults().catch(report);
 });
 action('#downloadCloud',async()=>{
  ensureSafeSwitch();sessionGuard(token);const latest=await readRecoverableCloud();sessionGuard(token);
  if(!latest||latest.revision!==remote.revision)throw new Error('cloud-conflict');
  const payload={...validateSave(latest.payload),characterId:profile.characterId};
  const record=latest.interrupted?await backend.writeSave(payload,latest.revision):latest;sessionGuard(token);
  suppress=true;try{game.switchSave(accountKey(),payload);}finally{suppress=false;}
  revision=record.revision;synced=JSON.stringify(game.snapshot());remember();ready=true;gate();clearError();close();publishResults().catch(report);
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
function formatDuration(ms){
 const seconds=Math.floor(Math.max(0,Number(ms)||0)/1000);
 const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),sec=seconds%60;
 return h?h+'h '+String(m).padStart(2,'0')+'m '+String(sec).padStart(2,'0')+'s':m+'m '+String(sec).padStart(2,'0')+'s';
}
async function showLeaderboard(metric='fastest'){
 const mode=['fastest','deepest'].includes(metric)?metric:'fastest';
 modal('Leaderboard',`<form id="playerSearch" class="playerSearch"><label for="playerNickname">Find player by full nickname</label><div class="buttonRow"><input id="playerNickname" placeholder="Nickname" minlength="3" maxlength="20" required autocomplete="off"><button type="submit">Search</button></div></form><div class="filterBar"><label>Ranking<select id="ranking"><option value="fastest">🏁 Fastest D200</option><option value="deepest">Current Progress</option></select></label></div><p id="metricDescription" class="small muted"></p><div id="rankingRows" aria-live="polite">Loading…</div>`);
 const current=dialog;
 current.querySelector('#playerSearch').onsubmit=async event=>{event.preventDefault();const button=current.querySelector('[type=submit]');button.disabled=true;try{if(!user)throw Error('Sign in to find players.');const result=await backend.findPlayer(current.querySelector('#playerNickname').value);if(current.isConnected)showPlayer(result);}catch(error){if(current.isConnected)current.querySelector('.onlineError').textContent=errorText(error);}finally{button.disabled=false;}};
 current.querySelector('#ranking').value=mode;
 current.querySelector('#metricDescription').textContent=mode==='fastest'?'Fastest active play time from a fresh attempt to clearing D200. Your personal best survives progress resets. Community times are not server-verified.':'Highest dungeon completed in each player’s current attempt. Starting a new speedrun resets this to D0.';
 current.querySelector('#ranking').onchange=e=>showLeaderboard(e.target.value);
 try{
  const b=await connect(),rows=await b.leaderboard(mode);
  if(!current.isConnected)return;
  current.querySelector('#rankingRows').innerHTML=rows.length?`<ol class="rankingList">${rows.map((row,i)=>{
   const c=character(row.profile.characterId),level=mode==='fastest'?200:row.deepest;
   const detail=mode==='fastest'?'Personal best · '+formatDuration(row.bestMs):'Current attempt · '+(row.deepest||0)+' cleared';
   const place=['🥇','🥈','🥉'][i]||String(i+1);
   return `<li class="rankEntry"><span class="rankPlace ${i<3?'rankPodium':''}" aria-label="Rank ${i+1}">${place}</span><img src="${c.avatar}" alt="${esc(c.name)}"><div class="rankPlayer"><button class="playerLink" data-player="${esc(row.uid)}">${esc(row.profile.nickname)}</button><span class="small muted rankInfo">${esc(detail)}</span></div><strong class="rankDungeon" aria-label="Dungeon ${level}">D${level}</strong></li>`;
  }).join('')}</ol>`:'<p>No results yet.</p>';
  current.querySelectorAll('[data-player]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const result=await b.player(button.dataset.player);if(current.isConnected)showPlayer(result);}catch(error){if(current.isConnected)current.querySelector('.onlineError').textContent=errorText(error);}finally{button.disabled=false;}});
 }catch(error){if(current.isConnected){current.querySelector('#rankingRows').textContent='Leaderboard unavailable.';current.querySelector('.onlineError').textContent=errorText(error);}}
}
function showPlayer(player){
 const c=character(player.profile.characterId),own=player.uid===user?.uid;
 const equipment=player.loadout?cleanEquipment(player.loadout.equipment):null;
 modal(player.profile.nickname,`<div class="playerHeading"><img width="64" height="64" src="${c.avatar}" alt="${esc(c.name)}"><p>${esc(c.name)}${player.loadout?' · D'+esc(player.loadout.maxDungeon)+' unlocked':''}</p></div>${equipment?game.inspectLoadout(equipment,player.loadout.runes||[],player.loadout.runeSlots||[]):'<p>This player has not shared their equipment yet. Their profile updates when they next sign in and sync.</p>'}<section class="arenaPanel"><h3>Practice Arena</h3><p>Fight their last shared equipment. No equipment loss or Gold transfer.</p><p class="small muted">Gold raids are not available yet.</p><button id="practiceAttack" class="primary" ${own||!equipment||!ready?'disabled':''}>${own?'Your profile':'Attack · Practice'}</button></section><button id="backToLeaderboard">Back to leaderboard</button>`);
 action('#backToLeaderboard',()=>showLeaderboard());
 action('#practiceAttack',()=>{
  ensureSafeSwitch();if(!ready||!user||own||!equipment)throw Error('Sign in and choose another player.');
  const mine=publicLoadout(game.snapshot());const theirs=player.loadout;const result=practiceDuel(mine.equipment,equipment,crypto.getRandomValues(new Uint32Array(1))[0],mine.runes,mine.runeSlots,theirs.runes||[],theirs.runeSlots||[]);
  modal(result.winner==='attacker'?'Victory':result.winner==='defender'?'Defeat':'Draw',`<p>Practice duel against <b>${esc(player.profile.nickname)}</b> · ${result.seconds}s</p><p>Your HP: ${result.remainingHp[0]} · Opponent HP: ${result.remainingHp[1]}</p><p>No Gold transferred. Equipment and saves are unchanged.</p><details><summary>Combat log</summary><ol class="duelLog">${result.events.map(e=>`<li>${e.time}s · ${e.side===0?'You':esc(player.profile.nickname)}: ${esc(e.text)}</li>`).join('')}</ol></details><button id="returnToPlayer">Back to player</button>`);
  action('#returnToPlayer',()=>showPlayer(player));
 });
}

function showFeedback(){
 if(!ready||!user||!profile){alert('Sign in before sending playtest feedback.');return;}
 if(game.busy()){alert('Finish or extract from your expedition before opening Feedback.');return;}
 const current=modal('Playtest Feedback',`
 <p class="small muted">Your feedback helps improve Wanderer. Bug reports, ideas and criticism are welcome. Your nickname and dungeon progress will be attached. Please do not include personal information.</p>
 <form id="feedbackForm" class="feedbackForm">
 <div class="feedbackPair">
  <label>Type<select name="category" required><option value="general">General feedback</option><option value="bug">Bug / technical issue</option><option value="idea">Idea / suggestion</option><option value="balance">Balance / gameplay</option></select></label>
  <label>Fun rating<select name="rating"><option value="0">Prefer not to rate</option><option value="5">5 — Very fun</option><option value="4">4 — Fun</option><option value="3">3 — Okay</option><option value="2">2 — Not much fun</option><option value="1">1 — Not fun</option></select></label>
 </div>
 <div class="feedbackPair">
  <label>Combat<select name="combat"><option value="not-sure">Not sure yet</option><option value="great">Enjoyable</option><option value="okay">Okay</option><option value="repetitive">Too repetitive</option><option value="confusing">Confusing</option></select></label>
  <label>Difficulty<select name="difficulty"><option value="not-sure">Not sure yet</option><option value="easy">Too easy</option><option value="balanced">Balanced</option><option value="hard">Too difficult</option></select></label>
 </div>
 <label>What did you enjoy?<textarea name="likes" maxlength="500" rows="2" placeholder="Loot, builds, bosses, progression…"></textarea></label>
 <label>What bothered you or did not work?<textarea name="problems" maxlength="1500" rows="3" placeholder="Bugs, frustration, balance, confusing UI…"></textarea></label>
 <label>Ideas or improvements<textarea name="ideas" maxlength="1200" rows="3" placeholder="What would make you want to play again?"></textarea></label>
 <p class="small muted">Please write at least 10 characters across the text fields. No screenshots or email address required.</p>
 <div class="buttonRow"><button type="submit" class="primary" id="sendFeedback">Send Feedback</button></div>
 </form>`);
 const form=current.querySelector('#feedbackForm'),send=current.querySelector('#sendFeedback');
 form.onsubmit=async event=>{
  event.preventDefault();if(!current.isConnected)return;
  const values=new FormData(form),snapshot=game.snapshot();
  const payload={category:String(values.get('category')||'general'),rating:Number(values.get('rating')||0),
   combat:String(values.get('combat')||'not-sure'),difficulty:String(values.get('difficulty')||'not-sure'),
   likes:String(values.get('likes')||'').trim(),problems:String(values.get('problems')||'').trim(),
   ideas:String(values.get('ideas')||'').trim(),maxDungeon:snapshot.maxDungeon,characterId:snapshot.characterId};
  const errorBox=current.querySelector('.onlineError');
  if([payload.likes,payload.problems,payload.ideas].join(' ').trim().length<10){
   errorBox.textContent='Please tell us a little more (at least 10 characters).';return;
  }
  if(game.busy()){errorBox.textContent='Finish the current expedition before sending feedback.';return;}
  send.disabled=true;errorBox.textContent='';
  try{
   const b=await connect();await b.submitFeedback(payload);
   if(!current.isConnected)return;
   form.replaceWith(document.createRange().createContextualFragment('<div class="feedbackThanks"><h3>Thank you for helping Wanderer!</h3><p>Your feedback was received. You can close this window and continue playing.</p><button type="button" id="feedbackDone" class="primary">Done</button></div>'));
   current.querySelector('#feedbackDone').onclick=close;
  }catch(error){if(current.isConnected)errorBox.textContent=errorText(error);}
  finally{if(send.isConnected)send.disabled=false;}
 };
}

document.querySelector('[data-online-action="feedback"]').onclick=showFeedback;
document.querySelector('[data-online-action="account"]').onclick=showAccount;
document.querySelector('[data-online-action="leaderboard"]').onclick=()=>showLeaderboard();
globalThis.addEventListener('wanderer:saved',queueSync);
globalThis.addEventListener('wanderer:conflict',()=>{revision=null;gate();report(new Error('Another tab changed your save. Reload to continue. Your progress has been backed up.'));});
globalThis.addEventListener('online',()=>{if(revision!==null)queueSync();else if(user&&profile)resumeAccount().catch(report);});
let lastTick=performance.now();setInterval(()=>{const now=performance.now(),delta=now-lastTick;lastTick=now;if(ready&&document.visibilityState==='visible'&&document.hasFocus())game.recordActive(delta);},5000);
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();});
// Restore the account automatically; only divergent saves require a choice.
gate();showAccount();connect().catch(error=>{status(errorText(error));dialog.querySelector('.onlineError').textContent=errorText(error);});
