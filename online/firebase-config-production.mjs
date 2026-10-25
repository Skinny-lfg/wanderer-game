// Production Firebase Web App configuration for the controlled release workflow.
// Firebase Web App identifiers are public; never place service-account credentials here.
export const firebaseConfig = {
  apiKey: 'AIzaSyAo2cRMBYV08N3RVM7tccZeoum_wwcTJQk',
  authDomain: 'wanderer-play.firebaseapp.com',
  projectId: 'wanderer-play',
  storageBucket: 'wanderer-play.firebasestorage.app',
  messagingSenderId: '180691461185',
  appId: '1:180691461185:web:3a423d32244aad3e41d2c0'
};

export const firebaseEnvironment = 'production';

export function assertProductionFirebaseConfig(config = firebaseConfig) {
  if (config?.projectId !== 'wanderer-play' ||
      config?.authDomain !== 'wanderer-play.firebaseapp.com' ||
      config?.appId !== '1:180691461185:web:3a423d32244aad3e41d2c0') {
    throw new Error('Production Hosting requires the approved wanderer-play Web App configuration.');
  }
  return config;
}
