// Public Firebase Web App identifiers for the NEW Wanderer production site.
// Only the Hosting deployment service account is secret; never place it in browser source.
export const firebaseConfig = {
  apiKey: 'AIzaSyBMqGnQAIJr-o8VpePlfPL3UmF5aT4Me_s',
  authDomain: 'wanderer-play.firebaseapp.com',
  projectId: 'wanderer-play',
  storageBucket: 'wanderer-play.firebasestorage.app',
  messagingSenderId: '761358319947',
  appId: '1:761358319947:web:23a35ecd7ac5e0b4b968ce'
};
export const firebaseEnvironment = 'production';
export function assertProductionFirebaseConfig(value=firebaseConfig){
  if(!value || value.projectId!=='wanderer-play' ||
      value.authDomain!=='wanderer-play.firebaseapp.com' ||
      value.appId!=='1:761358319947:web:23a35ecd7ac5e0b4b968ce' ||
      value.messagingSenderId!=='761358319947' ||
      value.apiKey!=='AIzaSyBMqGnQAIJr-o8VpePlfPL3UmF5aT4Me_s'){
    throw new Error('Production must use the dedicated wanderer-play Firebase Web App.');
  }
  return value;
}
