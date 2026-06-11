import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

/**
 * Firebase-Konfiguration ausschließlich über Umgebungsvariablen (VITE_FIREBASE_*).
 * Lokal: .env-Datei (siehe .env.example), auf Vercel: Project Settings -> Environment Variables.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** Ohne diese beiden Werte kann die Realtime Database nicht arbeiten. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL,
);

let app: FirebaseApp | null = null;
let database: Database | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

/** Wirft einen verständlichen Fehler, falls die App ohne Konfiguration benutzt wird. */
export function getDb(): Database {
  if (!database) {
    throw new Error(
      'Firebase ist nicht konfiguriert. Bitte .env mit den VITE_FIREBASE_*-Variablen anlegen (siehe README).',
    );
  }
  return database;
}
