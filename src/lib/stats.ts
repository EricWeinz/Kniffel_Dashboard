import { get, ref, set } from 'firebase/database';
import { getDb } from '../firebase';
import { computeTotals } from './rules';
import type { HistoryEntry, PlayerStats, Session } from '../types';

/**
 * Ewige Tabelle: Abgeschlossene Spiele werden unter history/{code}-{createdAt}
 * archiviert. Der Schlüssel ist deterministisch – schreibt der Host mehrfach
 * (z. B. nach einer Korrektur und erneutem Spielende), wird derselbe Eintrag
 * einfach mit dem aktuellen Ergebnis überschrieben statt dupliziert.
 *
 * Spieler werden über ihren Anzeigenamen zusammengeführt (kein Account-System):
 * "Eric" von heute und "Eric" von nächster Woche zählen als dieselbe Person.
 */

/** Schreibt das Endergebnis einer beendeten Sitzung ins Archiv (nur Host). */
export async function archiveResult(code: string, session: Session): Promise<void> {
  if (session.state !== 'finished') return;

  const order = session.playerOrder ?? [];
  const players = order.map((id) => ({
    name: session.players?.[id]?.name ?? '?',
    total: computeTotals(session.mode, session.players?.[id]?.scores).grandTotal,
  }));
  if (players.length === 0) return;

  const bestTotal = Math.max(...players.map((p) => p.total));
  const entry: HistoryEntry = {
    mode: session.mode,
    finishedAt: session.finishedAt ?? Date.now(),
    players,
    winners: players.filter((p) => p.total === bestTotal).map((p) => p.name),
  };
  await set(ref(getDb(), `history/${code}-${session.createdAt}`), entry);
}

/** Lädt alle archivierten Spiele, neueste zuerst. */
export async function fetchHistory(): Promise<HistoryEntry[]> {
  const snapshot = await get(ref(getDb(), 'history'));
  const value = snapshot.val() as Record<string, HistoryEntry> | null;
  if (!value) return [];
  return Object.values(value).sort((a, b) => b.finishedAt - a.finishedAt);
}

/** Aggregiert die Spiele zur Ewigen Tabelle (Sieg = höchste Punktzahl des Spiels). */
export function aggregateStats(entries: HistoryEntry[]): PlayerStats[] {
  const byName = new Map<
    string,
    { name: string; games: number; wins: number; best: number; sum: number }
  >();

  for (const entry of entries) {
    const winners = new Set(entry.winners ?? []);
    for (const player of entry.players ?? []) {
      const key = player.name.trim().toLowerCase();
      const stats = byName.get(key) ?? {
        name: player.name,
        games: 0,
        wins: 0,
        best: 0,
        sum: 0,
      };
      stats.games += 1;
      stats.sum += player.total;
      stats.best = Math.max(stats.best, player.total);
      if (winners.has(player.name)) stats.wins += 1;
      byName.set(key, stats);
    }
  }

  return [...byName.values()]
    .map((s) => ({
      name: s.name,
      games: s.games,
      wins: s.wins,
      best: s.best,
      avg: Math.round(s.sum / s.games),
    }))
    .sort((a, b) => b.wins - a.wins || b.avg - a.avg);
}
