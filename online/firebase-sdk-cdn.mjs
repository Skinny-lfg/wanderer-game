// Fallback for development while the pinned local Firebase bundle is being rebuilt.
// All Firebase imports must come from this same SDK instance.
// CDN version MUST match package.json (Firebase 11.10.0).
export {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
export {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,
 setPersistence,browserLocalPersistence,signInWithEmailAndPassword,
 createUserWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification,
 reload} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
export {getFirestore,doc,collection,getDoc,getDocs,query,where,orderBy,limit,
 runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
