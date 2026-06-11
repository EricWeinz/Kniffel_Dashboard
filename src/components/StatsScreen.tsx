import { useEffect, useState } from 'react';
import { aggregateStats, fetchHistory } from '../lib/stats';
import type { HistoryEntry } from '../types';

function medal(rank: number): string {
  return ['🥇', '🥈', '🥉'][rank - 1] ?? `${rank}.`;
}

/**
 * Ewige Tabelle: aggregierte Langzeit-Statistik über alle archivierten Spiele
 * plus Liste der letzten Partien. Spieler werden über den Anzeigenamen
 * zusammengeführt (Groß-/Kleinschreibung egal).
 */
export default function StatsScreen({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchHistory()
      .then(setEntries)
      .catch((err) => {
        console.error(err);
        setLoadError(true);
      });
  }, []);

  const stats = entries ? aggregateStats(entries) : [];
  const recentGames = entries?.slice(0, 10) ?? [];

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl p-4 sm:p-6">
      <header className="animate-fade-up mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-sol-base1/40 px-3 py-1.5 font-bold text-sol-base00 transition hover:border-sol-blue"
        >
          ← Zurück
        </button>
        <h1 className="text-2xl font-black text-sol-base02">📊 Ewige Tabelle</h1>
      </header>

      {loadError && (
        <p className="rounded-xl border-2 border-sol-red/40 bg-sol-base3 px-4 py-3 font-bold text-sol-red">
          Statistik konnte nicht geladen werden. Sind die Datenbank-Regeln für{' '}
          <code>history</code> veröffentlicht? (siehe Setup-Anleitung)
        </p>
      )}

      {entries !== null && entries.length === 0 && !loadError && (
        <div className="animate-fade-up rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-8 text-center shadow-board">
          <div className="text-5xl" aria-hidden>
            🎲
          </div>
          <p className="mt-3 font-extrabold text-sol-base02">Noch keine Spiele archiviert.</p>
          <p className="mt-1 text-sm font-semibold text-sol-base00">
            Sobald die erste Partie beendet ist, erscheint sie hier automatisch.
          </p>
        </div>
      )}

      {stats.length > 0 && (
        <div className="animate-fade-up overflow-x-auto rounded-2xl border-2 border-sol-base2 bg-sol-base3 shadow-board">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-sol-base2 text-left text-xs font-black uppercase tracking-wider text-sol-base00">
                <th className="px-3 py-2">Platz</th>
                <th className="px-3 py-2">Spieler</th>
                <th className="px-3 py-2 text-center">Spiele</th>
                <th className="px-3 py-2 text-center">Siege</th>
                <th className="px-3 py-2 text-center">Ø Punkte</th>
                <th className="px-3 py-2 text-center">Rekord</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((player, index) => (
                <tr
                  key={player.name.toLowerCase()}
                  className={`border-b border-sol-base2/80 ${index === 0 ? 'bg-sol-yellow/15' : ''}`}
                >
                  <td className="px-3 py-2 text-lg font-black">{medal(index + 1)}</td>
                  <td className="max-w-32 truncate px-3 py-2 font-extrabold text-sol-base02">
                    {player.name}
                  </td>
                  <td className="tabular px-3 py-2 text-center font-bold text-sol-base01">
                    {player.games}
                  </td>
                  <td className="tabular px-3 py-2 text-center font-black text-sol-orange">
                    {player.wins}
                  </td>
                  <td className="tabular px-3 py-2 text-center font-bold text-sol-base01">
                    {player.avg}
                  </td>
                  <td className="tabular px-3 py-2 text-center font-bold text-sol-blue">
                    {player.best}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recentGames.length > 0 && (
        <section className="animate-fade-up mt-6">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wider text-sol-base00">
            Letzte Spiele
          </h2>
          <ul className="space-y-2">
            {recentGames.map((game) => {
              const best = Math.max(...game.players.map((p) => p.total));
              return (
                <li
                  key={`${game.finishedAt}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-2 border-sol-base2 bg-sol-base3 px-3 py-2 shadow-tile"
                >
                  <span aria-hidden>{game.mode === 'classic' ? '🎯' : '💀'}</span>
                  <span className="text-sm font-bold text-sol-base00">
                    {new Date(game.finishedAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </span>
                  <span className="flex-1 truncate font-extrabold text-sol-base02">
                    🏆 {game.winners.join(' & ')}
                  </span>
                  <span className="tabular font-black text-sol-orange">{best} P.</span>
                  <span className="text-xs font-semibold text-sol-base0">
                    {game.players.length} Spieler
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {entries === null && !loadError && (
        <p className="text-center font-bold text-sol-base00">Lade Statistik …</p>
      )}
    </main>
  );
}
