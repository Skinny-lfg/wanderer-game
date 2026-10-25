export {initializeApp} from 'firebase/app';
export {getAuth,GoogleAuthProvider,EmailAuthProvider,signInWithPopup,signInAnonymously,linkWithPopup,linkWithCredential,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification,reload,getIdToken} from 'firebase/auth';
export {getFirestore,doc,collection,getDoc,getDocFromServer,getDocs,query,where,orderBy,limit,runTransaction,serverTimestamp} from 'firebase/firestore';
