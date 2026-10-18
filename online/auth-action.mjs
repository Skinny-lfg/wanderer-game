import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,applyActionCode,verifyPasswordResetCode,confirmPasswordReset,checkActionCode} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {firebaseConfig,assertProductionFirebaseConfig} from './firebase-config.mjs?v=v0110-production-1';

const heading=document.getElementById('heading');
const status=document.getElementById('status');
const form=document.getElementById('resetForm');
const params=new URLSearchParams(location.search);
const mode=params.get('mode'),code=params.get('oobCode'),requestedKey=params.get('apiKey');
function show(text,type=''){status.textContent=text;status.className=type;}
function fail(){heading.textContent='Link expired or invalid';show('This secure link could not be used. Return to Wanderer and request a new email.','error');form.hidden=true;}
try {
 assertProductionFirebaseConfig(firebaseConfig);
 if(requestedKey && requestedKey!==firebaseConfig.apiKey)throw Error('Link belongs to another Firebase project');
 if(!code || !['verifyEmail','resetPassword','recoverEmail'].includes(mode))throw Error('Invalid action');
 const auth=getAuth(initializeApp(firebaseConfig));
 if(mode==='verifyEmail'){
  heading.textContent='Verify your email';
  show('Confirming your email…');
  await applyActionCode(auth,code);
  heading.textContent='Email verified';
  show('Your Wanderer email is now verified. Return to the game and choose “I verified my email” to continue.','success');
 }else if(mode==='recoverEmail'){
  heading.textContent='Recover email address';
  await checkActionCode(auth,code);
  await applyActionCode(auth,code);
  show('The email address change was reversed. Please sign in again.','success');
 }else{
  heading.textContent='Set a new password';
  await verifyPasswordResetCode(auth,code);
  show('Choose a secure password for your Wanderer account.');
  form.hidden=false;
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(!form.reportValidity())return;
   const password=document.getElementById('newPassword').value;
   const confirmation=document.getElementById('confirmPassword').value;
   if(password.length<8){show('Use at least eight characters.','error');return;}
   if(password!==confirmation){show('Passwords do not match.','error');return;}
   const button=document.getElementById('submitReset');
   button.disabled=true;
   try{
    await confirmPasswordReset(auth,code,password);
    form.reset();form.hidden=true;
    heading.textContent='Password updated';
    show('Your password has been changed. You can now sign in to Wanderer.','success');
   }catch{fail();}finally{button.disabled=false;}
  });
 }
}catch{fail();}
