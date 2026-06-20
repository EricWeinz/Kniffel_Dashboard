import { useKniffelStore } from '../store';
import { computeTotals, getCategory, getModeConfig } from '../lib/rules';
import ScoreBoard from './ScoreBoard';
import ScoreInputModal from './ScoreInputModal';
import SessionCodeBadge from './SessionCodeBadge';
import ThemeMenu from './ThemeMenu';

/** Laufendes Spiel: Kopfzeile, Zug-Banner, Spielblock und Eingabedialog. */
export default function GameScreen() {
  const session = useKniffelStore((s) => s.session);
  const sessionCode = useKniffelStore((s) => s.sessionCode);
  const playerId = useKniffelStore((s) => s.playerId);
  const openCategoryId = useKniffelStore((s) => s.openCategoryId);
  const leave = useKniffelStore((s) => s.leave);
  const undo = useKniffelStore((s) => s.undo);
  const skip = useKniffelStore((s) => s.skip);
  const busy = useKniffelStore((s) => s.busy);

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

  const isHost = session.hostId === playerId;
  // Korrektur: letzter Eintrag, zurücknehmbar durch den Spieler selbst oder den Host
  const lastMove = session.lastMove;
  const canUndo = !!lastMove && (lastMove.playerId === playerId || isHost);
  const undoPlayerName = lastMove ? (session.players?.[lastMove.playerId]?.name ?? '?') : '';
  const undoCategoryLabel = lastMove
    ? (getCategory(session.mode, lastMove.categoryId)?.label ?? '?')
    : '';
  const canSkip = isHost && currentId !== null && currentId !== playerId;

  const handleLeave = () => {
    if (window.confirm('Spiel wirklich verlassen? Dein Zettel bleibt in der Sitzung erhalten.')) {
      void leave();
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl p-3 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black text-sol-base02">
          🎲 Kniffel
          <span className="ml-2 rounded-full bg-sol-violet/15 px-2.5 py-0.5 text-xs font-extrabold text-sol-violet">
            {session.mode === 'classic' ? '🎯' : '💀'} {config.shortLabel}
          </span>
        </h1>
        {/* Rechte Bedienelemente als Block: bleiben so beim Umbruch zusammen und
            rechtsbündig – wichtig, damit das 🎨-Popover auf dem Handy nicht
            über den linken Bildschirmrand hinausläuft. */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <SessionCodeBadge code={sessionCode} />
          <button
            onClick={handleLeave}
            className="rounded-xl border-2 border-sol-base1/40 px-3 py-1.5 text-sm font-bold text-sol-base00 transition hover:border-sol-red hover:text-sol-red"
          >
            Verlassen
          </button>
          <ThemeMenu />
        </div>
      </header>

      {/* Zug-Banner */}
      <div
        className={`animate-fade-up mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2.5 shadow-tile ${
          myTurn
            ? 'border-sol-orange bg-sol-orange/15'
            : 'border-sol-base2 bg-sol-field/40'
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

      {/* Korrektur & Host-Werkzeuge */}
      {(canUndo || canSkip) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {canUndo && (
            <button
              onClick={() => void undo()}
              disabled={busy}
              className="rounded-xl border-2 border-sol-base1/40 bg-sol-field/40 px-3 py-1.5 text-sm font-bold text-sol-base01 transition hover:border-sol-blue disabled:opacity-50"
            >
              ↩️ Zurücknehmen: {undoPlayerName} – {undoCategoryLabel}
            </button>
          )}
          {canSkip && (
            <button
              onClick={() => {
                if (window.confirm(`${currentName} überspringen? Der Zug geht an den Nächsten.`)) {
                  void skip();
                }
              }}
              disabled={busy}
              className="rounded-xl border-2 border-sol-base1/40 bg-sol-field/40 px-3 py-1.5 text-sm font-bold text-sol-base01 transition hover:border-sol-orange disabled:opacity-50"
            >
              ⏭️ {currentName} überspringen
            </button>
          )}
        </div>
      )}

      <ScoreBoard />

      {openCategoryId && <ScoreInputModal categoryId={openCategoryId} />}
    </main>
  );
}
