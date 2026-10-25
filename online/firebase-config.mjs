// DEVELOPMENT ONLY. This branch must never connect to the production Firebase project.
// Dedicated Firebase development Web App config, supplied by the project owner.
// Firebase Web App identifiers are public; do not paste service-account credentials.
// Production remains configured separately on the main branch.
export const firebaseConfig = {
 apiKey: 'AIzaSyAjv8M57HnWiTOmK0tWTDDFSXTtSHKDmsg',
 authDomain: 'wanderer-development-8e3ee.firebaseapp.com',
 projectId: 'wanderer-development-8e3ee',
 storageBucket: 'wanderer-development-8e3ee.firebasestorage.app',
 messagingSenderId: '997393560763',
 appId: '1:997393560763:web:4b81f022621e28b54a259e'
};
export const firebaseEnvironment = 'development';
const forbiddenProductionProjects = new Set(['wanderer-play','wanderer-test-8f062']);
const forbiddenProductionApiKey = 'AIzaSyAo2cRMBYV08N3RVM7tccZeoum_wwcTJQk';
export function assertDevFirebaseConfig(config = firebaseConfig){
 if(!config || !/^[a-z][a-z0-9-]{4,}$/.test(String(config.projectId)) ||
    Object.values(config).some(value => !value || String(value).includes('SET_DEVELOPMENT_'))){
  throw new Error('Development Firebase is not configured. Create a separate Firebase project and update online/firebase-config.mjs. Production accounts and saves will not be used.');
 }
 // Refuse reused production Web App values even if a new projectId is pasted.
 if(String(config.apiKey||'') === forbiddenProductionApiKey ||
    forbiddenProductionProjects.has(String(config.projectId||'')) ||
    [...forbiddenProductionProjects].some(project=>String(config.authDomain||'')===project+'.firebaseapp.com') ||
    String(config.appId||'') === '1:180691461185:web:3a423d32244aad3e41d2c0' ||
    String(config.messagingSenderId||'') === '180691461185'){
  throw new Error('Development is using production Firebase Web App identifiers. Copy the complete config from the new development project.');
 }
 if(forbiddenProductionProjects.has(config.projectId)){
  throw new Error('Refusing to connect development to the production Firebase project. Use an isolated Firebase development project.');
 }
 if(!config.authDomain || !config.apiKey || !config.appId){
  throw new Error('Incomplete development Firebase Web App config.');
 }
 return config;
}
