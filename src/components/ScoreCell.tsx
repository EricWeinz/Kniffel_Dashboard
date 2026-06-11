/**
 * Eine Zelle des Spielblocks.
 * - ausgefüllt: gesperrt und grau (0 = gestrichen, durchgestrichen dargestellt)
 * - frei + eigene Spalte + am Zug: anklickbar zum Eintragen
 * - sonst: leerer Platzhalter
 */
interface ScoreCellProps {
  value: number | undefined;
  clickable: boolean;
  isActiveColumn: boolean;
  onClick: () => void;
}

export default function ScoreCell({ value, clickable, isActiveColumn, onClick }: ScoreCellProps) {
  const columnTint = isActiveColumn ? 'bg-sol-orange/5' : '';

  if (value !== undefined) {
    return (
      <td className={`px-1.5 py-1 text-center ${columnTint}`}>
        <span
          className={`tabular inline-flex h-9 w-full min-w-12 items-center justify-center rounded-lg bg-sol-base2 font-extrabold ${
            value === 0 ? 'text-sol-base1 line-through' : 'text-sol-base01'
          }`}
        >
          {value}
        </span>
      </td>
    );
  }

  if (clickable) {
    return (
      <td className={`px-1.5 py-1 text-center ${columnTint}`}>
        <button
          onClick={onClick}
          aria-label="Punkte eintragen"
          className="inline-flex h-9 w-full min-w-12 items-center justify-center rounded-lg border-2 border-dashed border-sol-orange/70 font-black text-sol-orange transition hover:bg-sol-orange/15 active:scale-95"
        >
          +
        </button>
      </td>
    );
  }

  return (
    <td className={`px-1.5 py-1 text-center ${columnTint}`}>
      <span className="inline-flex h-9 w-full min-w-12 items-center justify-center font-bold text-sol-base1">
        ·
      </span>
    </td>
  );
}
