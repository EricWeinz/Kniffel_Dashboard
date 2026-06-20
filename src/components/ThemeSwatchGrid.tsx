import { THEMES } from '../lib/theme';

/** Reine Darstellung der Theme-Auswahl (Farbpunkte + Name). Zustand kommt von außen. */
export default function ThemeSwatchGrid({
  value,
  onChoose,
}: {
  value: string;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {THEMES.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChoose(t.id)}
            aria-pressed={active}
            className={`rounded-xl border-2 p-2 transition ${
              active
                ? 'border-sol-orange bg-sol-orange/10 shadow-tile'
                : 'border-sol-base1/40 hover:border-sol-base1'
            }`}
          >
            <span className="flex justify-center gap-0.5">
              {t.swatch.map((color, i) => (
                <span
                  key={i}
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ background: color }}
                />
              ))}
            </span>
            <span className="mt-1 block text-center text-[11px] font-bold text-sol-base01">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
