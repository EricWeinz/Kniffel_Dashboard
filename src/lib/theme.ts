/**
 * Wählbare Farbdesigns. Die eigentlichen Farben liegen als CSS-Variablen in
 * index.css (:root[data-theme=…]); hier steht nur die Liste fürs Auswählen plus
 * das Setzen/Lesen der Auswahl. Umgeschaltet wird über das data-theme-Attribut
 * am <html>, gespeichert wird die Wahl im localStorage.
 */

export interface ThemeOption {
  id: string;
  label: string;
  /** Vorschau für den Auswahl-Button: [Seitenhintergrund, Akzent 1, Akzent 2]. */
  swatch: [string, string, string];
}

export const THEMES: ThemeOption[] = [
  { id: 'klassisch', label: 'Klassisch', swatch: ['#fdf6e3', '#cb4b16', '#268bd2'] },
  { id: 'minze', label: 'Minze', swatch: ['#eefaf4', '#3f9d63', '#e07b54'] },
  { id: 'lavendel', label: 'Lavendel', swatch: ['#f6f3fd', '#6f63cf', '#c96fb0'] },
  { id: 'himmel', label: 'Himmel', swatch: ['#eef8fc', '#2b8fd6', '#e3794e'] },
];

const THEME_KEY = 'kniffel:theme';
const DEFAULT_THEME = THEMES[0];

/** Gespeicherte Wahl lesen; unbekannte/fehlende Werte fallen auf Standard zurück. */
export function getStoredTheme(): string {
  const id = localStorage.getItem(THEME_KEY);
  return THEMES.some((t) => t.id === id) ? (id as string) : DEFAULT_THEME.id;
}

/** Theme anwenden: data-theme setzen, speichern und die mobile Browser-Leiste anpassen. */
export function applyTheme(id: string): void {
  const theme = THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
  document.documentElement.dataset.theme = theme.id;
  localStorage.setItem(THEME_KEY, theme.id);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme.swatch[0]);
}
