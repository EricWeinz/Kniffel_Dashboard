import {
  ref,
  onValue,
  onDisconnect,
  runTransaction,
  set,
  type DatabaseReference,
} from 'firebase/database';
import { getDb } from '../firebase';
import type { GameMode, Session } from '../types';
import { computeTotals, isGameComplete, isValidScore } from './rules';

/**
 * Synchronisierungslogik: Alle schreibenden Spielzüge laufen als
 * Firebase-Transaktionen auf dem kompletten Sitzungsknoten. Dadurch können
 * zwei Clients niemals gleichzeitig widersprüchliche Zustände erzeugen
 * (z. B. doppelter Zug, Feld überschreiben, 7. Spieler beim Beitritt).
 *
 * Wichtiges Transaktions-Detail: Beim ersten Aufruf bekommt der Callback oft
 * den lokalen Cache-Wert `null`, obwohl die Sitzung auf dem Server existiert.
 * Wir geben dann `null` unverändert zurück – der Server lehnt das wegen des
 * Hash-Vergleichs ab und ruft den Callback erneut mit den echten Daten auf.
 * Erst wenn der Server-Commit mit `null` durchgeht, existiert die Sitzung
 * wirklich nicht.
 */

export const MAX_PLAYERS = 6;
export const MAX_NAME_LENGTH = 20;

/**
 * Sitzungen verfallen 24 h nach Erstellung. Da es keinen eigenen Server gibt,
 * räumen die Clients selbst auf: Wer einer abgelaufenen Sitzung beitritt oder
 * sich wieder verbindet, löscht sie dabei aus der Datenbank.
 */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function isSessionExpired(session: Pick<Session, 'createdAt'>): boolean {
  return Date.now() - session.createdAt > SESSION_TTL_MS;
}

/** Löscht eine Sitzung transaktional – aber nur, wenn sie wirklich abgelaufen ist. */
export async function deleteIfExpired(code: string): Promise<void> {
  await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    return isSessionExpired(session) ? null : session;
  });
}

/** Ohne 0/O und 1/I, damit der Code mündlich gut weitergegeben werden kann. */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function randomCode(): string {
  let code = '';
  const random = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(random);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[random[i] % CODE_CHARS.length];
  }
  return code;
}

function sessionRef(code: string): DatabaseReference {
  return ref(getDb(), `sessions/${code}`);
}

/**
 * Nächster Spieler ab `startIndex`, dessen Zettel noch nicht voll ist.
 * Fertige Spieler werden übersprungen (wichtig, wenn der Host ein altes Feld
 * freigegeben hat und dadurch die Füllstände auseinanderlaufen).
 */
function nextIncompleteIndex(
  session: Session,
  order: string[],
  startIndex: number,
  includeStart: boolean,
): number {
  const count = order.length;
  if (count === 0) return 0;
  for (let step = includeStart ? 0 : 1; step <= count; step++) {
    const index = (startIndex + step) % count;
    const player = session.players?.[order[index]];
    if (!computeTotals(session.mode, player?.scores).isComplete) return index;
  }
  return startIndex % count;
}

/**
 * Gewünschte Spielerreihenfolge mit dem aktuellen Spielerstand abgleichen:
 * nicht mehr vorhandene IDs fallen raus, fehlende (z. B. gerade beigetretene)
 * werden nach Beitrittszeit hinten angehängt. Ist `desired` leer, ergibt sich
 * automatisch die reine Beitrittsreihenfolge. So bleibt die Liste konsistent,
 * auch wenn parallel jemand beitritt oder geht.
 */
function reconcileOrder(session: Session, desired: string[]): string[] {
  const players = session.players ?? {};
  const present = desired.filter((id) => players[id]);
  const missing = Object.keys(players)
    .filter((id) => !present.includes(id))
    .sort((a, b) => players[a].joinedAt - players[b].joinedAt);
  return [...present, ...missing];
}

/** Aktuelle Lobby-Reihenfolge: gespeicherte Reihenfolge + neue Spieler hinten. */
export function effectivePlayerOrder(session: Session): string[] {
  return reconcileOrder(session, session.playerOrder ?? []);
}

export class SessionError extends Error {}

/** Erstellt eine neue Sitzung mit kollisionsfreiem 6-stelligem Code. */
export async function createSession(
  mode: GameMode,
  playerId: string,
  playerName: string,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const result = await runTransaction(sessionRef(code), (current: Session | null) => {
      if (current !== null) return undefined; // Code bereits vergeben -> Abbruch, neuer Versuch
      const session: Session = {
        mode,
        state: 'lobby',
        hostId: playerId,
        createdAt: Date.now(),
        turnIndex: 0,
        players: {
          [playerId]: { name: playerName, joinedAt: Date.now(), online: true },
        },
      };
      return session;
    });
    if (result.committed) return code;
  }
  throw new SessionError('Es konnte kein freier Sitzungscode erzeugt werden. Bitte erneut versuchen.');
}

/**
 * Tritt einer Sitzung bei. Erlaubt auch das Wiederbetreten (Reconnect)
 * eines bekannten Spielers während eines laufenden Spiels.
 */
export async function joinSession(
  code: string,
  playerId: string,
  playerName: string,
): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null; // siehe Kommentar oben: Server-Roundtrip erzwingen
    failure = null;

    if (isSessionExpired(session)) {
      failure = 'Diese Sitzung ist abgelaufen (älter als 24 Stunden).';
      return null; // abgelaufene Sitzung dabei gleich löschen
    }

    const players = session.players ?? {};
    if (players[playerId]) {
      // Reconnect: Name ggf. aktualisieren, sonst nichts ändern
      players[playerId].name = playerName;
      session.players = players;
      return session;
    }
    if (session.state !== 'lobby') {
      failure = 'Dieses Spiel läuft bereits – Beitritt ist nur in der Lobby möglich.';
      return undefined;
    }
    if (Object.keys(players).length >= MAX_PLAYERS) {
      failure = `Diese Sitzung ist voll (maximal ${MAX_PLAYERS} Spieler).`;
      return undefined;
    }
    // Namen müssen innerhalb einer Sitzung eindeutig sein (ohne Beachtung von
    // Groß-/Kleinschreibung): Sonst sind die Spalten auf dem Block nicht
    // unterscheidbar und gleiche Namen würden in der Ewigen Tabelle vermengt.
    const wanted = playerName.trim().toLowerCase();
    if (Object.values(players).some((p) => p.name.trim().toLowerCase() === wanted)) {
      failure = `Der Name „${playerName}“ ist in dieser Sitzung schon vergeben. Bitte wähle einen anderen.`;
      return undefined;
    }
    players[playerId] = { name: playerName, joinedAt: Date.now(), online: true };
    session.players = players;
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError(`Keine Sitzung mit dem Code „${code}“ gefunden.`);
  }
  if (!result.committed) {
    throw new SessionError('Beitritt fehlgeschlagen. Bitte erneut versuchen.');
  }
}

/**
 * Nur der Host startet das Spiel. Reihenfolge = die in der Lobby festgelegte
 * Reihenfolge (Standard, falls nicht angepasst: Beitrittsreihenfolge).
 */
export async function startGame(code: string, playerId: string): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    if (session.hostId !== playerId) {
      failure = 'Nur die Spielleitung kann das Spiel starten.';
      return undefined;
    }
    if (session.state !== 'lobby') return session; // bereits gestartet -> idempotent
    const order = effectivePlayerOrder(session);
    if (order.length === 0) {
      failure = 'Keine Spieler in der Sitzung.';
      return undefined;
    }
    session.playerOrder = order;
    session.turnIndex = 0;
    session.state = 'playing';
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/**
 * Spielreihenfolge in der Lobby anpassen – nur die Spielleitung, nur vor dem
 * Start (z. B. passend zur Sitzordnung). Die gewünschte Reihenfolge wird
 * serverseitig mit dem aktuellen Spielerstand abgeglichen (siehe reconcileOrder),
 * damit bei gleichzeitigem Beitritt/Verlassen niemand verloren geht.
 */
export async function setPlayerOrder(
  code: string,
  byPlayerId: string,
  desiredOrder: string[],
): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    if (session.hostId !== byPlayerId) {
      failure = 'Nur die Spielleitung kann die Reihenfolge ändern.';
      return undefined;
    }
    if (session.state !== 'lobby') return session; // nach dem Start nicht mehr änderbar
    session.playerOrder = reconcileOrder(session, desiredOrder);
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/**
 * Trägt einen Punktwert ein. Die Transaktion stellt sicher:
 * 1. Der Spieler ist wirklich am Zug.
 * 2. Das Feld ist noch frei.
 * 3. Der Wert ist nach den Regeln des Modus gültig.
 * Danach wird der Zug weitergegeben und ggf. das Spielende erkannt.
 */
export async function submitScore(
  code: string,
  playerId: string,
  categoryId: string,
  value: number,
): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    if (session.state !== 'playing') {
      failure = 'Das Spiel läuft gerade nicht.';
      return undefined;
    }
    const order = session.playerOrder ?? [];
    const currentId = order[session.turnIndex % order.length];
    if (currentId !== playerId) {
      failure = 'Du bist gerade nicht am Zug.';
      return undefined;
    }
    const player = session.players?.[playerId];
    if (!player) {
      failure = 'Spieler nicht in der Sitzung gefunden.';
      return undefined;
    }
    const scores = player.scores ?? {};
    if (scores[categoryId] !== undefined) {
      failure = 'Dieses Feld ist bereits ausgefüllt.';
      return undefined;
    }
    if (!isValidScore(session.mode, categoryId, value)) {
      failure = 'Ungültiger Punktwert für diese Kategorie.';
      return undefined;
    }

    const moveIndex = session.turnIndex % order.length;
    scores[categoryId] = value;
    player.scores = scores;
    // Für die Korrektur-Funktion merken; wird vom nächsten Eintrag überschrieben
    session.lastMove = { playerId, categoryId, prevTurnIndex: moveIndex, at: Date.now() };
    session.turnIndex = nextIncompleteIndex(session, order, moveIndex, false);

    if (isGameComplete(session.mode, session.players, order)) {
      session.state = 'finished';
      session.finishedAt = Date.now();
    }
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/**
 * Korrektur: nimmt den letzten Eintrag zurück. Erlaubt für den Spieler, der ihn
 * gemacht hat, sowie für die Spielleitung. Der Zug geht an den Spieler zurück.
 * Funktioniert auch direkt nach Spielende (Spiel läuft dann weiter).
 */
export async function undoLastMove(code: string, playerId: string): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    const lastMove = session.lastMove;
    if (!lastMove) {
      failure = 'Es gibt keinen Eintrag, der zurückgenommen werden kann.';
      return undefined;
    }
    if (playerId !== lastMove.playerId && playerId !== session.hostId) {
      failure = 'Nur der betroffene Spieler oder die Spielleitung kann das.';
      return undefined;
    }
    const scores = session.players?.[lastMove.playerId]?.scores;
    if (!scores || scores[lastMove.categoryId] === undefined) {
      failure = 'Der Eintrag existiert nicht mehr.';
      return undefined;
    }

    delete scores[lastMove.categoryId];
    session.turnIndex = lastMove.prevTurnIndex; // Zug zurück an den Spieler
    delete session.lastMove;
    if (session.state === 'finished') {
      session.state = 'playing';
      delete session.finishedAt;
    }
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/**
 * Spielleitung gibt ein beliebiges ausgefülltes Feld wieder frei (z. B. bei
 * Falscheingaben, die erst später auffallen). Der Spieler füllt es in einer
 * seiner nächsten Runden erneut; ein beendetes Spiel läuft dadurch weiter.
 */
export async function unlockField(
  code: string,
  byPlayerId: string,
  targetPlayerId: string,
  categoryId: string,
): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    if (session.hostId !== byPlayerId) {
      failure = 'Nur die Spielleitung kann Felder freigeben.';
      return undefined;
    }
    if (session.state !== 'playing' && session.state !== 'finished') {
      failure = 'Das Spiel hat noch nicht begonnen.';
      return undefined;
    }
    const scores = session.players?.[targetPlayerId]?.scores;
    if (!scores || scores[categoryId] === undefined) {
      failure = 'Dieses Feld ist nicht ausgefüllt.';
      return undefined;
    }

    delete scores[categoryId];
    if (
      session.lastMove?.playerId === targetPlayerId &&
      session.lastMove.categoryId === categoryId
    ) {
      delete session.lastMove; // Undo zeigt sonst auf ein bereits leeres Feld
    }
    if (session.state === 'finished') {
      session.state = 'playing';
      delete session.finishedAt;
    }
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/** Spielleitung überspringt den Zug des aktuellen Spielers (z. B. kurz abwesend). */
export async function skipTurn(code: string, byPlayerId: string): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    if (session.hostId !== byPlayerId) {
      failure = 'Nur die Spielleitung kann einen Zug überspringen.';
      return undefined;
    }
    if (session.state !== 'playing') {
      failure = 'Das Spiel läuft gerade nicht.';
      return undefined;
    }
    const order = session.playerOrder ?? [];
    session.turnIndex = nextIncompleteIndex(session, order, session.turnIndex % order.length, false);
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/**
 * Spielleitung entfernt einen Spieler endgültig aus dem laufenden Spiel
 * (z. B. dauerhaft abgesprungen). Zettel und Spalte werden gelöscht; war der
 * Spieler am Zug, geht der Zug an den nächsten. Sind danach alle übrigen
 * Zettel voll, endet das Spiel.
 */
export async function removePlayer(
  code: string,
  byPlayerId: string,
  targetPlayerId: string,
): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    if (session.hostId !== byPlayerId) {
      failure = 'Nur die Spielleitung kann Spieler entfernen.';
      return undefined;
    }
    if (targetPlayerId === session.hostId) {
      failure = 'Die Spielleitung kann sich nicht selbst entfernen.';
      return undefined;
    }
    if (session.state !== 'playing') {
      failure = 'Entfernen ist nur im laufenden Spiel möglich.';
      return undefined;
    }
    const order = session.playerOrder ?? [];
    const removedIndex = order.indexOf(targetPlayerId);
    if (removedIndex === -1 || !session.players?.[targetPlayerId]) {
      failure = 'Spieler nicht gefunden.';
      return undefined;
    }

    const currentId = order[session.turnIndex % order.length];
    const newOrder = order.filter((id) => id !== targetPlayerId);
    delete session.players[targetPlayerId];
    session.playerOrder = newOrder;
    if (session.lastMove?.playerId === targetPlayerId) delete session.lastMove;

    if (currentId === targetPlayerId) {
      // Der Entfernte war am Zug: weiter mit dem Spieler an seiner Position
      session.turnIndex = nextIncompleteIndex(session, newOrder, removedIndex % newOrder.length, true);
    } else {
      session.turnIndex = Math.max(0, newOrder.indexOf(currentId));
    }

    if (isGameComplete(session.mode, session.players, newOrder)) {
      session.state = 'finished';
      session.finishedAt = Date.now();
    }
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/** Revanche: gleiche Spieler, leere Zettel. Startspieler rotiert um eins. */
export async function rematch(code: string, playerId: string): Promise<void> {
  let failure: string | null = null;

  const result = await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    failure = null;

    if (session.hostId !== playerId) {
      failure = 'Nur die Spielleitung kann eine Revanche starten.';
      return undefined;
    }
    if (session.state !== 'finished') return session;

    for (const player of Object.values(session.players ?? {})) {
      delete player.scores;
    }
    const order = session.playerOrder ?? [];
    if (order.length > 1) session.playerOrder = [...order.slice(1), order[0]];
    session.turnIndex = 0;
    session.state = 'playing';
    session.createdAt = Date.now(); // Revanche verlängert die 24-h-Lebensdauer
    delete session.finishedAt;
    return session;
  });

  if (failure) throw new SessionError(failure);
  if (result.committed && result.snapshot.val() === null) {
    throw new SessionError('Sitzung existiert nicht mehr.');
  }
}

/**
 * Verlässt eine Sitzung in der Lobby. Verlässt der Host, wird die
 * Spielleitung weitergegeben; der letzte Spieler löscht die Sitzung.
 * Während eines laufenden Spiels bleibt der Zettel bestehen (nur lokal trennen).
 */
export async function leaveLobby(code: string, playerId: string): Promise<void> {
  await runTransaction(sessionRef(code), (session: Session | null) => {
    if (session === null) return null;
    if (session.state !== 'lobby' || !session.players?.[playerId]) return session;

    delete session.players[playerId];
    const remaining = Object.entries(session.players);
    if (remaining.length === 0) return null; // Sitzung löschen

    if (session.hostId === playerId) {
      remaining.sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
      session.hostId = remaining[0][0];
    }
    return session;
  });
}

/**
 * Live-Abo auf die Sitzung. Liefert bei jeder Änderung (egal von welchem
 * Client) sofort den neuen Stand – kein Reload nötig. Zusätzlich wird eine
 * Online-Präsenz gepflegt: Bei Verbindungsabbruch setzt der Firebase-Server
 * `online` automatisch auf false (onDisconnect).
 *
 * Die Präsenz hängt bewusst an `.info/connected` statt nur am ersten Abo:
 * Firebase verbindet sich nach einem kurzen Abbruch (Handy gesperrt, App
 * gewechselt, Netz weg) automatisch wieder. Bei jedem dieser Reconnects
 * schreiben wir `online: true` erneut und schärfen den onDisconnect-Handler
 * frisch. Sonst bliebe man nach dem ersten Abbruch dauerhaft fälschlich grau.
 */
export function subscribeToSession(
  code: string,
  playerId: string,
  onChange: (session: Session | null) => void,
): () => void {
  const sRef = sessionRef(code);
  const onlineRef = ref(getDb(), `sessions/${code}/players/${playerId}/online`);
  const connectedRef = ref(getDb(), '.info/connected');

  let isMember = false;
  let connectedUnsub: (() => void) | null = null;

  // Präsenz erst aufbauen, wenn feststeht, dass der Spieler zur Sitzung gehört.
  function startPresence(): void {
    if (connectedUnsub) return;
    connectedUnsub = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;
      // Reihenfolge wichtig: erst onDisconnect scharf schalten, dann online setzen,
      // damit bei einem Abbruch direkt nach dem Connect kein „online: true" hängenbleibt.
      onDisconnect(onlineRef).set(false).catch(() => {});
      set(onlineRef, true).catch(() => {});
    });
  }

  const unsubscribe = onValue(sRef, (snapshot) => {
    const session = snapshot.val() as Session | null;
    if (session?.players?.[playerId] && !isMember) {
      isMember = true;
      startPresence();
    }
    onChange(session);
  });

  return () => {
    unsubscribe();
    connectedUnsub?.();
    if (isMember) {
      onDisconnect(onlineRef).cancel().catch(() => {});
      set(onlineRef, false).catch(() => {});
    }
  };
}
