export {initializeApp} from 'firebase/app';
export {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification,reload,getIdToken} from 'firebase/auth';
export {getFirestore,doc,collection,getDoc,getDocs,query,where,orderBy,limit,runTransaction,serverTimestamp} from 'firebase/firestore';
