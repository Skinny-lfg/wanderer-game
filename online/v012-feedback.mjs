/* Player feedback / bug reports for the v0.12 preview.
   Read-only gameplay context; Firebase feedbackInbox is separate from saves.
   Do not treat a local copy as a submitted report. */
import {createBackend} from './firebase-client.mjs';
const button=document.querySelector('[data-online-action="feedback"]');
const timeKey='wanderer-feedback-last-sent-v012';
let backendPromise=null;
const getBackend=()=>backendPromise??=(createBackend().catch(error=>{backendPromise=null;throw error;}));
function context(){
 try{return typeof globalThis.WandererFeedbackContext==='function'?globalThis.WandererFeedbackContext():{};}
 catch{return {};}
}
function copyText(form,ctx){
 return ['WANDERER FEEDBACK','Type: '+form.elements.category.value,'Description: '+form.elements.description.value,
   'Steps / suggestion: '+form.elements.steps.value,'Version: '+(ctx.appVersion||'0.12.0'),
   'Screen: '+(ctx.screen||'unknown'),'Dungeon: '+(ctx.maxDungeon||'unknown'),
   'Character: '+(ctx.characterId||'unknown'),form.elements.browser.checked?'Browser: '+navigator.userAgent:''].filter(Boolean).join('\n');
}
function openFeedback(){
 const bar=document.getElementById('onlineBar'),menu=document.getElementById('menuToggle');
 bar?.classList.remove('menuOpen');menu?.setAttribute('aria-expanded','false');
 const existing=document.querySelector('dialog.wandererFeedbackDialog');
 if(existing){existing.focus();return;}
 const previous=document.activeElement;
 const dialog=document.createElement('dialog');
 dialog.className='itemDialog onlineDialog wandererFeedbackDialog';
 dialog.setAttribute('aria-labelledby','wandererFeedbackTitle');
 dialog.innerHTML=`
 <h2 id="wandererFeedbackTitle">Feedback &amp; Bug Report</h2>
 <p class="feedbackIntro">Help improve Wanderer. Reports are private and do not change your character or save.</p>
 <form class="feedbackForm" id="wandererFeedbackForm">
  <label>Report type
   <select name="category" required>
    <option value="bug">Report a bug</option>
    <option value="idea">Suggestion</option>
    <option value="balance">Balance feedback</option>
    <option value="general">General feedback</option>
   </select>
  </label>
  <label>Description <textarea name="description" required minlength="10" maxlength="1400" rows="4" placeholder="What happened, or what would you change?"></textarea></label>
  <label>Steps to reproduce / additional details (optional)
    <textarea id="wandererReportSteps" name="steps" maxlength="1150" rows="2" placeholder="Where did it happen? What did you do first?"></textarea>
  </label>
  <label>Nickname (only if you have not created a Firebase profile)
   <input type="text" name="nickname" autocomplete="nickname" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" placeholder="3–20 letters, numbers or _"></label>
  <label class="feedbackPrivacy"><input type="checkbox" name="browser" checked>Include browser information to help diagnose bugs</label>
  <p class="feedbackNotice">Sending requires Google sign-in and a player profile. If the service is not ready, use “Copy report”.</p>
  <p class="feedbackNotice" id="wandererFeedbackStatus" role="status" aria-live="polite"></p>
  <div class="feedbackActions">
   <button type="button" class="ghost" data-copy-feedback>Copy report</button>
   <button type="button" data-close-feedback>Close</button>
   <button type="submit" class="primary" data-send-feedback>Send report</button>
  </div>
 </form>`;
 document.body.appendChild(dialog);
 const form=dialog.querySelector('form'),status=dialog.querySelector('#wandererFeedbackStatus'),
   send=dialog.querySelector('[data-send-feedback]'),copy=dialog.querySelector('[data-copy-feedback]');
 const message=(str,type)=>{status.textContent=str;status.dataset.status=type||'';};
 const setBusy=value=>{send.disabled=value;send.textContent=value?'Sending…':'Send report';};
 dialog.addEventListener('close',()=>{dialog.remove();previous?.isConnected&&previous.focus();});
 dialog.querySelector('[data-close-feedback]').addEventListener('click',()=>dialog.close());
 copy.addEventListener('click',async ()=>{
  const report=copyText(form,context());
  try{await navigator.clipboard.writeText(report);message('Report copied. It has NOT been submitted.','success');}
  catch{message('Clipboard not available. Select and copy the description manually.','error');}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(send.disabled||!form.reportValidity())return;
  const desc=form.elements.description.value.trim(),steps=form.elements.steps.value.trim();
  if(desc.length<10){message('Please write at least 10 characters.','error');return;}
  // A client-side cooldown reduces accidental duplicate submissions; server protections still apply.
  try{if(Date.now()-Number(localStorage.getItem(timeKey)||0)<60000){message('Please wait one minute between reports.','error');return;}}catch{}
  setBusy(true);message('Connecting to the report service…');
  try{
   const backend=await getBackend();
   const currentUser=await new Promise((resolve,reject)=>{
    let unsubscribe=()=>{};
    unsubscribe=backend.watchAuth(user=>{unsubscribe();resolve(user);});
   });
   if(!currentUser)await backend.signIn();
   let profile=await backend.profile();
   if(!profile){
    const name=form.elements.nickname.value.trim();
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(name)){message('New account: enter a 3–20 character nickname, then send again.','error');return;}
    profile=await backend.createProfile(name.toLowerCase(),context().characterId||'wanderer');
   }
   const ctx=context();
   const browserDetails=form.elements.browser.checked?'Browser: '+navigator.userAgent.slice(0,260):'';
   const info=['Version: '+(ctx.appVersion||'0.12.0'),'Screen: '+(ctx.screen||'unknown'),browserDetails].filter(Boolean).join(' | ').slice(0,500);
   await backend.submitFeedback({
    category:form.elements.category.value,rating:0,combat:'not-sure',difficulty:'not-sure',
    likes:info,problems:desc,ideas:steps,
    maxDungeon:Math.max(1,Math.min(200,Number(ctx.maxDungeon)||1)),
    characterId:ctx.characterId||'wanderer'
   });
   try{localStorage.setItem(timeKey,String(Date.now()));}catch{}
   message('Report sent successfully. Thank you!','success');
   form.elements.description.value='';form.elements.steps.value='';
  }catch(error){
   const code=String(error?.code||'');
   const explain=code==='auth/popup-closed-by-user'?'Sign-in cancelled. Your report was not sent.':
    code.includes('permission-denied')?'Reports are not enabled in this Firebase environment yet. Copy the report for now.':
    code.includes('auth/')?'Sign-in failed. Check your account or try again.':
    'Could not submit the report. Nothing was sent; you can copy it instead.';
   message(explain,'error');
  }finally{setBusy(false);}
 });
 dialog.showModal();
 form.elements.category.focus();
}
if(button)button.addEventListener('click',openFeedback);
