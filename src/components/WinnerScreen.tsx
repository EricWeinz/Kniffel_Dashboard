import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useKniffelStore } from '../store';
import { computeTotals, getModeConfig } from '../lib/rules';
import ScoreBoard from './ScoreBoard';

const SOLARIZED_CONFETTI = ['#b58900', '#cb4b16', '#dc322f', '#d33682', '#268bd2', '#2aa198', '#859900'];

function medal(rank: number): string {
  return ['🥇', '🥈', '🥉'][rank - 1] ?? `${rank}.`;
}

/** Siegerehrung: Rangliste mit Konfetti, Revanche und kompletter Spielblock. */
export default function WinnerScreen() {
  const session = useKniffelStore((s) => s.session);
  const playerId = useKniffelStore((s) => s.playerId);
  const startRematch = useKniffelStore((s) => s.startRematch);
  const leave = useKniffelStore((s) => s.leave);
  const busy = useKniffelStore((s) => s.busy);

  // Konfetti-Salven beim Anzeigen der Siegerehrung
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fire = (ratio: number, options: confetti.Options) =>
      void confetti({
        particleCount: Math.floor(220 * ratio),
        spread: 75,
        ticks: 220,
        colors: SOLARIZED_CONFETTI,
        disableForReducedMotion: true,
        ...options,
      });
    fire(0.5, { origin: { y: 0.6 } });
    const left = setTimeout(() => fire(0.35, { angle: 60, origin: { x: 0, y: 0.7 } }), 300);
    const right = setTimeout(() => fire(0.35, { angle: 120, origin: { x: 1, y: 0.7 } }), 550);
    return () => {
      clearTimeout(left);
      clearTimeout(right);
    };
  }, []);

  if (!session) return null;

  const config = getModeConfig(session.mode);
  const isHost = session.hostId === playerId;
  const hostName = session.players?.[session.hostId]?.name ?? '?';
  const order = session.playerOrder ?? [];

  // Rangliste mit Gleichstand: gleiche Punktzahl = gleicher Rang
  const ranking = order
    .map((id) => ({
      id,
      name: session.players?.[id]?.name ?? '?',
      totals: computeTotals(session.mode, session.players?.[id]?.scores),
    }))
    .sort((a, b) => b.totals.grandTotal - a.totals.grandTotal)
    .map((entry, index, sorted) => ({
      ...entry,
      rank:
        index > 0 && entry.totals.grandTotal === sorted[index - 1].totals.grandTotal
          ? -1 // wird unten durch den Rang des Vorgängers ersetzt
          : index + 1,
    }));
  for (let i = 1; i < ranking.length; i++) {
    if (ranking[i].rank === -1) ranking[i].rank = ranking[i - 1].rank;
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl p-4 sm:p-6">
      <header className="animate-fade-up mb-5 text-center">
        <div className="text-6xl" aria-hidden>
          🏆
        </div>
        <h1 className="mt-2 text-3xl font-black text-sol-base02">Spiel beendet!</h1>
        <p className="mt-1 font-bold text-sol-base00">
          {config.label} ·{' '}
          {ranking[0] && (
            <>
              <span className="text-sol-orange">{ranking[0].name}</span> gewinnt mit{' '}
              {ranking[0].totals.grandTotal} Punkten 🎉
            </>
          )}
        </p>
      </header>

      {/* Rangliste */}
      <ol className="animate-fade-up space-y-2">
        {ranking.map((entry) => (
          <li
            key={entry.id}
            className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-tile ${
              entry.rank === 1
                ? 'border-sol-yellow bg-sol-yellow/15'
                : 'border-sol-base2 bg-sol-base3'
            }`}
          >
            <span className="w-9 text-center text-2xl font-black" aria-label={`Platz ${entry.rank}`}>
              {medal(entry.rank)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-sol-base02">
                {entry.name}
                {entry.id === playerId && <span className="text-sol-base00"> (du)</span>}
              </p>
              <p className="text-xs font-bold text-sol-base00">
                Oben {entry.totals.upperTotal}
                {entry.totals.bonus > 0 && ` (inkl. Bonus +${entry.totals.bonus})`} · Unten{' '}
                {entry.totals.lowerSum}
              </p>
            </div>
            <span className="tabular text-2xl font-black text-sol-orange">
              {entry.totals.grandTotal}
            </span>
          </li>
        ))}
      </ol>

      {/* Aktionen */}
      <div className="animate-fade-up mt-5 space-y-2">
        {isHost ? (
          <button
            onClick={() => void startRematch()}
            disabled={busy}
            className="w-full rounded-xl bg-sol-orange px-4 py-3 text-lg font-black text-sol-base3 shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
          >
            🔄 Revanche – gleiche Runde, neue Zettel
          </button>
        ) : (
          <p className="rounded-xl bg-sol-base2/70 px-4 py-3 text-center text-sm font-bold text-sol-base01">
            {hostName} kann eine Revanche starten – oder du verlässt die Sitzung.
          </p>
        )}
        <button
          onClick={() => void leave()}
          className="w-full rounded-xl border-2 border-sol-base1/40 px-4 py-2.5 font-bold text-sol-base00 transition hover:border-sol-red hover:text-sol-red"
        >
          Sitzung verlassen
        </button>
      </div>

      {/* Kompletter Spielblock zum Nachschauen */}
      <details className="mt-6">
        <summary className="cursor-pointer text-center font-extrabold text-sol-blue hover:underline">
          Kompletten Spielblock anzeigen
        </summary>
        <div className="mt-3">
          <ScoreBoard />
        </div>
      </details>
    </main>
  );
}
