import { useEffect } from 'react';
import { useKniffelStore } from '../store';

/** Globale Fehlermeldung als Toast, verschwindet nach 6 Sekunden von selbst. */
export default function ErrorToast() {
  const error = useKniffelStore((s) => s.error);
  const clearError = useKniffelStore((s) => s.clearError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(clearError, 6000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="animate-fade-up fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border-2 border-sol-red/40 bg-sol-base3 px-4 py-3 shadow-board"
    >
      <span aria-hidden>⚠️</span>
      <p className="flex-1 text-sm font-semibold text-sol-red">{error}</p>
      <button
        onClick={clearError}
        aria-label="Meldung schließen"
        className="-m-1 rounded-md p-1 text-sol-base00 hover:bg-sol-base2"
      >
        ✕
      </button>
    </div>
  );
}
