import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const apps = getApps();
  let app: FirebaseApp;

  if (apps.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0];
  }
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

export {
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';
