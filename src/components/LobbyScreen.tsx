import { useState, type FormEvent } from 'react';
import { useKniffelStore } from '../store';
import { getModeConfig } from '../lib/rules';
import { normalizeCode } from '../lib/session';
import type { GameMode } from '../types';
import StatsScreen from './StatsScreen';

const MODES: GameMode[] = ['classic', 'extrem'];

/** Startseite: Name eingeben, Modus wählen, Sitzung erstellen oder beitreten. */
export default function LobbyScreen() {
  const playerName = useKniffelStore((s) => s.playerName);
  const setPlayerName = useKniffelStore((s) => s.setPlayerName);
  const create = useKniffelStore((s) => s.create);
  const join = useKniffelStore((s) => s.join);
  const busy = useKniffelStore((s) => s.busy);

  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [showStats, setShowStats] = useState(false);
  // Einladungslinks haben die Form https://…/?code=ABC123
  const [joinCode, setJoinCode] = useState(() =>
    normalizeCode(new URLSearchParams(window.location.search).get('code') ?? ''),
  );

  if (showStats) return <StatsScreen onBack={() => setShowStats(false)} />;

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    void create(selectedMode);
  };

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    void join(joinCode);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="animate-fade-up w-full max-w-md">
        <header className="mb-6 text-center">
          <div className="text-6xl" aria-hidden>
            🎲
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-sol-base02">
            Kniffel<span className="text-sol-orange"> Dashboard</span>
          </h1>
          <p className="mt-1 font-semibold text-sol-base00">
            Der Online-Spielblock für bis zu 6 Spieler – live synchronisiert.
          </p>
        </header>

        <div className="rounded-2xl border-2 border-sol-base2 bg-sol-base3 p-5 shadow-board">
          {/* Anzeigename */}
          <label className="block">
            <span className="text-sm font-extrabold uppercase tracking-wide text-sol-base01">
              Dein Anzeigename
            </span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="z. B. Eric"
              maxLength={20}
              autoComplete="nickname"
              className="mt-1.5 w-full rounded-xl border-2 border-sol-base1/50 bg-white/60 px-4 py-2.5 text-lg font-bold text-sol-base02 outline-none transition focus:border-sol-blue"
            />
          </label>

          {/* Modusauswahl */}
          <fieldset className="mt-5">
            <legend className="text-sm font-extrabold uppercase tracking-wide text-sol-base01">
              Spielmodus
            </legend>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MODES.map((mode) => {
                const config = getModeConfig(mode);
                const active = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    aria-pressed={active}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      active
                        ? 'border-sol-orange bg-sol-orange/10 shadow-tile'
                        : 'border-sol-base1/40 bg-white/40 hover:border-sol-base1'
                    }`}
                  >
                    <span className="block font-black text-sol-base02">
                      {mode === 'classic' ? '🎯 ' : '💀 '}
                      {config.label}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-sol-base00">
                      {config.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Sitzung erstellen */}
          <form onSubmit={handleCreate} className="mt-5">
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-sol-green px-4 py-3 text-lg font-black text-sol-base3 shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
            >
              {busy ? 'Bitte warten …' : '✨ Neue Sitzung erstellen'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-sm font-bold text-sol-base1">
            <span className="h-0.5 flex-1 rounded bg-sol-base2" />
            oder
            <span className="h-0.5 flex-1 rounded bg-sol-base2" />
          </div>

          {/* Sitzung beitreten */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(normalizeCode(e.target.value).slice(0, 6))}
              placeholder="CODE"
              aria-label="Sitzungscode"
              className="w-full flex-1 rounded-xl border-2 border-sol-base1/50 bg-white/60 px-4 py-2.5 text-center text-lg font-black uppercase tracking-[0.3em] text-sol-base02 outline-none transition placeholder:tracking-normal focus:border-sol-blue"
            />
            <button
              type="submit"
              disabled={busy || joinCode.length !== 6}
              className="rounded-xl bg-sol-blue px-5 py-2.5 font-black text-sol-base3 shadow-tile transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-50"
            >
              Beitreten
            </button>
          </form>
        </div>

        <button
          onClick={() => setShowStats(true)}
          className="mt-4 w-full rounded-xl border-2 border-sol-base1/40 px-4 py-2.5 font-bold text-sol-base01 transition hover:border-sol-violet hover:text-sol-violet"
        >
          📊 Ewige Tabelle
        </button>

        <p className="mt-4 text-center text-xs font-semibold text-sol-base0">
          Sitzungscode mit Freunden teilen – alle sehen jeden Eintrag sofort.
        </p>
      </div>
    </main>
  );
}
