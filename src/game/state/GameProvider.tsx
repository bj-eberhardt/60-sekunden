import { useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createPersistedGameState,
  deletePersistedGameState,
  loadPersistedAppState,
  restoreGameSession,
  saveCatalogSnapshot,
  saveGameState,
} from '../../database/persistence';
import { GameContext } from './gameContext';
import { gameReducer, initialGameSession } from './gameReducer';

type GameProviderProps = {
  children: ReactNode;
};

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialGameSession);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [persistenceNotice, setPersistenceNotice] = useState<string | undefined>();

  useEffect(() => {
    let canceled = false;

    loadPersistedAppState()
      .then(({ catalog, catalogNotice, gameState, gameStateNotice, shouldRewriteCatalog }) => {
        if (canceled) {
          return;
        }

        dispatch({
          type: 'hydrate-state',
          payload: restoreGameSession(initialGameSession, catalog, gameState),
        });
        setPersistenceNotice(
          [catalogNotice, gameStateNotice].filter(Boolean).join(' ') || undefined,
        );

        if (shouldRewriteCatalog && catalog) {
          void saveCatalogSnapshot(catalog).catch(() => undefined);
        }
      })
      .catch(() => {
        if (!canceled) {
          dispatch({ type: 'hydrate-state', payload: initialGameSession });
        }
      })
      .finally(() => {
        if (!canceled) {
          setPersistenceReady(true);
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!persistenceReady) {
      return;
    }

    void saveCatalogSnapshot(state.catalog).catch(() => undefined);
  }, [persistenceReady, state.catalog]);

  useEffect(() => {
    if (!persistenceReady) {
      return;
    }

    void saveGameState(createPersistedGameState(state)).catch(() => undefined);
  }, [persistenceReady, state]);

  async function clearGameState() {
    await deletePersistedGameState();
    dispatch({ type: 'reset-game-state' });
  }

  const value = useMemo(
    () => ({ state, dispatch, clearGameState, persistenceNotice, persistenceReady }),
    [persistenceNotice, persistenceReady, state],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
