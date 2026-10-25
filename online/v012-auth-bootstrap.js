/* Lightweight, dependency-free production login bootstrap.
 * Ensures Firebase/module load errors never strand players on the image splash.
 * Does not authenticate users or reveal the game; authentication remains enforced
 * by the real account module and Firestore security rules.
 */
(()=>{
 const host=String(globalThis.location?.hostname||'');
 if(['','localhost','127.0.0.1'].includes(host)||host.endsWith('.test'))return;
 const shell=document.createElement('section');
 shell.id='v012AuthBootstrap';
 shell.className='v012AuthGate';
 shell.setAttribute('aria-label','Wanderer account loading');
 shell.innerHTML=`
 <div class="v012GateShade"></div>
 <div class="v012GateContent">
   <div class="v012GateAuthPanel" role="status" aria-live="polite">
     <p class="v012GateEyebrow">WANDERER · v0.12</p>
     <h2>Enter the world</h2>
     <p data-bootstrap-status>Preparing secure sign-in…</p>
     <button type="button" class="primary v012GateGoogle" data-bootstrap-retry hidden>Reload sign-in</button>
   </div>
 </div>`;
 document.body.append(shell);
 const status=shell.querySelector('[data-bootstrap-status]');
 const retry=shell.querySelector('[data-bootstrap-retry]');
 retry.addEventListener('click',()=>location.reload());
 let complete=false;
 const failed=error=>{
  if(complete)return;
  const reason=String(error?.message||error||'unknown load error');
  console.error('[Wanderer login] Failed to load:',error);
  status.textContent='Unable to load sign-in. Please reload. If it persists, check that JavaScript and the Firebase domain are allowed. ('+reason.slice(0,140)+')';
  retry.hidden=false;
 };
 globalThis.WandererLoginFailed=failed;
 globalThis.WandererLoginLoaded=()=>{
  complete=true;
  document.body.classList.remove('v012Preboot');
  shell.remove();
 };
 // A missing or cached module should never create an endless loading screen.
 setTimeout(()=>{if(!complete)failed(new Error('Sign-in module did not finish loading'));},9000);
})();
