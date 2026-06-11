import { useState } from 'react';
import QRCode from 'react-qr-code';
import { useKniffelStore } from '../store';
import { getModeConfig } from '../lib/rules';
import { MAX_PLAYERS } from '../lib/session';

/** Lobby einer Sitzung: Code teilen, Mitspieler sehen, Spiel starten. */
export default function WaitingRoom() {
  const session = useKniffelStore((s) => s.session);
  const sessionCode = useKniffelStore((s) => s.sessionCode);
  const playerId = useKniffelStore((s) => s.playerId);
  const start = useKniffelStore((s) => s.start);
  const leave = useKniffelStore((s) => s.leave);
  const busy = useKniffelStore((s) => s.busy);

  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  if (!session || !sessionCode) return null;

  const config = getModeConfig(session.mode);
  const isHost = session.hostId === playerId;
  const players = Object.entries(session.players ?? {}).sort(
    ([, a], [, b]) => a.joinedAt - b.joinedAt,
  );
  const hostName = session.players?.[session.hostId]?.name ?? '?';

  const inviteUrl = `${window.location.origin}${window.location.pathname}?code=${sessionCode}`;

  const copy = async (what: 'code' | 'link') => {
    const text = what === 'code' ? sessionCode : inviteUrl;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Manuell kopieren:', text);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="animate-fade-up w-full max-w-md">
        <div className="rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-5 shadow-board">
          <div className="text-center">
            <span className="inline-block rounded-full bg-sol-violet/15 px-3 py-1 text-sm font-extrabold text-sol-violet">
              {session.mode === 'classic' ? '🎯' : '💀'} {config.label}
            </span>
            <h1 className="mt-3 text-xl font-black text-sol-base02">Mitspieler einladen</h1>
            <p className="mt-1 text-sm font-semibold text-sol-base00">
              Diesen Code weitergeben – oder einfach den Link teilen.
            </p>

            {/* Sitzungscode als große "Würfel" */}
            <div className="mt-4 flex justify-center gap-1.5" aria-label={`Sitzungscode ${sessionCode}`}>
              {sessionCode.split('').map((char, i) => (
                <span
                  key={i}
                  className="flex h-12 w-10 items-center justify-center rounded-lg border-2 border-sol-base1/40 bg-white/70 text-2xl font-black text-sol-base02 shadow-tile"
                >
                  {char}
                </span>
              ))}
            </div>

            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={() => copy('code')}
                className="rounded-lg border-2 border-sol-base1/40 px-3 py-1.5 text-sm font-bold text-sol-base01 transition hover:border-sol-blue"
              >
                {copied === 'code' ? '✅ Kopiert' : '📋 Code kopieren'}
              </button>
              <button
                onClick={() => copy('link')}
                className="rounded-lg border-2 border-sol-base1/40 px-3 py-1.5 text-sm font-bold text-sol-base01 transition hover:border-sol-blue"
              >
                {copied === 'link' ? '✅ Kopiert' : '🔗 Link kopieren'}
              </button>
            </div>

            {/* QR-Code: am Tisch einfach abscannen statt Code eintippen */}
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className="rounded-xl border-2 border-sol-base2 bg-white p-2.5 shadow-tile">
                <QRCode value={inviteUrl} size={132} fgColor="#002b36" bgColor="#ffffff" />
              </div>
              <p className="text-xs font-semibold text-sol-base0">
                📱 Mit der Handykamera scannen, um direkt beizutreten
              </p>
            </div>
          </div>

          {/* Spielerliste mit freien Plätzen */}
          <ul className="mt-5 space-y-2">
            {players.map(([id, player]) => (
              <li
                key={id}
                className="flex items-center gap-3 rounded-xl border-2 border-sol-base2 bg-white/40 px-3 py-2"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    player.online ? 'bg-sol-green' : 'bg-sol-base1'
                  }`}
                  title={player.online ? 'online' : 'offline'}
                />
                <span className="flex-1 truncate font-extrabold text-sol-base02">
                  {player.name}
                  {id === playerId && <span className="text-sol-base00"> (du)</span>}
                </span>
                {id === session.hostId && (
                  <span title="Spielleitung" aria-label="Spielleitung">
                    👑
                  </span>
                )}
              </li>
            ))}
            {Array.from({ length: MAX_PLAYERS - players.length }).map((_, i) => (
              <li
                key={`free-${i}`}
                className="rounded-xl border-2 border-dashed border-sol-base1/30 px-3 py-2 text-sm font-semibold text-sol-base1"
              >
                Freier Platz
              </li>
            ))}
          </ul>

          {/* Start nur durch die Spielleitung */}
          <div className="mt-5 space-y-2">
            {isHost ? (
              <button
                onClick={() => void start()}
                disabled={busy}
                className="w-full rounded-xl bg-sol-orange px-4 py-3 text-lg font-black text-sol-base3 shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
              >
                🚀 Spiel starten ({players.length}{' '}
                {players.length === 1 ? 'Spieler' : 'Spieler'})
              </button>
            ) : (
              <p className="rounded-xl bg-sol-base2/70 px-4 py-3 text-center text-sm font-bold text-sol-base01">
                ⏳ Warten, bis {hostName} das Spiel startet …
              </p>
            )}
            <button
              onClick={() => void leave()}
              className="w-full rounded-xl border-2 border-sol-base1/40 px-4 py-2 font-bold text-sol-base00 transition hover:border-sol-red hover:text-sol-red"
            >
              Sitzung verlassen
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
