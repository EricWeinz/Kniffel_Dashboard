/** Gemeinsame Typen für Spiellogik und Firebase-Datenmodell. */

export type GameMode = 'classic' | 'extrem';

export type SessionState = 'lobby' | 'playing' | 'finished';

export type CategorySection = 'upper' | 'lower';

/**
 * Wie eine Kategorie gewertet wird:
 * - 'upper': Nur Würfel mit der passenden Augenzahl zählen (Vielfache von `face`)
 * - 'sum':   Summe aller Würfel (freier Wert innerhalb von min/max)
 * - 'fixed': Fester Punktwert oder 0 (gestrichen)
 */
export type CategoryKind = 'upper' | 'sum' | 'fixed';

export interface Category {
  id: string;
  label: string;
  /** Kurze Regel-Erklärung, wird im Eingabedialog angezeigt. */
  hint: string;
  section: CategorySection;
  kind: CategoryKind;
  /** Augenzahl für Kategorien des oberen Blocks (1–6). */
  face?: number;
  /** Punktwert für 'fixed'-Kategorien (z. B. Full House = 25). */
  fixedScore?: number;
  /** Kleinste sinnvolle Augensumme ungleich 0 für 'sum'-Kategorien. */
  minSum?: number;
  /** Größtmögliche Augensumme für 'sum'-Kategorien. */
  maxSum?: number;
  /** Faktor auf die Augensumme (z. B. Super-Chance: × 2). Standard: 1. */
  multiplier?: number;
}

export interface ModeConfig {
  mode: GameMode;
  label: string;
  shortLabel: string;
  description: string;
  diceCount: number;
  /** Ab dieser Summe im oberen Block gibt es den Bonus. */
  bonusThreshold: number;
  bonusPoints: number;
  categories: Category[];
}

/** Punktestand eines Spielers: Kategorie-ID -> eingetragener Wert. */
export type ScoreMap = Record<string, number>;

export interface Player {
  name: string;
  joinedAt: number;
  online?: boolean;
  scores?: ScoreMap;
}

/** Letzter Punkteeintrag – Grundlage für die Korrektur-Funktion (Undo). */
export interface LastMove {
  playerId: string;
  categoryId: string;
  /** turnIndex zum Zeitpunkt des Eintrags, damit der Zug zurückgegeben werden kann. */
  prevTurnIndex: number;
  at: number;
}

/** Wurzelobjekt einer Sitzung unter sessions/{code} in der Realtime Database. */
export interface Session {
  mode: GameMode;
  state: SessionState;
  hostId: string;
  createdAt: number;
  finishedAt?: number;
  /** Spielreihenfolge (Spieler-IDs), wird beim Start festgelegt. */
  playerOrder?: string[];
  /** Index in playerOrder: wer gerade am Zug ist. */
  turnIndex: number;
  /** Letzter Eintrag, kann vom Spieler selbst oder vom Host zurückgenommen werden. */
  lastMove?: LastMove;
  players: Record<string, Player>;
}

/** Ergebnis eines Spielers in einem archivierten Spiel (Ewige Tabelle). */
export interface HistoryPlayer {
  name: string;
  total: number;
}

/** Archiviertes Spiel unter history/{code}-{createdAt} in der Realtime Database. */
export interface HistoryEntry {
  mode: GameMode;
  finishedAt: number;
  players: HistoryPlayer[];
  /** Namen der Sieger (bei Gleichstand mehrere). */
  winners: string[];
}

/** Aggregierte Langzeit-Statistik eines Spielernamens. */
export interface PlayerStats {
  name: string;
  games: number;
  wins: number;
  best: number;
  avg: number;
}

export interface PlayerTotals {
  upperSum: number;
  bonus: number;
  upperTotal: number;
  lowerSum: number;
  grandTotal: number;
  filledCount: number;
  isComplete: boolean;
}
