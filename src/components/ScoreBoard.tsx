import { useKniffelStore } from '../store';
import { computeTotals, getModeConfig } from '../lib/rules';
import type { Category } from '../types';
import ScoreCell from './ScoreCell';

/**
 * Der gemeinsame Spielblock: eine Zeile pro Kategorie, eine Spalte pro Spieler.
 * Erste Spalte klebt beim horizontalen Scrollen (Mobile) links fest.
 * Alle Zwischensummen, Boni und Endsummen werden live berechnet.
 */
export default function ScoreBoard() {
  const session = useKniffelStore((s) => s.session);
  const playerId = useKniffelStore((s) => s.playerId);
  const openScoreDialog = useKniffelStore((s) => s.openScoreDialog);
  const unlock = useKniffelStore((s) => s.unlock);
  const kickPlayer = useKniffelStore((s) => s.kickPlayer);

  if (!session) return null;

  const isHost = session.hostId === playerId;
  const config = getModeConfig(session.mode);
  const order = session.playerOrder ?? [];
  const currentId =
    session.state === 'playing' && order.length > 0
      ? order[session.turnIndex % order.length]
      : null;

  const totalsById = Object.fromEntries(
    order.map((id) => [id, computeTotals(session.mode, session.players?.[id]?.scores)]),
  );

  const upperCategories = config.categories.filter((c) => c.section === 'upper');
  const lowerCategories = config.categories.filter((c) => c.section === 'lower');

  /** Darf ich dieses Feld gerade anklicken? Nur eigene Spalte, eigener Zug, freies Feld. */
  const isClickable = (category: Category, id: string): boolean =>
    session.state === 'playing' &&
    id === playerId &&
    id === currentId &&
    session.players?.[id]?.scores?.[category.id] === undefined;

  const categoryRow = (category: Category) => (
    <tr key={category.id} className="border-b border-sol-base2/80">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-sol-base3 px-3 py-1 text-left align-middle"
      >
        <span className="block text-sm font-extrabold leading-tight text-sol-base02">
          {category.label}
        </span>
        <span className="block text-[11px] font-semibold leading-tight text-sol-base0">
          {category.kind === 'fixed' ? `${category.fixedScore} Punkte` : category.hint}
        </span>
      </th>
      {order.map((id) => {
        const value = session.players?.[id]?.scores?.[category.id];
        return (
          <ScoreCell
            key={id}
            value={value}
            clickable={isClickable(category, id)}
            unlockable={isHost && value !== undefined && session.state !== 'lobby'}
            isActiveColumn={id === currentId}
            onClick={() => openScoreDialog(category.id)}
            onUnlock={() => {
              const name = session.players?.[id]?.name ?? '?';
              const reopens =
                session.state === 'finished' ? ' Das Spiel wird dadurch fortgesetzt.' : '';
              if (
                window.confirm(
                  `Feld „${category.label}“ von ${name} (Wert: ${value}) wieder freigeben?${reopens}`,
                )
              ) {
                void unlock(id, category.id);
              }
            }}
          />
        );
      })}
    </tr>
  );

  const computedRow = (label: string, values: (number | string)[], emphasized = false) => (
    <tr className={emphasized ? 'bg-sol-yellow/15' : 'bg-sol-base2/50'}>
      <th
        scope="row"
        className={`sticky left-0 z-10 px-3 py-1.5 text-left text-sm font-black text-sol-base02 ${
          emphasized ? 'bg-sol-rowemph' : 'bg-sol-row'
        }`}
      >
        {label}
      </th>
      {values.map((v, i) => (
        <td
          key={order[i]}
          className={`tabular px-1.5 py-1.5 text-center font-black ${
            emphasized ? 'text-base text-sol-orange' : 'text-sm text-sol-base01'
          }`}
        >
          {v}
        </td>
      ))}
    </tr>
  );

  const sectionRow = (label: string) => (
    <tr>
      <th
        colSpan={order.length + 1}
        className="sticky left-0 bg-sol-bar px-3 py-1.5 text-left text-xs font-black uppercase tracking-widest text-sol-onaccent"
      >
        {label}
      </th>
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-sol-base2 bg-sol-base3 shadow-board">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-sol-base2">
            <th className="sticky left-0 z-10 min-w-36 bg-sol-base3 px-3 py-2 text-left text-xs font-black uppercase tracking-wider text-sol-base00">
              Kategorie
            </th>
            {order.map((id) => {
              const player = session.players?.[id];
              const isMe = id === playerId;
              const isCurrent = id === currentId;
              return (
                <th key={id} className="px-1.5 py-2 text-center">
                  <div
                    className={`mx-auto flex min-w-12 flex-col items-center rounded-lg px-1 py-1 ${
                      isCurrent
                        ? 'animate-turn-pulse bg-sol-orange/15 ring-2 ring-sol-orange'
                        : ''
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          player?.online ? 'bg-sol-green' : 'bg-sol-base1'
                        }`}
                      />
                      <span
                        className={`max-w-16 truncate text-sm font-black ${
                          isMe ? 'text-sol-blue' : 'text-sol-base02'
                        }`}
                        title={player?.name}
                      >
                        {player?.name ?? '?'}
                      </span>
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase text-sol-orange">
                        am Zug
                      </span>
                    )}
                    {isHost && !isMe && session.state === 'playing' && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `${player?.name ?? '?'} wirklich aus dem Spiel entfernen? Der Zettel wird gelöscht.`,
                            )
                          ) {
                            void kickPlayer(id);
                          }
                        }}
                        title="Spieler entfernen (Spielleitung)"
                        className="mt-0.5 text-[10px] font-bold text-sol-base1 transition hover:text-sol-red"
                      >
                        ✕ entfernen
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sectionRow('Oberer Block')}
          {upperCategories.map(categoryRow)}
          {computedRow(
            'Summe oben',
            order.map((id) => totalsById[id].upperSum),
          )}
          {computedRow(
            `Bonus (+${config.bonusPoints} ab ${config.bonusThreshold})`,
            order.map((id) => {
              const t = totalsById[id];
              return t.bonus > 0 ? `+${t.bonus}` : `${t.upperSum}/${config.bonusThreshold}`;
            }),
          )}
          {computedRow(
            'Gesamt oben',
            order.map((id) => totalsById[id].upperTotal),
          )}

          {sectionRow('Unterer Block')}
          {lowerCategories.map(categoryRow)}
          {computedRow(
            'Gesamt unten',
            order.map((id) => totalsById[id].lowerSum),
          )}
          {computedRow(
            'Endsumme',
            order.map((id) => totalsById[id].grandTotal),
            true,
          )}
        </tbody>
      </table>
    </div>
  );
}
