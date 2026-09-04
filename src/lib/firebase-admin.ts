/**
 * Firebase Admin initialization (server-only)
 * Provides singleton access to a Firestore instance that bypasses
 * firestore.rules — callers are responsible for their own authorization.
 */

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let db: Firestore;

function getAdminApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set");
      }
      app = initializeApp({
        credential: cert(JSON.parse(serviceAccountKey)),
      });
    } else {
      app = getApps()[0]!;
    }
  }
  return app;
}

export function getAdminDb(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
  }
  return db;
}
