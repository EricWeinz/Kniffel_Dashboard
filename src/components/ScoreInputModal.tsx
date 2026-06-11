import { useEffect, useState, type FormEvent } from 'react';
import { useKniffelStore } from '../store';
import { getCategory, getModeConfig, isValidScore, upperChoices } from '../lib/rules';

/**
 * Eingabedialog für ein freies Feld. Je nach Kategorie-Art:
 * - oberer Block: Schnellwahl "Anzahl Würfel × Augenzahl"
 * - feste Punktzahl: "geschafft" oder "streichen"
 * - Summenkategorien: Zahleneingabe mit Regel-Validierung
 */
export default function ScoreInputModal({ categoryId }: { categoryId: string }) {
  const session = useKniffelStore((s) => s.session);
  const submit = useKniffelStore((s) => s.submit);
  const closeScoreDialog = useKniffelStore((s) => s.closeScoreDialog);
  const busy = useKniffelStore((s) => s.busy);

  const [sumInput, setSumInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Bei Kategoriewechsel Eingaben zurücksetzen
  useEffect(() => {
    setSumInput('');
    setInputError(null);
  }, [categoryId]);

  // Escape schließt den Dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeScoreDialog();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeScoreDialog]);

  if (!session) return null;
  const category = getCategory(session.mode, categoryId);
  if (!category) return null;
  const config = getModeConfig(session.mode);

  const enter = (value: number) => {
    if (busy) return;
    void submit(categoryId, value);
  };

  // Eingegeben wird immer die Augensumme; gespeichert wird Augensumme × Faktor
  // (z. B. Super-Chance × 2). Für normale Summenkategorien ist der Faktor 1.
  const multiplier = category.multiplier ?? 1;
  const rawSum = Number(sumInput);
  const previewPoints =
    sumInput.trim() !== '' && Number.isInteger(rawSum) ? rawSum * multiplier : null;

  const handleSumSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = rawSum * multiplier;
    if (sumInput.trim() === '' || !isValidScore(session.mode, categoryId, value)) {
      setInputError(
        `Erlaubt: 0 (streichen) oder eine Augensumme von ${category.minSum}–${category.maxSum}.`,
      );
      return;
    }
    enter(value);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-sol-base03/60 p-4 sm:items-center"
      onClick={closeScoreDialog}
      role="dialog"
      aria-modal="true"
      aria-label={`Punkte eintragen: ${category.label}`}
    >
      <div
        className="animate-fade-up w-full max-w-sm rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-5 shadow-board"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-sol-base02">{category.label}</h2>
            <p className="mt-0.5 text-sm font-semibold text-sol-base00">{category.hint}</p>
          </div>
          <button
            onClick={closeScoreDialog}
            aria-label="Abbrechen"
            className="-m-1 rounded-lg p-1.5 text-sol-base00 transition hover:bg-sol-base2"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          {/* Oberer Block: Anzahl passender Würfel antippen */}
          {category.kind === 'upper' && (
            <div className="grid grid-cols-3 gap-2">
              {upperChoices(session.mode, category).map((value, count) => (
                <button
                  key={value}
                  onClick={() => enter(value)}
                  disabled={busy}
                  className={`rounded-xl border-2 px-2 py-2.5 text-center shadow-tile transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-50 ${
                    count === 0
                      ? 'border-sol-red/40 bg-sol-red/10'
                      : 'border-sol-base1/40 bg-white/60 hover:border-sol-blue'
                  }`}
                >
                  <span className="block text-xs font-bold text-sol-base00">
                    {count} × {category.face}
                  </span>
                  <span
                    className={`tabular block text-lg font-black ${
                      count === 0 ? 'text-sol-red' : 'text-sol-base02'
                    }`}
                  >
                    {count === 0 ? '✗ 0' : value}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Feste Punktzahl: geschafft oder streichen */}
          {category.kind === 'fixed' && (
            <div className="space-y-2">
              <button
                onClick={() => enter(category.fixedScore!)}
                disabled={busy}
                className="w-full rounded-xl bg-sol-green px-4 py-3 text-lg font-black text-sol-base3 shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
              >
                ✓ Geschafft – {category.fixedScore} Punkte
              </button>
              <button
                onClick={() => enter(0)}
                disabled={busy}
                className="w-full rounded-xl border-2 border-sol-red/50 px-4 py-3 font-black text-sol-red transition hover:bg-sol-red/10 active:translate-y-0.5 disabled:opacity-50"
              >
                ✗ Streichen (0 Punkte)
              </button>
            </div>
          )}

          {/* Summenkategorie: Augensumme eingeben */}
          {category.kind === 'sum' && (
            <form onSubmit={handleSumSubmit} className="space-y-2">
              <label className="block">
                <span className="text-sm font-extrabold text-sol-base01">
                  Augensumme ({config.diceCount} Würfel: {category.minSum}–{category.maxSum})
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={category.maxSum}
                  value={sumInput}
                  onChange={(e) => {
                    setSumInput(e.target.value);
                    setInputError(null);
                  }}
                  autoFocus
                  className="tabular mt-1.5 w-full rounded-xl border-2 border-sol-base1/50 bg-white/60 px-4 py-2.5 text-center text-2xl font-black text-sol-base02 outline-none transition focus:border-sol-blue"
                />
              </label>
              {multiplier > 1 && (
                <p className="rounded-lg bg-sol-yellow/15 px-3 py-2 text-sm font-bold text-sol-base01">
                  ✨ Wird × {multiplier} gewertet
                  {previewPoints !== null && previewPoints > 0 && (
                    <span className="text-sol-orange"> = {previewPoints} Punkte</span>
                  )}
                </p>
              )}
              {inputError && (
                <p className="text-sm font-bold text-sol-red" role="alert">
                  {inputError}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-sol-green px-4 py-3 text-lg font-black text-sol-base3 shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
              >
                ✓ Eintragen
              </button>
              <button
                type="button"
                onClick={() => enter(0)}
                disabled={busy}
                className="w-full rounded-xl border-2 border-sol-red/50 px-4 py-2.5 font-black text-sol-red transition hover:bg-sol-red/10 active:translate-y-0.5 disabled:opacity-50"
              >
                ✗ Streichen (0 Punkte)
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
