import {createBackend} from './firebase-client.mjs?v=v012-production-auth-1';
import {createCloudSaveCoordinator} from './v012-cloud-save.mjs';

const requiresGate=(!['localhost','127.0.0.1'].includes(location.hostname)&&!location.hostname.endsWith('.test'))||new URLSearchParams(location.search).get('testAuthGate')==='1';
if(requiresGate){
const actions=[...document.querySelectorAll('[data-online-action="account"]')];
const gameRoot=document.querySelector('.container');
let backend=null,coordinator=null,activeUid=null,loading=null,profileName='',authSeen=false,mode='login';
let gate=null,dialog=null;
const $=(selector,root=document)=>root.querySelector(selector);
const friendly=error=>{
 const code=String(error?.code||'');
 if(code==='auth/email-already-in-use')return 'This email already has an account. Choose Sign in.';
 if(code==='auth/invalid-credential'||code==='auth/wrong-password'||code==='auth/user-not-found')return 'Email or password is incorrect.';
 if(code==='auth/popup-closed-by-user')return 'The Google sign-in window was closed.';
 if(code==='auth/unauthorized-domain')return 'This domain is not authorized in Firebase Authentication.';
 if(code==='auth/network-request-failed')return 'Unable to connect. Check your connection and try again.';
 if(code==='permission-denied'||code==='auth/operation-not-allowed')return 'This account action is not enabled in Firebase. Contact the game administrator.';
 return String(error?.message||'Could not connect your account.');
};
function saveState(value){
 const node=$('#v012SaveStatus');
 if(node){node.textContent=({saving:'Saving…',saved:'Cloud saved',error:'Save error — progress not confirmed',conflict:'Save conflict'})[value]||'';node.dataset.state=value;}
 const line=$('[data-account-save-status]',dialog||document);if(line)line.textContent=node?.textContent||'';
 if(value==='error'||value==='conflict'){lock();gateStep('login');notify('Cloud save was not confirmed. Reconnect or reload before continuing. Unsynced progress is held only in this browser session.',true);}
}
function paintName(){
 const name=profileName||'Wanderer';
 globalThis.WandererNickname=name;
 for(const element of document.querySelectorAll('.phase3CampAccountName,#heroName,.phase3CharacterSummary'))element.textContent=name;
}
function lock(){if(gameRoot)gameRoot.inert=true;document.body.classList.add('v012AuthLocked');}
function unlock(){if(gameRoot)gameRoot.inert=false;document.body.classList.remove('v012AuthLocked');gate?.remove();gate=null;paintName();}
function notify(message,isError=false){const el=$('[data-auth-message]',gate||dialog||document);if(el){el.textContent=message;el.dataset.error=String(isError);}}
function makeGate(){
 lock();if(gate)return gate;
 gate=document.createElement('section');gate.id='v012AuthGate';gate.className='v012AuthGate';gate.setAttribute('aria-label','Wanderer login');
 gate.innerHTML=`
  <div class="v012GateShade"></div>
  <div class="v012GateContent">
   <h1 class="a11yVisuallyHidden">Wanderer</h1>
   <div class="v012GateAuthPanel">
    <p class="v012GateEyebrow">WANDERER · v0.12</p>
    <h2>Enter the world</h2>
    <p data-auth-message role="status" aria-live="polite">Connecting to your account…</p>
    <div data-auth-login>
     <button type="button" class="primary v012GateGoogle" data-auth-google>Continue with Google</button>
     <div class="v012GateDivider">or use your email</div>
     <form data-auth-form>
      <label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" maxlength="128" required></label>
      <button class="primary" type="submit" data-auth-submit>Sign in</button>
     </form>
     <div class="v012GateLinks">
      <button type="button" data-auth-mode>New account</button>
      <button type="button" data-auth-reset>Forgot password?</button>
     </div>
    </div>
    <div data-auth-verify hidden>
      <p>Confirm your email using the link we sent you before playing.</p>
      <button type="button" data-auth-refresh>I've verified my email</button>
      <button type="button" data-auth-resend>Resend verification</button>
      <button type="button" data-auth-exit>Use another account</button>
    </div>
    <form data-auth-nickname hidden>
      <p>Choose the name displayed in Camp, Combat and the Leaderboard.</p>
      <label>Nickname<input name="nickname" autocomplete="nickname" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" required placeholder="3–20 letters, numbers or _"></label>
      <button class="primary" type="submit">Create character</button>
    </form>
   </div>
  </div>`;
 document.body.append(gate);
 const form=$('[data-auth-form]',gate),submit=$('[data-auth-submit]',gate);
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity()||!backend)return;
  const email=form.elements.email.value.trim(),password=form.elements.password.value;
  submit.disabled=true;notify(mode==='register'?'Creating your account…':'Signing in…');
  try{if(mode==='register')await backend.createEmailAccount(email,password);else await backend.signInWithEmail(email,password);}
  catch(error){notify(friendly(error),true);}
  finally{submit.disabled=false;}
 });
 $('[data-auth-google]',gate).onclick=async()=>{if(!backend)return;notify('Opening Google sign-in…');try{await backend.signIn();}catch(error){notify(friendly(error),true);}};
 $('[data-auth-mode]',gate).onclick=()=>{mode=mode==='login'?'register':'login';submit.textContent=mode==='register'?'Create account':'Sign in';$('[data-auth-mode]',gate).textContent=mode==='register'?'I already have an account':'New account';form.elements.password.autocomplete=mode==='register'?'new-password':'current-password';notify(mode==='register'?'Use a valid email address so you can confirm your account.':'Sign in to resume your cloud progression.');};
 $('[data-auth-reset]',gate).onclick=async()=>{const email=form.elements.email.value.trim();if(!email){notify('Enter your email address first.',true);return;}try{await backend.sendPasswordReset(email);notify('If the address is registered, a password reset email has been sent.');}catch(error){notify(friendly(error),true);}};
 $('[data-auth-refresh]',gate).onclick=async()=>{try{const u=await backend.refreshVerification();await activate(u);}catch(error){notify(friendly(error),true);}};
 $('[data-auth-resend]',gate).onclick=async()=>{try{await backend.resendVerification();notify('Verification email sent. Check your inbox.');}catch(error){notify(friendly(error),true);}};
 $('[data-auth-exit]',gate).onclick=async()=>{try{await backend.signOut();}catch(error){notify(friendly(error),true);}};
 $('[data-auth-nickname]',gate).onsubmit=async event=>{
  event.preventDefault();const f=event.currentTarget;if(!f.reportValidity())return;
  const button=f.querySelector('button');button.disabled=true;notify('Creating your character…');
  try{await backend.createProfile(f.elements.nickname.value,globalThis.WandererGame?.state?.characterId||'wanderer');await activate(backend.currentUser());}
  catch(error){notify(friendly(error),true);}
  finally{button.disabled=false;}
 };
 return gate;
}
function gateStep(step){
 makeGate();
 $('[data-auth-login]',gate).hidden=step!=='login';
 $('[data-auth-verify]',gate).hidden=step!=='verify';
 $('[data-auth-nickname]',gate).hidden=step!=='nickname';
}
function setAccountDialog(){
 if(!dialog)return;
 const user=backend?.currentUser();
 $('[data-account-identity]',dialog).textContent=profileName||'Not connected';
 $('[data-account-email]',dialog).textContent=user?.email||'';
 $('[data-account-uid]',dialog).textContent=user?'Account ID: '+user.uid.slice(0,12)+'…':'';
 $('[data-account-save-status]',dialog).textContent=$('#v012SaveStatus')?.textContent||'';
}
function accountDialog(){
 if(!backend?.currentUser()||!activeUid){gateStep('login');return;}
 if(dialog){dialog.showModal();setAccountDialog();return;}
 dialog=document.createElement('dialog');dialog.className='itemDialog onlineDialog v012AccountDialog';
 dialog.innerHTML='<h2>Account</h2><p><strong data-account-identity></strong></p><p data-account-email></p><p class="small muted" data-account-uid></p><p data-account-save-status role="status" aria-live="polite"></p><p>Your character and Expedition progress are saved to your Firebase account. No Guest account or browser save is used.</p><p data-auth-message role="status"></p><div class="buttonRow"><button type="button" data-account-export>Export unsynced recovery</button><button type="button" data-account-reload>Reload cloud save</button><button type="button" data-account-logout>Sign out</button><button type="button" data-account-close>Close</button></div>';
 document.body.append(dialog);setAccountDialog();
 $('[data-account-export]',dialog).onclick=()=>{try{const payload=coordinator.exportRecovery(),url=URL.createObjectURL(new Blob([payload],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='wanderer-recovery.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){notify(friendly(error),true);}};
 $('[data-account-reload]',dialog).onclick=async()=>{if(!confirm('Reload the current cloud save? Any unsynced changes in this browser session will be lost.'))return;try{await coordinator.reloadCloud();notify('Cloud save restored.');}catch(error){notify(friendly(error),true);}};
 $('[data-account-logout]',dialog).onclick=async()=>{try{await coordinator?.close();dialog.close();lock();await backend.signOut();location.reload();}catch(error){notify('Could not sign out until the cloud save is confirmed: '+friendly(error),true);}};
 $('[data-account-close]',dialog).onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{dialog.remove();dialog=null;});
 dialog.showModal();
}
async function activate(user){
 authSeen=true;
 if(user?.isAnonymous){lock();gateStep('login');notify('Guest accounts are not supported. Sign in with Google or email.');await backend.signOut();return;}
 if(!user){lock();activeUid=null;profileName='';coordinator=null;gateStep('login');notify('Sign in to play. Your progress is saved only in the cloud.');return;}
 lock();
 if(!user.emailVerified&&user.providerData?.some(x=>x.providerId==='password')){gateStep('verify');notify('Verify your email to continue.');return;}
 if(activeUid===user.uid&&coordinator){unlock();return;}
 if(loading)return loading;
 loading=(async()=>{
  try{
   gateStep('login');notify('Loading your cloud save…');
   const game=globalThis.WandererGame;
   if(!game?.newSave||!game?.cloudSnapshot||!game?.restoreCloudSave)throw Error('Game initialization failed. Refresh the page.');
   const profile=await backend.profile();
   if(backend.currentUser()?.uid!==user.uid)return;
   if(!profile?.nickname){gateStep('nickname');notify('Choose a nickname to continue.');return;}
   profileName=profile.nickname;paintName();
   const next=createCloudSaveCoordinator({backend,uid:user.uid,projectId:backend.projectId,readSnapshot:()=>game.cloudSnapshot(),applySnapshot:save=>game.restoreCloudSave(save),onStatus:saveState});
   const fresh=globalThis.WandererV012Save.create(game.newSave(),{binding:user.uid,identity:{uid:user.uid,projectId:backend.projectId,nickname:profile.nickname}});
   const loaded=await next.initialize(fresh);
   if(backend.currentUser()?.uid!==user.uid){await next.close();return;}
   coordinator=next;game.restoreCloudSave(loaded);game.attachCloudSave(next);activeUid=user.uid;
   unlock();setAccountDialog();
  }catch(error){saveState('error');gateStep('login');notify(friendly(error),true);}
  finally{loading=null;}
 })();return loading;
}
makeGate();
if(!actions.length)notify('Account controls are unavailable on this page.',true);
else {
 for(const action of actions)action.addEventListener('click',event=>{event.preventDefault();accountDialog();});
 createBackend().then(value=>{backend=value;backend.watchAuth(user=>{activate(user).catch(error=>{gateStep('login');notify(friendly(error),true);});});}).catch(error=>{gateStep('login');notify('Firebase is unavailable: '+friendly(error),true);});
}

}
