import { useState } from 'react';
import { useTheme, themeLogos, themedEmoji } from '../lib/theme';

/**
 * Marken-Symbol für den Kopfbereich: zeigt ein im Theme hinterlegtes Logo
 * (z. B. das Dynamo-Wappen). Es werden mehrere Kandidaten der Reihe nach
 * versucht (WebP zuerst, dann SVG); lädt keiner, wird sauber auf das
 * Theme-Emoji zurückgefallen.
 */
export default function BrandMark({ imgClassName = '' }: { imgClassName?: string }) {
  const theme = useTheme();
  const candidates = themeLogos(theme);
  // Bei jedem Theme-Wechsel wieder beim ersten Kandidaten beginnen.
  const [tried, setTried] = useState<{ theme: string; index: number }>({ theme, index: 0 });
  const index = tried.theme === theme ? tried.index : 0;
  const src = candidates[index];

  if (src) {
    return (
      <img
        src={src}
        alt="Vereinslogo"
        className={imgClassName}
        onError={() => setTried({ theme, index: index + 1 })}
      />
    );
  }
  return <>{themedEmoji(theme, 'dice', '🎲')}</>;
}
