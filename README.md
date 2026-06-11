# 🎲 Kniffel Dashboard

Ein Online-Spielblock für Kniffel – live synchronisiert über Firebase Realtime Database.
Bis zu **6 Spieler** tragen ihre Würfelergebnisse gleichzeitig auf einem gemeinsamen
Zettel ein; jede Änderung erscheint sofort bei allen, ganz ohne Reload.

## Features

- **Zwei Spielmodi**
  - **Klassisches Kniffel**: 5 Würfel, 13 Kategorien, Bonus +35 ab 63 Punkten im oberen Block
  - **Kniffel Extrem**: 6 Würfel, 22 Kategorien nach offiziellem Regelwerk
    (Zwei Paare, Drei Paare = 35 P., Zwei Dreier = 45 P., Großes Full-House = 45 P.,
    Highway = 50 P., Kniffel Extrem = 75 P., 10 oder weniger / 33 oder mehr = je 40 P.,
    Super-Chance = Augensumme × 2, …), Bonus +45 ab 73 Punkten
- **Echtzeit-Synchronisierung**: Alle Spielzüge laufen als Firebase-Transaktionen –
  kein doppelter Zug, kein überschriebenes Feld, auch bei gleichzeitigen Eingaben
- **Sitzungen per 6-stelligem Code** oder Einladungslink (`…/?code=ABC123`)
- **Zugreihenfolge** mit hervorgehobenem aktiven Spieler und Rundenzähler
- **Automatische Berechnung** von Zwischensummen, Bonus und Endsumme
- **Regel-Validierung** bei der Eingabe (z. B. nur Vielfache der Augenzahl im oberen Block)
- **Siegerehrung** mit Rangliste, Konfetti 🎉 und Revanche-Funktion
- **Reconnect**: Nach einem Reload verbindet sich der Browser automatisch wieder
  mit der laufenden Sitzung (Spieler-ID bleibt im localStorage erhalten)
- **Online-Präsenz**: Grüner Punkt zeigt, wer gerade verbunden ist (via `onDisconnect`)
- **Automatisches Aufräumen**: Sitzungen verfallen 24 h nach Erstellung und werden
  beim nächsten Beitritts-/Verbindungsversuch aus der Datenbank gelöscht
- **Passwortschutz**: Rudimentäre Zugangssperre vor der App (Passwort in
  `src/components/PasswordGate.tsx`, Freischaltung wird im Browser gemerkt).
  Achtung: rein clientseitig, hält nur zufällige Besucher fern – kein echter Schutz
- **Mobile-first** mit horizontal scrollbarem Spielblock und fixierter Kategoriespalte

## Tech-Stack

| Bereich          | Technologie                                  |
| ---------------- | -------------------------------------------- |
| Frontend         | React 19 + TypeScript + Vite                 |
| Styling          | Tailwind CSS v4 (Solarized-Farbpalette)      |
| State Management | Zustand                                      |
| Realtime-Backend | Firebase Realtime Database (Free Tier)       |
| Hosting          | Vercel (rein statisch, keine eigene Server-Infrastruktur) |

## Projektstruktur

```
src/
├── main.tsx                    # Einstiegspunkt
├── App.tsx                     # Screen-Routing über den Sitzungszustand
├── index.css                   # Tailwind + Solarized-Theme
├── firebase.ts                 # Firebase-Initialisierung aus VITE_FIREBASE_*-Env-Variablen
├── types.ts                    # Gemeinsame Typen (Session, Player, Kategorien, …)
├── store.ts                    # Zustand-Store: lokales Abbild der Sitzung + UI-State
├── lib/
│   ├── rules.ts                # Regelwerk beider Modi, Validierung, Punkteberechnung
│   └── session.ts              # Firebase-Transaktionen: erstellen, beitreten, Zug, Revanche
└── components/
    ├── PasswordGate.tsx        # Rudimentärer Passwortschutz vor der ganzen App
    ├── LobbyScreen.tsx         # Modusauswahl, Name, Sitzung erstellen/beitreten
    ├── WaitingRoom.tsx         # Code teilen, Spielerliste, Spielstart (Host)
    ├── GameScreen.tsx          # Laufendes Spiel mit Zug-Banner
    ├── ScoreBoard.tsx          # Gemeinsamer Spielblock (alle Spieler nebeneinander)
    ├── ScoreCell.tsx           # Einzelne Zelle (gesperrt / anklickbar / leer)
    ├── ScoreInputModal.tsx     # Eingabedialog mit Regel-Validierung
    ├── WinnerScreen.tsx        # Rangliste + Konfetti + Revanche
    ├── SessionCodeBadge.tsx    # Code-Chip mit "Link kopieren"
    ├── ErrorToast.tsx          # Globale Fehlermeldungen
    └── ConfigMissing.tsx       # Hilfeseite bei fehlender Firebase-Konfiguration
```

## Setup

### 1. Firebase-Projekt anlegen

1. [Firebase-Konsole](https://console.firebase.google.com/) öffnen → **Projekt hinzufügen**
   (Google Analytics kann deaktiviert bleiben).
2. Im Projekt: **Build → Realtime Database → Datenbank erstellen**.
   Standort z. B. `europe-west1`, Start im **gesperrten Modus**.
3. Unter **Realtime Database → Regeln** folgende Regeln veröffentlichen:

   ```json
   {
     "rules": {
       "sessions": {
         "$code": {
           ".read": true,
           ".write": true,
           ".validate": "$code.matches(/^[A-Z0-9]{6}$/)"
         }
       }
     }
   }
   ```

   > Für den privaten Spieleabend ausreichend. Wer die App öffentlich betreibt,
   > sollte zusätzlich Firebase **Anonymous Auth** aktivieren und `.read`/`.write`
   > an `auth != null` knüpfen.

4. **Projekteinstellungen (⚙️) → Allgemein → Meine Apps → Web-App (`</>`) registrieren**.
   Die angezeigte `firebaseConfig` enthält alle benötigten Werte.

### 2. Lokale Entwicklung

```bash
# Repository klonen / in den Projektordner wechseln
npm install

# Umgebungsvariablen anlegen
cp .env.example .env
# … und die Werte aus der Firebase-Konsole in .env eintragen.
# Wichtig: VITE_FIREBASE_DATABASE_URL ist die URL der Realtime Database
# (z. B. https://mein-projekt-default-rtdb.europe-west1.firebasedatabase.app)

npm run dev
```

Die App läuft dann auf `http://localhost:5173`. Zum Testen einfach ein zweites
Browserfenster (privater Modus = zweiter Spieler) öffnen und mit dem Code beitreten.

### 3. Deploy auf Vercel

1. Projekt zu GitHub pushen und in [Vercel](https://vercel.com) importieren –
   Vercel erkennt Vite automatisch (Build: `npm run build`, Output: `dist`).
2. Unter **Project → Settings → Environment Variables** alle Variablen aus der
   `.env` anlegen (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
   `VITE_FIREBASE_APP_ID`).
3. **Deploy** – fertig. Es werden nur statische Dateien ausgeliefert;
   die gesamte Echtzeit-Logik läuft direkt zwischen Browser und Firebase.

## Datenmodell (Realtime Database)

```
sessions/
  ABC123/                     # 6-stelliger Sitzungscode
    mode: "classic" | "extrem"
    state: "lobby" | "playing" | "finished"
    hostId: "<player-uuid>"
    createdAt: 1718000000000
    turnIndex: 2              # Index in playerOrder: wer ist am Zug
    playerOrder: ["id1", "id2", …]
    players/
      <player-uuid>/
        name: "Eric"
        joinedAt: 1718000000000
        online: true          # Präsenz via onDisconnect
        scores/
          upper-3: 9          # Kategorie-ID -> eingetragener Wert
          kniffel: 50
```

**Warum Transaktionen?** Beitritt, Spielstart, Punkteeintrag und Revanche laufen
als `runTransaction` auf dem Sitzungsknoten. Der Server prüft dabei atomar, dass
der Spieler wirklich am Zug ist, das Feld frei ist und der Wert regelkonform ist –
zwei gleichzeitige Schreibzugriffe können sich daher nie gegenseitig überschreiben.

## Spielregeln in Kürze

**Klassisch (5 Würfel):** Oberer Block 1er–6er (Bonus +35 ab 63), Dreierpasch &
Viererpasch (Augensumme), Full House 25, Kleine Straße 30, Große Straße 40,
Kniffel 50, Chance (Augensumme).

**Extrem (6 Würfel):** Oberer Block 1er–6er (Bonus +45 ab 73), Dreierpasch,
Viererpasch, Zwei Paare & Chance (jeweils Augensumme aller 6 Würfel),
Drei Paare 35, Zwei Dreier 45, Full-House 25, Großes Full-House 45,
Kleine Straße 30, Große Straße 40, Highway 50, Kniffel 50, Kniffel Extrem 75,
10 oder weniger 40 (Augensumme ≤ 10), 33 oder mehr 40 (Augensumme ≥ 33),
Super-Chance (Augensumme aller 6 Würfel × 2 – eingegeben wird die Augensumme,
die App verdoppelt automatisch).

Gewürfelt wird am Tisch – die App ist der gemeinsame Spielblock. Beim Eintragen
wird jeder Wert gegen die Regeln geprüft (oberer Block: nur Vielfache der
Augenzahl; feste Kategorien: voller Wert oder streichen; Summen: gültiger Bereich).

## Automatisches Löschen nach 24 Stunden

Sitzungen haben eine Lebensdauer von **24 Stunden ab Erstellung** (eine Revanche
verlängert sie). Da die App ohne eigenen Server auskommt, räumen die Clients
selbst auf: Wer einer abgelaufenen Sitzung beitritt oder sich nach einem Reload
wieder verbindet, löscht sie dabei transaktional aus der Realtime Database.
Verwaiste Sitzungen, die nie wieder jemand aufruft, bleiben zwar liegen, sind
aber winzig (wenige KB) und für den Free Tier unkritisch – sie lassen sich
jederzeit in der Firebase-Konsole unter *Realtime Database → Daten* von Hand
entfernen.
