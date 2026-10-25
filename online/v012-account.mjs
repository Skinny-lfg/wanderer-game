import {createBackend} from './firebase-client.mjs?v=v012-production-auth-1';
import {createCloudSaveCoordinator} from './v012-cloud-save.mjs';
const buttons=[...document.querySelectorAll('[data-online-action="account"]')];
const localOnly=new URLSearchParams(location.search).get('expeditionSave')==='1';
let backend,coordinator,initializedUid=null,initializing=null;
function setSaveStatus(value){
 let node=document.getElementById('v012SaveStatus');
 if(!node){node=document.createElement('span');node.id='v012SaveStatus';node.className='tiny v012CloudSaveStatus';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.getElementById('onlineBar')?.append(node);}
 node.textContent=({saving:'Saving…',saved:'Saved',error:'Save Error — cloud confirmation pending'})[value]||'';node.dataset.state=value;
 const dialog=document.querySelector('.v012AccountDialog'),panel=dialog?.querySelector('[data-save-conflict]');
 if(panel){panel.hidden=value!=='conflict';dialog.querySelector('[data-use-cloud]').disabled=!dialog.querySelector('[data-confirm-cloud]').checked;}
 const detail=dialog?.querySelector('[data-account-save-status]');if(detail)detail.textContent=value==='conflict'?'Cloud and local saves differ. Export the recovery copy before choosing the cloud copy.':node.textContent;
}
function updateDialog(user,message){const d=document.querySelector('.v012AccountDialog');if(!d)return;const status=d.querySelector('#v012AccountStatus');if(message){status.textContent=message;return;}if(!user){status.textContent='Not signed in. Choose Google, email, or Guest.';d.querySelector('[data-logout]').hidden=true;d.querySelector('[data-link-google]').hidden=true;return;}d.querySelector('[data-logout]').hidden=false;d.querySelector('[data-link-google]').hidden=!user.isAnonymous;status.textContent=user.isAnonymous?'Guest account — link Google to protect this identity.':'Signed in'+(user.email?': '+user.email:'')+'.';}
async function activate(user){
 updateDialog(user);
 if(coordinator&&initializedUid!==(user?.uid||null)){
  const old=coordinator;coordinator=null;initializedUid=null;globalThis.WandererGame?.attachCloudSave(null);
  try{await old.close();}catch(error){setSaveStatus('error');console.error('Pending cloud save retained for previous UID',error);}
 }
 if(!user||localOnly||initializedUid===user.uid)return;
 if(initializing)return initializing;
 initializing=(async()=>{
  try{
   const game=globalThis.WandererGame;if(!game?.snapshot||!game?.newSave)throw Error('Game save interface is unavailable. Reload and try again.');
   const next=createCloudSaveCoordinator({backend,uid:user.uid,projectId:backend.projectId,readSnapshot:()=>game.cloudSnapshot(),applySnapshot:save=>game.restoreCloudSave(save),onStatus:setSaveStatus});coordinator=next;
   const profile=await backend.profile().catch(error=>{if(error?.message==='network-profile-unconfirmed')throw error;return null;});
   if(profile?.nickname)globalThis.WandererNickname=profile.nickname;
   const identity=profile?.nickname?{uid:user.uid,projectId:backend.projectId,nickname:profile.nickname}:null;
   const fresh=globalThis.WandererV012Save.create(game.newSave(),{binding:user.uid,identity});
   const loaded=await next.initialize(fresh);if(backend.currentUser()?.uid!==user.uid){await next.close();return;}
   coordinator=next;game.restoreCloudSave(loaded);game.attachCloudSave(next);initializedUid=user.uid;updateDialog(user,'Account connected. v0.12 progress is synced.');
  }catch(error){setSaveStatus('error');updateDialog(user,human(error));}
  finally{initializing=null;}
 })();return initializing;
}
async function open(){
 const old=document.querySelector('.v012AccountDialog');if(old){old.showModal();updateDialog(backend?.currentUser());return;}
 const dialog=document.createElement('dialog');dialog.className='itemDialog onlineDialog v012AccountDialog';dialog.innerHTML='<h2>Account &amp; Character</h2><p id="v012AccountStatus" role="status" aria-live="polite">Connecting…</p><p data-account-save-status role="status" aria-live="polite"></p><div data-save-conflict hidden><p>Your local recovery copy is retained on this device. Export it before choosing the current cloud save.</p><button type="button" data-export-recovery>Download recovery copy</button><label><input type="checkbox" data-confirm-cloud> I saved the recovery file and understand that choosing Cloud will discard this device’s pending copy.</label><button type="button" data-use-cloud disabled>Load current cloud save</button></div><form id="v012AuthForm"><label>Email <input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Password <input name="password" type="password" autocomplete="current-password" minlength="6" maxlength="128" required></label><button type="submit">Sign in / create account</button></form><div class="buttonRow"><button type="button" data-guest>Continue as Guest</button><button type="button" data-google>Sign in with Google</button><button type="button" data-link-google hidden>Link Guest to Google</button><button type="button" data-logout hidden>Sign out</button><button type="button" data-close>Close</button></div></dialog>';document.body.append(dialog);dialog.showModal();
 const status=dialog.querySelector('#v012AccountStatus'),form=dialog.querySelector('form'),fail=error=>{status.textContent=human(error);status.dataset.state='error';};
 updateDialog(backend?.currentUser());
 dialog.querySelector('[data-guest]').onclick=async()=>{try{await backend.signInGuest();}catch(error){fail(error);}};
 const google=async()=>{try{if(backend.currentUser()?.isAnonymous)await backend.linkGoogle();else await backend.signIn();}catch(error){fail(error);}};
 dialog.querySelector('[data-google]').onclick=google;dialog.querySelector('[data-link-google]').onclick=google;
 dialog.querySelector('[data-confirm-cloud]').onchange=event=>{dialog.querySelector('[data-use-cloud]').disabled=!event.target.checked;};
 dialog.querySelector('[data-export-recovery]').onclick=()=>{try{if(!coordinator)throw Error('Cloud recovery is unavailable.');const blob=new Blob([coordinator.exportRecovery()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wanderer-v012-local-recovery.json';a.click();URL.revokeObjectURL(url);}catch(error){fail(error);}};
 dialog.querySelector('[data-use-cloud]').onclick=async()=>{if(!dialog.querySelector('[data-confirm-cloud]').checked)return;try{await coordinator.reloadCloud();initializedUid=backend.currentUser()?.uid||null;dialog.querySelector('[data-confirm-cloud]').checked=false;dialog.querySelector('[data-save-conflict]').hidden=true;updateDialog(backend.currentUser(),'Loaded the current cloud save.');}catch(error){fail(error);}};
 form.onsubmit=async event=>{event.preventDefault();try{const email=form.elements.email.value.trim(),password=form.elements.password.value,current=backend.currentUser();if(current?.isAnonymous)await backend.linkEmail(email,password);else{try{await backend.signInWithEmail(email,password);}catch(error){if(error?.code!=='auth/invalid-credential'&&error?.code!=='auth/user-not-found')throw error;await backend.createEmailAccount(email,password);}}}catch(error){fail(error);}};
 dialog.querySelector('[data-logout]').onclick=async()=>{try{await coordinator?.close();coordinator=null;initializedUid=null;await backend.signOut();location.reload();}catch(error){fail(error);}};
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{coordinator?.flush().catch(()=>{});dialog.remove();});
}
if(!localOnly&&buttons.length){
 createBackend().then(value=>{backend=value;backend.watchAuth(user=>activate(user).catch(error=>{setSaveStatus('error');updateDialog(user,human(error));}));}).catch(error=>{setSaveStatus('error');console.error('Firebase initialization failed',error);});
 for(const button of buttons)button.addEventListener('click',event=>{event.preventDefault();const bar=document.getElementById('onlineBar'),menu=document.getElementById('menuToggle');bar?.classList.remove('menuOpen');menu?.setAttribute('aria-expanded','false');open().catch(error=>console.error('Account UI failed',error));});
}
function human(error){const code=error?.code;if(code==='auth/credential-already-in-use'||code==='auth/email-already-in-use')return 'That credential belongs to an existing account. Sign in to that account first; Guest progress was not merged or replaced.';if(code==='auth/invalid-credential'||code==='auth/wrong-password')return 'Email or password was not accepted.';if(code==='auth/popup-closed-by-user')return 'Sign-in window closed before completion.';if(code==='auth/network-request-failed')return 'Network unavailable. Reconnect and retry.';return String(error?.message||'Account operation failed.');}
