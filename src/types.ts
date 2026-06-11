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
  players: Record<string, Player>;
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
