"use client";

import {
  browserLocalPersistence,
  type Auth,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirebaseClientApp } from "@/lib/firebase/client";

let authInstance: Auth | undefined;
let authReadyPromise: Promise<void> | undefined;

export async function getFirebaseClientAuth(): Promise<Auth> {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseClientApp());
    authReadyPromise = setPersistence(authInstance, browserLocalPersistence);
  }

  if (authReadyPromise) {
    await authReadyPromise;
  }

  return authInstance;
}
