// Production Firebase Web App configuration for the controlled release workflow.
// Firebase Web App identifiers are public; never place service-account credentials here.
export const firebaseConfig = {
  apiKey: 'AIzaSyBMqGnQAIJr-o8VpePlfPL3UmF5aT4Me_s',
  authDomain: 'wanderer-play.firebaseapp.com',
  projectId: 'wanderer-play',
  storageBucket: 'wanderer-play.firebasestorage.app',
  messagingSenderId: '761358319947',
  appId: '1:761358319947:web:23a35ecd7ac5e0b4b968ce'
};

export const firebaseEnvironment = 'production';

export function assertProductionFirebaseConfig(config = firebaseConfig) {
  if (config?.projectId !== 'wanderer-play' ||
      config?.authDomain !== 'wanderer-play.firebaseapp.com' ||
      config?.appId !== '1:761358319947:web:23a35ecd7ac5e0b4b968ce' ||
      config?.messagingSenderId !== '761358319947') {
    throw new Error('Production Hosting requires the approved wanderer-play Web App configuration.');
  }
  return config;
}
