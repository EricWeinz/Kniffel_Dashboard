import { useEffect, useRef, useState } from 'react';
import { THEMES, applyTheme, getStoredTheme } from '../lib/theme';

/**
 * Kompaktes Farbdesign-Menü für die Header während einer Sitzung: ein 🎨-Button,
 * der ein kleines Popover mit der Auswahl öffnet. So lässt sich das Design auch
 * mitten im Spiel umstellen. Schließt bei Klick daneben oder mit Escape.
 *
 * Die Auswahl ist bewusst eine schmale, vertikale Liste (rechtsbündig): So passt
 * sie auch auf schmalen Smartphones komplett auf den Bildschirm und die längeren
 * Namen ("Klassisch", "Lavendel") laufen nicht aus ihren Feldern.
 */
export default function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const ref = useRef<HTMLDivElement>(null);

  const choose = (id: string) => {
    applyTheme(id);
    setTheme(id);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Farbdesign ändern"
        title="Farbdesign ändern"
        className="rounded-xl border-2 border-sol-base1/40 px-3 py-1.5 text-sm font-bold text-sol-base00 transition hover:border-sol-blue hover:text-sol-blue"
      >
        Design
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 z-30 mt-2 w-52 max-w-[calc(100vw-1.5rem)] rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-2 shadow-board"
        >
          <span className="block px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-sol-base01">
            🎨 Farbdesign
          </span>
          <div className="space-y-1">
            {THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => choose(t.id)}
                  className={`flex w-full items-center gap-2 rounded-xl border-2 px-2 py-1.5 text-left transition ${
                    active
                      ? 'border-sol-orange bg-sol-orange/10'
                      : 'border-transparent hover:border-sol-base1/50 hover:bg-sol-base2/40'
                  }`}
                >
                  <span className="flex shrink-0 gap-0.5">
                    {t.swatch.map((color, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ background: color }}
                      />
                    ))}
                  </span>
                  <span className="flex-1 truncate text-sm font-bold text-sol-base02">
                    {t.label}
                  </span>
                  {active && <span className="shrink-0 font-black text-sol-orange">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
