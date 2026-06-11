import { useState, type FormEvent } from 'react';

/**
 * Rudimentärer Passwortschutz vor der gesamten App (kein Impressum -> keine
 * öffentliche Seite). Rein clientseitig und damit KEIN echter Schutz – er hält
 * nur zufällige Besucher fern. Die Freischaltung wird im Browser gespeichert.
 */
const PASSWORD = 'kniffel';
export const UNLOCK_KEY = 'kniffel:unlocked';

export default function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (input.trim().toLowerCase() === PASSWORD) {
      localStorage.setItem(UNLOCK_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="animate-fade-up w-full max-w-sm rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-6 text-center shadow-board"
      >
        <div className="text-5xl" aria-hidden>
          🔒
        </div>
        <h1 className="mt-2 text-2xl font-black text-sol-base02">Kniffel Dashboard</h1>
        <p className="mt-1 text-sm font-semibold text-sol-base00">
          Private Runde – bitte Passwort eingeben.
        </p>

        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Passwort"
          autoFocus
          autoComplete="current-password"
          className={`mt-4 w-full rounded-xl border-2 bg-white/60 px-4 py-2.5 text-center text-lg font-bold text-sol-base02 outline-none transition focus:border-sol-blue ${
            error ? 'border-sol-red' : 'border-sol-base1/50'
          }`}
        />
        {error && (
          <p className="mt-2 text-sm font-bold text-sol-red" role="alert">
            Falsches Passwort – bitte erneut versuchen.
          </p>
        )}

        <button
          type="submit"
          disabled={input.length === 0}
          className="mt-4 w-full rounded-xl bg-sol-blue px-4 py-3 text-lg font-black text-sol-base3 shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
        >
          Freischalten
        </button>
      </form>
    </main>
  );
}
