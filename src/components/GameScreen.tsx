import { useKniffelStore } from '../store';
import { computeTotals, getModeConfig } from '../lib/rules';
import ScoreBoard from './ScoreBoard';
import ScoreInputModal from './ScoreInputModal';
import SessionCodeBadge from './SessionCodeBadge';

/** Laufendes Spiel: Kopfzeile, Zug-Banner, Spielblock und Eingabedialog. */
export default function GameScreen() {
  const session = useKniffelStore((s) => s.session);
  const sessionCode = useKniffelStore((s) => s.sessionCode);
  const playerId = useKniffelStore((s) => s.playerId);
  const openCategoryId = useKniffelStore((s) => s.openCategoryId);
  const leave = useKniffelStore((s) => s.leave);

  if (!session || !sessionCode) return null;

  const config = getModeConfig(session.mode);
  const order = session.playerOrder ?? [];
  const currentId = order.length > 0 ? order[session.turnIndex % order.length] : null;
  const currentName = currentId ? (session.players?.[currentId]?.name ?? '?') : '?';
  const myTurn = currentId === playerId;

  // Rundenzähler: kleinster Füllstand aller Zettel bestimmt die laufende Runde
  const minFilled = Math.min(
    ...order.map((id) => computeTotals(session.mode, session.players?.[id]?.scores).filledCount),
  );
  const round = Math.min(minFilled + 1, config.categories.length);

  const handleLeave = () => {
    if (window.confirm('Spiel wirklich verlassen? Dein Zettel bleibt in der Sitzung erhalten.')) {
      void leave();
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl p-3 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-black text-sol-base02">
          🎲 Kniffel
          <span className="ml-2 rounded-full bg-sol-violet/15 px-2.5 py-0.5 text-xs font-extrabold text-sol-violet">
            {session.mode === 'classic' ? '🎯' : '💀'} {config.shortLabel}
          </span>
        </h1>
        <SessionCodeBadge code={sessionCode} />
        <button
          onClick={handleLeave}
          className="rounded-xl border-2 border-sol-base1/40 px-3 py-1.5 text-sm font-bold text-sol-base00 transition hover:border-sol-red hover:text-sol-red"
        >
          Verlassen
        </button>
      </header>

      {/* Zug-Banner */}
      <div
        className={`animate-fade-up mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2.5 shadow-tile ${
          myTurn
            ? 'border-sol-orange bg-sol-orange/15'
            : 'border-sol-base2 bg-white/40'
        }`}
        role="status"
      >
        <p className="font-extrabold text-sol-base02">
          {myTurn ? (
            <>Du bist dran! Tippe auf ein freies Feld in deiner Spalte.</>
          ) : (
            <>⏳ {currentName} ist am Zug …</>
          )}
        </p>
        <span className="text-sm font-bold text-sol-base00">
          Runde {round} / {config.categories.length}
        </span>
      </div>

      <ScoreBoard />

      {openCategoryId && <ScoreInputModal categoryId={openCategoryId} />}
    </main>
  );
}
