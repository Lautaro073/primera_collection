import { type FirebaseOptions, type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";

let clientApp: FirebaseApp | undefined;

export function getFirebaseClientApp(): FirebaseApp {
  if (clientApp) {
    return clientApp;
  }

  const requiredConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (Object.values(requiredConfig).some((value) => !value)) {
    throw new Error(
      "Faltan variables NEXT_PUBLIC_FIREBASE_* para inicializar Firebase en el cliente."
    );
  }

  const config: FirebaseOptions = {
    ...requiredConfig,
  };

  if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    config.storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  }

  clientApp = getApps().length > 0 ? getApp() : initializeApp(config);
  return clientApp;
}
