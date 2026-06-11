import { create } from 'zustand';
import type { GameMode, Session } from './types';
import {
  createSession,
  deleteIfExpired,
  isSessionExpired,
  joinSession,
  leaveLobby,
  normalizeCode,
  rematch,
  SessionError,
  startGame,
  submitScore,
  subscribeToSession,
  MAX_NAME_LENGTH,
} from './lib/session';

/**
 * Globaler Client-State (Zustand). Die Sitzung selbst lebt in Firebase –
 * dieser Store hält nur das lokale Abbild plus UI-Zustand und sorgt dafür,
 * dass nach einem Reload automatisch wieder verbunden wird.
 */

const PLAYER_ID_KEY = 'kniffel:playerId';
const NAME_KEY = 'kniffel:playerName';
const LAST_SESSION_KEY = 'kniffel:lastSession';

/** Stabile Spieler-ID pro Browser, damit Reload = Reconnect statt Doppel-Beitritt. */
function loadPlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

interface KniffelStore {
  playerId: string;
  playerName: string;
  sessionCode: string | null;
  session: Session | null;
  busy: boolean;
  error: string | null;
  /** Kategorie-ID, für die gerade der Eingabedialog offen ist. */
  openCategoryId: string | null;

  setPlayerName: (name: string) => void;
  clearError: () => void;
  openScoreDialog: (categoryId: string) => void;
  closeScoreDialog: () => void;

  create: (mode: GameMode) => Promise<void>;
  join: (code: string) => Promise<void>;
  resumeLastSession: () => void;
  start: () => Promise<void>;
  submit: (categoryId: string, value: number) => Promise<void>;
  startRematch: () => Promise<void>;
  leave: () => Promise<void>;
}

let unsubscribe: (() => void) | null = null;

function detachSession(): void {
  unsubscribe?.();
  unsubscribe = null;
}

export const useKniffelStore = create<KniffelStore>((set, get) => {
  /** Live-Abo aufbauen; bei gelöschter Sitzung sauber zurück zur Startseite. */
  function attachSession(code: string): void {
    detachSession();
    const { playerId } = get();
    unsubscribe = subscribeToSession(code, playerId, (session) => {
      if (session === null || isSessionExpired(session)) {
        const expired = session !== null;
        detachSession();
        localStorage.removeItem(LAST_SESSION_KEY);
        set({
          session: null,
          sessionCode: null,
          openCategoryId: null,
          error: expired
            ? 'Diese Sitzung ist abgelaufen (älter als 24 Stunden) und wurde gelöscht.'
            : 'Die Sitzung wurde beendet oder existiert nicht mehr.',
        });
        if (expired) void deleteIfExpired(code);
        return;
      }
      set({ session, sessionCode: code });
    });
    localStorage.setItem(LAST_SESSION_KEY, code);
  }

  async function withBusy(action: () => Promise<void>): Promise<void> {
    set({ busy: true, error: null });
    try {
      await action();
    } catch (err) {
      const message =
        err instanceof SessionError
          ? err.message
          : 'Verbindung zu Firebase fehlgeschlagen. Bitte Internetverbindung prüfen.';
      console.error(err);
      set({ error: message });
    } finally {
      set({ busy: false });
    }
  }

  return {
    playerId: loadPlayerId(),
    playerName: localStorage.getItem(NAME_KEY) ?? '',
    sessionCode: null,
    session: null,
    busy: false,
    error: null,
    openCategoryId: null,

    setPlayerName: (name) => {
      const trimmed = name.slice(0, MAX_NAME_LENGTH);
      localStorage.setItem(NAME_KEY, trimmed);
      set({ playerName: trimmed });
    },

    clearError: () => set({ error: null }),
    openScoreDialog: (categoryId) => set({ openCategoryId: categoryId }),
    closeScoreDialog: () => set({ openCategoryId: null }),

    create: async (mode) => {
      const { playerId, playerName } = get();
      const name = playerName.trim();
      if (!name) {
        set({ error: 'Bitte zuerst einen Anzeigenamen eingeben.' });
        return;
      }
      await withBusy(async () => {
        const code = await createSession(mode, playerId, name);
        attachSession(code);
      });
    },

    join: async (rawCode) => {
      const { playerId, playerName } = get();
      const name = playerName.trim();
      const code = normalizeCode(rawCode);
      if (!name) {
        set({ error: 'Bitte zuerst einen Anzeigenamen eingeben.' });
        return;
      }
      if (code.length !== 6) {
        set({ error: 'Der Sitzungscode besteht aus 6 Zeichen.' });
        return;
      }
      await withBusy(async () => {
        await joinSession(code, playerId, name);
        attachSession(code);
      });
    },

    /** Nach Reload: letzte Sitzung still wieder verbinden (falls noch Mitglied). */
    resumeLastSession: () => {
      const code = localStorage.getItem(LAST_SESSION_KEY);
      if (!code || get().sessionCode) return;
      const { playerId } = get();
      detachSession();
      unsubscribe = subscribeToSession(code, playerId, (session) => {
        if (session === null || !session.players?.[playerId] || isSessionExpired(session)) {
          detachSession();
          localStorage.removeItem(LAST_SESSION_KEY);
          // Abgelaufene Sitzungen beim Wiederverbinden gleich mit aufräumen
          if (session !== null && isSessionExpired(session)) void deleteIfExpired(code);
          return;
        }
        set({ session, sessionCode: code });
      });
    },

    start: async () => {
      const { sessionCode, playerId } = get();
      if (!sessionCode) return;
      await withBusy(() => startGame(sessionCode, playerId));
    },

    submit: async (categoryId, value) => {
      const { sessionCode, playerId } = get();
      if (!sessionCode) return;
      await withBusy(async () => {
        await submitScore(sessionCode, playerId, categoryId, value);
        set({ openCategoryId: null });
      });
    },

    startRematch: async () => {
      const { sessionCode, playerId } = get();
      if (!sessionCode) return;
      await withBusy(() => rematch(sessionCode, playerId));
    },

    leave: async () => {
      const { sessionCode, playerId, session } = get();
      detachSession();
      localStorage.removeItem(LAST_SESSION_KEY);
      set({ session: null, sessionCode: null, openCategoryId: null, error: null });
      // In der Lobby auch serverseitig austragen; im laufenden Spiel bleibt
      // der Zettel erhalten (Reconnect über denselben Browser möglich).
      if (sessionCode && session?.state === 'lobby') {
        try {
          await leaveLobby(sessionCode, playerId);
        } catch {
          // Verlassen darf nie an einem Netzwerkfehler scheitern
        }
      }
    },
  };
});
