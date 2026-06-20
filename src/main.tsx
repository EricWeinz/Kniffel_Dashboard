import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { applyTheme, getStoredTheme } from './lib/theme';

// Gespeichertes Farbdesign anwenden (und dabei einen evtl. ungültigen Wert
// aus dem Inline-Script in index.html auf einen gültigen normalisieren).
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
