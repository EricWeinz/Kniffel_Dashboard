import { useEffect, type FormEvent } from 'react';
import { useKniffelStore } from '../store';
import { useTheme, themedEmoji } from '../lib/theme';

/**
 * Beitritts-Dialog nach dem Scannen eines QR-Codes bzw. Öffnen eines
 * Einladungslinks (?code=…). Erspart auf dem Smartphone das Scrollen bis
 * zum "Beitreten"-Button: Name eingeben, antippen, fertig.
 */
export default function JoinPrompt({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const playerName = useKniffelStore((s) => s.playerName);
  const setPlayerName = useKniffelStore((s) => s.setPlayerName);
  const join = useKniffelStore((s) => s.join);
  const busy = useKniffelStore((s) => s.busy);
  const theme = useTheme();

  // Escape schließt den Dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void join(code);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-sol-base03/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sitzung beitreten"
    >
      <div
        className="animate-fade-up w-full max-w-sm rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-5 shadow-board"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-sol-base02">
              {themedEmoji(theme, 'dice', '🎲')} Du wurdest eingeladen!
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-sol-base00">
              Sitzung{' '}
              <span className="font-black tracking-[0.2em] text-sol-base02">{code}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Abbrechen"
            className="-m-1 rounded-lg p-1.5 text-sol-base00 transition hover:bg-sol-base2"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-extrabold uppercase tracking-wide text-sol-base01">
              Dein Anzeigename
            </span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Name eingeben"
              maxLength={20}
              autoComplete="nickname"
              autoFocus={!playerName}
              className="mt-1.5 w-full rounded-xl border-2 border-sol-base1/50 bg-sol-field/60 px-4 py-2.5 text-lg font-bold text-sol-base02 outline-none transition focus:border-sol-blue"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !playerName.trim()}
            className="w-full rounded-xl bg-sol-blue px-4 py-3 text-lg font-black text-sol-onaccent shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
          >
            {busy ? 'Bitte warten …' : `${themedEmoji(theme, 'rocket', '🚀')} Spiel beitreten`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border-2 border-sol-base1/40 px-4 py-2 font-bold text-sol-base00 transition hover:border-sol-base1"
          >
            Stattdessen neue Sitzung
          </button>
        </form>
      </div>
    </div>
  );
}
