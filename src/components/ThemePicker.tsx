import { useState } from 'react';
import { applyTheme, getStoredTheme } from '../lib/theme';
import ThemeSwatchGrid from './ThemeSwatchGrid';

/** Farbdesign auswählen (Startseite) – wirkt sofort auf die ganze App und wird gespeichert. */
export default function ThemePicker() {
  const [theme, setTheme] = useState(getStoredTheme);

  const choose = (id: string) => {
    applyTheme(id);
    setTheme(id);
  };

  return (
    <div className="rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-4 shadow-board">
      <span className="text-sm font-extrabold uppercase tracking-wide text-sol-base01">
        🎨 Farbdesign
      </span>
      <div className="mt-2">
        <ThemeSwatchGrid value={theme} onChoose={choose} />
      </div>
    </div>
  );
}
