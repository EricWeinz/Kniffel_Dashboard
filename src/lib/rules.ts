import type { Category, GameMode, ModeConfig, PlayerTotals, ScoreMap } from '../types';

/**
 * Regelwerk für beide Spielmodi.
 *
 * Klassisches Kniffel: 5 Würfel, Bonus +35 ab 63 Punkten im oberen Block.
 * Kniffel Extrem:      6 Würfel, Bonus +45 ab 73 Punkten im oberen Block,
 *                      erweiterte Kategorien nach offiziellem Regelwerk
 *                      (Zwei Paare, Drei Paare, Zwei Dreier,
 *                      Großes Full-House, Highway, Kniffel Extrem,
 *                      10 oder weniger / 33 oder mehr = je 40 Punkte,
 *                      Super-Chance = Augensumme × 2).
 */

const FACE_LABELS = ['Einser', 'Zweier', 'Dreier', 'Vierer', 'Fünfer', 'Sechser'];
const FACE_HINTS = [
  'Nur Einser zählen',
  'Nur Zweier zählen',
  'Nur Dreier zählen',
  'Nur Vierer zählen',
  'Nur Fünfer zählen',
  'Nur Sechser zählen',
];

/** Oberer Block ist in beiden Modi identisch aufgebaut (1er bis 6er). */
function upperCategories(): Category[] {
  return FACE_LABELS.map((label, i) => ({
    id: `upper-${i + 1}`,
    label,
    hint: FACE_HINTS[i],
    section: 'upper',
    kind: 'upper',
    face: i + 1,
  }));
}

const CLASSIC: ModeConfig = {
  mode: 'classic',
  label: 'Klassisches Kniffel',
  shortLabel: 'Klassisch',
  description: '5 Würfel · 13 Kategorien · Bonus +35 ab 63 Punkten oben',
  diceCount: 5,
  bonusThreshold: 63,
  bonusPoints: 35,
  categories: [
    ...upperCategories(),
    {
      id: 'three-of-a-kind',
      label: 'Dreierpasch',
      hint: 'Mind. 3 gleiche Würfel – alle Augen zählen',
      section: 'lower',
      kind: 'sum',
      minSum: 5,
      maxSum: 30,
    },
    {
      id: 'four-of-a-kind',
      label: 'Viererpasch',
      hint: 'Mind. 4 gleiche Würfel – alle Augen zählen',
      section: 'lower',
      kind: 'sum',
      minSum: 5,
      maxSum: 30,
    },
    {
      id: 'full-house',
      label: 'Full House',
      hint: '3 gleiche + 2 gleiche Würfel',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 25,
    },
    {
      id: 'small-straight',
      label: 'Kleine Straße',
      hint: '4 aufeinanderfolgende Zahlen',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 30,
    },
    {
      id: 'large-straight',
      label: 'Große Straße',
      hint: '5 aufeinanderfolgende Zahlen',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 40,
    },
    {
      id: 'kniffel',
      label: 'Kniffel',
      hint: '5 gleiche Würfel',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 50,
    },
    {
      id: 'chance',
      label: 'Chance',
      hint: 'Alle Augen zählen',
      section: 'lower',
      kind: 'sum',
      minSum: 5,
      maxSum: 30,
    },
  ],
};

const EXTREM: ModeConfig = {
  mode: 'extrem',
  label: 'Kniffel Extrem',
  shortLabel: 'Extrem',
  description: '6 Würfel · 22 Kategorien · Bonus +45 ab 73 Punkten oben',
  diceCount: 6,
  bonusThreshold: 73,
  bonusPoints: 45,
  categories: [
    ...upperCategories(),
    {
      id: 'three-of-a-kind',
      label: 'Dreierpasch',
      hint: 'Mind. 3 gleiche Würfel – alle Augen zählen',
      section: 'lower',
      kind: 'sum',
      minSum: 6,
      maxSum: 36,
    },
    {
      id: 'four-of-a-kind',
      label: 'Viererpasch',
      hint: 'Mind. 4 gleiche Würfel – alle Augen zählen',
      section: 'lower',
      kind: 'sum',
      minSum: 6,
      maxSum: 36,
    },
    {
      id: 'two-pairs',
      label: 'Zwei Paare',
      hint: '2 verschiedene Paare – alle Augen zählen',
      section: 'lower',
      kind: 'sum',
      minSum: 6,
      maxSum: 36,
    },
    {
      id: 'three-pairs',
      label: 'Drei Paare',
      hint: '3 verschiedene Paare',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 35,
    },
    {
      id: 'two-three-of-a-kind',
      label: 'Zwei Dreier',
      hint: '2 × drei gleiche Würfel',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 45,
    },
    {
      id: 'full-house',
      label: 'Full-House',
      hint: '3 gleiche + 2 gleiche Würfel',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 25,
    },
    {
      id: 'big-full-house',
      label: 'Großes Full-House',
      hint: '4 gleiche + 2 gleiche Würfel',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 45,
    },
    {
      id: 'small-straight',
      label: 'Kleine Straße',
      hint: '4 aufeinanderfolgende Zahlen',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 30,
    },
    {
      id: 'large-straight',
      label: 'Große Straße',
      hint: '5 aufeinanderfolgende Zahlen',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 40,
    },
    {
      id: 'highway',
      label: 'Highway',
      hint: '6 aufeinanderfolgende Zahlen (1–6)',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 50,
    },
    {
      id: 'kniffel',
      label: 'Kniffel',
      hint: '5 gleiche Würfel',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 50,
    },
    {
      id: 'kniffel-extrem',
      label: 'Kniffel Extrem',
      hint: '6 gleiche Würfel',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 75,
    },
    {
      id: 'ten-or-less',
      label: '10 oder weniger',
      hint: 'Augensumme aller Würfel höchstens 10',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 40,
    },
    {
      id: 'thirty-three-or-more',
      label: '33 oder mehr',
      hint: 'Augensumme aller Würfel mindestens 33',
      section: 'lower',
      kind: 'fixed',
      fixedScore: 40,
    },
    {
      id: 'chance',
      label: 'Chance',
      hint: 'Alle Augen zählen',
      section: 'lower',
      kind: 'sum',
      minSum: 6,
      maxSum: 36,
    },
    {
      id: 'super-chance',
      label: 'Super-Chance',
      hint: 'Alle Augen zählen – wird × 2 gewertet',
      section: 'lower',
      kind: 'sum',
      minSum: 6,
      maxSum: 36,
      multiplier: 2,
    },
  ],
};

const CONFIGS: Record<GameMode, ModeConfig> = { classic: CLASSIC, extrem: EXTREM };

export function getModeConfig(mode: GameMode): ModeConfig {
  return CONFIGS[mode];
}

export function getCategory(mode: GameMode, categoryId: string): Category | undefined {
  return CONFIGS[mode].categories.find((c) => c.id === categoryId);
}

/**
 * Prüft, ob `value` ein regelkonformer Eintrag für die Kategorie ist.
 * 0 ist immer erlaubt (Feld streichen). Diese Funktion läuft auch innerhalb
 * der Firebase-Transaktion, damit kein Client ungültige Werte schreiben kann.
 */
export function isValidScore(mode: GameMode, categoryId: string, value: number): boolean {
  const category = getCategory(mode, categoryId);
  if (!category) return false;
  if (!Number.isInteger(value) || value < 0) return false;
  if (value === 0) return true;

  const dice = CONFIGS[mode].diceCount;
  switch (category.kind) {
    case 'upper':
      // Nur Vielfache der Augenzahl, maximal Anzahl Würfel × Augenzahl
      return value % category.face! === 0 && value <= category.face! * dice;
    case 'fixed':
      return value === category.fixedScore;
    case 'sum': {
      // Gespeichert wird der Endwert (Augensumme × Faktor), z. B. Super-Chance × 2.
      const multiplier = category.multiplier ?? 1;
      return (
        value % multiplier === 0 &&
        value / multiplier >= category.minSum! &&
        value / multiplier <= category.maxSum!
      );
    }
  }
}

/** Alle gültigen Werte einer 'upper'-Kategorie, z. B. Vierer: [0, 4, 8, 12, 16, 20(, 24)]. */
export function upperChoices(mode: GameMode, category: Category): number[] {
  const dice = CONFIGS[mode].diceCount;
  return Array.from({ length: dice + 1 }, (_, i) => i * category.face!);
}

/**
 * Berechnet alle Zwischensummen und die Endsumme eines Spielers.
 * Bonus-Logik: Klassisch +35 ab 63, Extrem +45 ab 73 Punkten im oberen Block.
 */
export function computeTotals(mode: GameMode, scores: ScoreMap | undefined): PlayerTotals {
  const config = CONFIGS[mode];
  const s = scores ?? {};

  let upperSum = 0;
  let lowerSum = 0;
  let filledCount = 0;

  for (const category of config.categories) {
    const value = s[category.id];
    if (value === undefined) continue;
    filledCount += 1;
    if (category.section === 'upper') upperSum += value;
    else lowerSum += value;
  }

  const bonus = upperSum >= config.bonusThreshold ? config.bonusPoints : 0;
  const upperTotal = upperSum + bonus;

  return {
    upperSum,
    bonus,
    upperTotal,
    lowerSum,
    grandTotal: upperTotal + lowerSum,
    filledCount,
    isComplete: filledCount >= config.categories.length,
  };
}

/** Sind alle Zettel vollständig ausgefüllt? Dann ist das Spiel vorbei. */
export function isGameComplete(
  mode: GameMode,
  players: Record<string, { scores?: ScoreMap }>,
  playerOrder: string[],
): boolean {
  return playerOrder.every((id) => computeTotals(mode, players[id]?.scores).isComplete);
}
