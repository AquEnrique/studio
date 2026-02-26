
'use client';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

export type FirebaseContextValue = {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

type FirebaseProviderProps = PropsWithChildren & {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export const FirebaseProvider = ({
  firebaseApp,
  auth,
  firestore,
  children,
}: FirebaseProviderProps) => {
  return (
    <FirebaseContext.Provider
      value={{
        app: firebaseApp,
        auth,
        firestore,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  const { app } = useFirebase();
  if (!app) {
    throw new Error('Firebase app not available');
  }
  return app;
}

export function useAuth() {
  const { auth } = useFirebase();
  if (!auth) {
    throw new Error('Firebase Auth not available');
  }
  return auth;
}

export function useFirestore() {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error('Firestore not available');
  }
  return firestore;
}
