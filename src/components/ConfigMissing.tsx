/** Hilfeseite, falls die App ohne Firebase-Umgebungsvariablen startet. */
export default function ConfigMissing() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="animate-fade-up w-full max-w-lg rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-6 shadow-board">
        <h1 className="text-2xl font-black text-sol-base02">
          🎲 Kniffel Dashboard – Einrichtung nötig
        </h1>
        <p className="mt-3 text-sol-base01">
          Firebase ist noch nicht konfiguriert. Lege im Projektordner eine Datei{' '}
          <code className="rounded bg-sol-base2 px-1.5 py-0.5 font-bold">.env</code> an (Vorlage:{' '}
          <code className="rounded bg-sol-base2 px-1.5 py-0.5 font-bold">.env.example</code>) und
          trage die Werte deines Firebase-Projekts ein:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-sol-base02 p-4 text-xs leading-relaxed text-sol-base2">
          {`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`}
        </pre>
        <p className="mt-4 text-sm text-sol-base00">
          Die Schritt-für-Schritt-Anleitung (Firebase-Projekt anlegen, Realtime Database
          aktivieren, Deploy auf Vercel) steht in der <strong>README.md</strong>. Danach den
          Dev-Server neu starten.
        </p>
      </div>
    </main>
  );
}
