import { useState } from 'react';

/**
 * Kompakter Code-Chip: Klick kopiert den Einladungslink
 * (https://…/?code=ABC123) in die Zwischenablage.
 */
export default function SessionCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copyInviteLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback für ältere Browser / fehlende Berechtigung
      window.prompt('Link manuell kopieren:', url);
    }
  };

  return (
    <button
      onClick={copyInviteLink}
      title="Einladungslink kopieren"
      className="inline-flex items-center gap-2 rounded-xl border-2 border-sol-base1/40 bg-white/50 px-3 py-1.5 font-black tracking-[0.2em] text-sol-base02 shadow-tile transition hover:border-sol-blue"
    >
      <span className="text-xs tracking-normal text-sol-base00">Code</span>
      {code}
      <span className="text-sm tracking-normal" aria-hidden>
        {copied ? '✅' : '🔗'}
      </span>
    </button>
  );
}
