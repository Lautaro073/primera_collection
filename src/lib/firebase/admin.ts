import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { type Storage, getStorage } from "firebase-admin/storage";

let adminApp: App | undefined;

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0] as App;
    return adminApp;
  }

  const projectId = required("FIREBASE_PROJECT_ID");
  const clientEmail = required("FIREBASE_CLIENT_EMAIL");
  const privateKey = required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
}

export function getFirebaseAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}
