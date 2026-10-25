/* Player feedback / bug reports for the v0.12 preview.
   Read-only gameplay context; Firebase feedbackInbox is separate from saves.
   Do not treat a local copy as a submitted report. */
import {createBackend} from './firebase-client.mjs?v=v012-equipped-gear-1';
import {buildCommit} from './v012-build-info.mjs';
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
   'Steps / suggestion: '+form.elements.steps.value,'Version: '+(ctx.appVersion||'0.12.0'),'Commit: '+buildCommit,
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
  <label class="feedbackPrivacy"><input type="checkbox" name="browser" checked>Include browser information to help diagnose bugs</label>
 <p class="feedbackNotice">Sending requires a registered Google or verified email account. If the service is unavailable, use “Copy report”.</p>
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
   if(!currentUser||currentUser.isAnonymous)throw Error("Sign in to your Wanderer account before sending feedback.");
   const ctx=context();
   await backend.submitV012Feedback({
    category:form.elements.category.value,description:desc,steps,commit:buildCommit,
    screen:ctx.screen||'unknown',viewport:innerWidth+'x'+innerHeight,
    browser:form.elements.browser.checked?navigator.userAgent:'',technical:recentErrors.join(' | ')
   });
   try{localStorage.setItem(timeKey,String(Date.now()));}catch{}
   message('Report sent successfully. Thank you!','success');
   form.elements.description.value='';form.elements.steps.value='';
  }catch(error){
   const code=String(error?.code||'');
   const explain=code==='auth/popup-closed-by-user'?'Sign-in cancelled. Your report was not sent.':
    code.includes('permission-denied')?'Reports are not enabled in this Firebase environment yet. Copy the report for now.':
    error?.message==='feedback-rate-limited'?'Please wait one minute between reports.':
    /Sign in to your Wanderer account/.test(String(error?.message||''))?'Sign in first using the Account button. Your report was not submitted.':
    code.includes('auth/')?'Sign-in failed. Check your account or try again.':
    'Could not submit the report. Nothing was sent; you can copy it instead.';
   message(explain,'error');
  }finally{setBusy(false);}
 });
 dialog.showModal();
 form.elements.category.focus();
}
if(button)button.addEventListener('click',openFeedback);
const recentErrors=[];
function technicalError(value){const clean=String(value||'').replace(/https?:\/\/\S+/g,'[url]').replace(/[\r\n\t]+/g,' ').slice(0,240);if(clean&&recentErrors.at(-1)!==clean){recentErrors.push(clean);if(recentErrors.length>4)recentErrors.shift();}}
addEventListener('error',event=>technicalError(event.error?.name||'JavaScript error'));
addEventListener('unhandledrejection',event=>technicalError(event.reason?.name||'Unhandled promise rejection'));
addEventListener('wanderer:save-status',event=>{if(event.detail?.state==='error')technicalError('Cloud save transaction failed or conflicted');});
