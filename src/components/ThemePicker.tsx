import { applyTheme, useTheme } from '../lib/theme';
import ThemeSwatchGrid from './ThemeSwatchGrid';

/** Farbdesign auswählen (Startseite) – wirkt sofort auf die ganze App und wird gespeichert. */
export default function ThemePicker() {
  const theme = useTheme();

  return (
    <div className="rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-4 shadow-board">
      <span className="text-sm font-extrabold uppercase tracking-wide text-sol-base01">
        🎨 Farbdesign
      </span>
      <div className="mt-2">
        <ThemeSwatchGrid value={theme} onChoose={applyTheme} />
      </div>
    </div>
  );
}
