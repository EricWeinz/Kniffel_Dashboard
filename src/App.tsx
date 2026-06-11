import { useEffect, useState } from 'react';
import { isFirebaseConfigured } from './firebase';
import { useKniffelStore } from './store';
import ConfigMissing from './components/ConfigMissing';
import PasswordGate, { UNLOCK_KEY } from './components/PasswordGate';
import LobbyScreen from './components/LobbyScreen';
import WaitingRoom from './components/WaitingRoom';
import GameScreen from './components/GameScreen';
import WinnerScreen from './components/WinnerScreen';
import ErrorToast from './components/ErrorToast';

/**
 * Screen-Routing rein über den Sitzungszustand aus Firebase:
 * Passwort-Sperre -> keine Sitzung: Startseite, lobby -> Warteraum,
 * playing -> Spielfeld, finished -> Siegerehrung.
 */
export default function App() {
  const session = useKniffelStore((s) => s.session);
  const resumeLastSession = useKniffelStore((s) => s.resumeLastSession);
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(UNLOCK_KEY) === '1',
  );

  // Nach einem Reload automatisch wieder mit der letzten Sitzung verbinden
  // (erst nach der Passwort-Freischaltung)
  useEffect(() => {
    if (unlocked && isFirebaseConfigured) resumeLastSession();
  }, [unlocked, resumeLastSession]);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  if (!isFirebaseConfigured) return <ConfigMissing />;

  let screen;
  if (!session) screen = <LobbyScreen />;
  else if (session.state === 'lobby') screen = <WaitingRoom />;
  else if (session.state === 'finished') screen = <WinnerScreen />;
  else screen = <GameScreen />;

  return (
    <>
      {screen}
      <ErrorToast />
    </>
  );
}
