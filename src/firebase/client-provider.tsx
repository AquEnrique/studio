'use client';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { PropsWithChildren, useEffect, useState } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';

type FirebaseClientProviderProps = PropsWithChildren;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      const firebaseInstances = await initializeFirebase();
      setFirebase(firebaseInstances);
    };
    init();
  }, []);

  if (!firebase) {
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={firebase.app}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
