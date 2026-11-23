import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Colors, Mode, colorsFor } from '../theme/colors';
import { Language, TKey, translations } from '../i18n/translations';
import { apiClient, ApiError } from '../api/client';
import { storage } from '../storage';

interface AppState {
  lang: Language;
  setLang: (l: Language) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  c: Colors;
  t: (key: TKey) => string;
  /** Converts any thrown error into a user-friendly, localized message. */
  errorText: (e: unknown) => string;
  signedIn: boolean;
  onSignedIn: () => void;
  signOut: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // English + dark are the defaults.
  const [lang, setLangState] = useState<Language>(storage.get('lang') === 'tr' ? 'tr' : 'en');
  const [mode, setModeState] = useState<Mode>(storage.get('mode') === 'light' ? 'light' : 'dark');
  const [signedIn, setSignedIn] = useState<boolean>(apiClient.hasToken());

  const signOut = useCallback(() => {
    apiClient.logout();
    setSignedIn(false);
  }, []);
  apiClient.onUnauthorized = signOut;

  const value = useMemo<AppState>(() => {
    const dict = translations[lang];
    const t = (key: TKey) => dict[key];
    return {
      lang,
      setLang: (l) => {
        storage.set('lang', l);
        setLangState(l);
      },
      mode,
      setMode: (m) => {
        storage.set('mode', m);
        setModeState(m);
      },
      c: colorsFor(mode),
      t,
      errorText: (e) => {
        if (e instanceof ApiError) {
          if (e.status === 0) return dict.errNetwork;
          if (e.status === 429) return dict.errLimit;
          if (e.status === 401 || e.status === 400) return dict.errLogin;
        }
        return dict.errGeneric;
      },
      signedIn,
      onSignedIn: () => setSignedIn(true),
      signOut,
    };
  }, [lang, mode, signedIn, signOut]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
