import { useSyncExternalStore } from 'react';

/**
 * Wählbare Farbdesigns. Die eigentlichen Farben liegen als CSS-Variablen in
 * index.css (:root[data-theme=…]); hier steht die Liste fürs Auswählen, das
 * Setzen/Lesen der Auswahl sowie theme-spezifische Emojis/Konfetti.
 * Umgeschaltet wird über das data-theme-Attribut am <html>, gespeichert wird
 * die Wahl im localStorage. Über useTheme ist das aktive Theme reaktiv abrufbar.
 */

export interface ThemeOption {
  id: string;
  label: string;
  /** Vorschau für den Auswahl-Button: [Seitenhintergrund, Akzent 1, Akzent 2]. */
  swatch: [string, string, string];
}

export const THEMES: ThemeOption[] = [
  { id: 'klassisch', label: 'Klassisch', swatch: ['#fdf6e3', '#cb4b16', '#268bd2'] },
  { id: 'weiss', label: 'Weiß', swatch: ['#ffffff', '#1f7fe0', '#e4572e'] },
  { id: 'minze', label: 'Minze', swatch: ['#d6f5e8', '#1f9d57', '#f0683a'] },
  { id: 'lavendel', label: 'Lavendel', swatch: ['#eae0fb', '#6a57e6', '#d44fb0'] },
  { id: 'himmel', label: 'Himmel', swatch: ['#d6effb', '#0b86e2', '#f0703a'] },
  { id: 'dark', label: 'Dark', swatch: ['#151a20', '#3fa0e8', '#44b56e'] },
  { id: 'dynamo', label: 'Dynamo', swatch: ['#060604', '#f3ac26', '#93000e'] },
];

const THEME_KEY = 'kniffel:theme';
const DEFAULT_THEME = THEMES[0];

/**
 * Theme-spezifische Logos (Dateien in public/). Mehrere Kandidaten = Vorrang
 * von links: zuerst WebP (falls abgelegt), sonst das mitgelieferte SVG-Wappen.
 * Fehlen alle, greift das Emoji.
 */
const THEME_LOGO: Record<string, string[]> = {
  dynamo: ['/dynamo-dresden.webp', '/dynamo-dresden.svg'],
};

/** Logo-Kandidaten des Themes (z. B. Vereinswappen), in Reihenfolge des Vorrangs. */
export function themeLogos(theme: string): string[] {
  return THEME_LOGO[theme] ?? [];
}

/** Ursprüngliches Favicon merken, um beim Themewechsel zurückzuschalten. */
const defaultFavicon =
  document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? null;

function readStored(): string {
  const id = localStorage.getItem(THEME_KEY);
  return THEMES.some((t) => t.id === id) ? (id as string) : DEFAULT_THEME.id;
}

let currentTheme = readStored();
const listeners = new Set<() => void>();

/** Gespeicherte Wahl lesen; unbekannte/fehlende Werte fallen auf Standard zurück. */
export function getStoredTheme(): string {
  return readStored();
}

/** Aktuell aktives Theme (Momentaufnahme; reaktiv über useTheme). */
export function getTheme(): string {
  return currentTheme;
}

/** Theme anwenden: data-theme setzen, speichern, Browser-Leiste + Abonnenten aktualisieren. */
export function applyTheme(id: string): void {
  const theme = THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
  currentTheme = theme.id;
  document.documentElement.dataset.theme = theme.id;
  localStorage.setItem(THEME_KEY, theme.id);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme.swatch[0]);
  // Favicon ans Theme anpassen (Dynamo -> Vereinswappen, sonst Standard-Würfel).
  // Fürs Favicon bevorzugt das SVG (überall zuverlässig), sonst der erste Kandidat.
  const icon = document.querySelector('link[rel="icon"]');
  const logos = THEME_LOGO[theme.id] ?? [];
  const favicon = logos.find((p) => p.endsWith('.svg')) ?? logos[0] ?? defaultFavicon;
  if (icon && favicon) icon.setAttribute('href', favicon);
  listeners.forEach((notify) => notify());
}

/** Reaktiver Zugriff auf das aktive Theme – aktualisiert sich bei jedem Wechsel. */
export function useTheme(): string {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getTheme,
    getTheme,
  );
}

/**
 * Theme-spezifische Emojis. Fehlt ein Eintrag, greift das Standard-Emoji.
 * (Dynamo Dresden: Fußball ⚽ und Löwe 🦁 als Maskottchen-Anspielung.)
 */
type EmojiKey = 'dice' | 'rocket' | 'crown';
const THEME_EMOJI: Record<string, Partial<Record<EmojiKey, string>>> = {
  dynamo: { dice: '⚽', rocket: '⚽', crown: '🦁' },
};

export function themedEmoji(theme: string, key: EmojiKey, fallback: string): string {
  return THEME_EMOJI[theme]?.[key] ?? fallback;
}

/** Konfetti-Farben der Siegerehrung je Theme (Dynamo: schwarz-gelb-weiß). */
export const CONFETTI_COLORS: Record<string, string[]> = {
  dynamo: ['#f3ac26', '#fdfdfd', '#93000e', '#060604', '#f3ac26'],
};
