// DEVELOPMENT ONLY. This branch must never connect to the production Firebase project.
// Create a separate Firebase project and copy the Web App config here.
// Firebase Web App identifiers are public; do not paste service-account credentials.
// Production remains configured separately on the main branch.
export const firebaseConfig = {
 apiKey: 'SET_DEVELOPMENT_API_KEY',
 authDomain: 'SET_DEVELOPMENT_PROJECT.firebaseapp.com',
 projectId: 'SET_DEVELOPMENT_PROJECT_ID',
 storageBucket: 'SET_DEVELOPMENT_PROJECT.firebasestorage.app',
 messagingSenderId: 'SET_DEVELOPMENT_SENDER_ID',
 appId: 'SET_DEVELOPMENT_APP_ID'
};
export const firebaseEnvironment = 'development';
const forbiddenProductionProject = 'wanderer-test-8f062';
export function assertDevFirebaseConfig(config = firebaseConfig){
 if(!config || !/^[a-z][a-z0-9-]{4,}$/.test(String(config.projectId)) ||
    Object.values(config).some(value => !value || String(value).includes('SET_DEVELOPMENT_'))){
  throw new Error('Development Firebase is not configured. Create a separate Firebase project and update online/firebase-config.mjs. Production accounts and saves will not be used.');
 }
 if(config.projectId === forbiddenProductionProject){
  throw new Error('Refusing to connect development to the production Firebase project. Use an isolated Firebase development project.');
 }
 if(!config.authDomain || !config.apiKey || !config.appId){
  throw new Error('Incomplete development Firebase Web App config.');
 }
 return config;
}
