import { useEffect, useRef, useState } from 'react';
import { applyTheme, getStoredTheme } from '../lib/theme';
import ThemeSwatchGrid from './ThemeSwatchGrid';

/**
 * Kompaktes Farbdesign-Menü für die Header während einer Sitzung: ein 🎨-Button,
 * der ein kleines Popover mit der Auswahl öffnet. So lässt sich das Design auch
 * mitten im Spiel umstellen. Schließt bei Klick daneben oder mit Escape.
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
        title="Farbdesign"
        className="rounded-xl border-2 border-sol-base1/40 px-3 py-1.5 text-sm font-bold text-sol-base00 transition hover:border-sol-blue hover:text-sol-blue"
      >
        🎨
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 z-30 mt-2 w-60 rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-3 shadow-board"
        >
          <span className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-sol-base01">
            🎨 Farbdesign
          </span>
          <ThemeSwatchGrid value={theme} onChoose={choose} />
        </div>
      )}
    </div>
  );
}
