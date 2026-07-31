import { createContext } from 'react';
import type { Dispatch } from 'react';
import type { GameAction } from './gameReducer';
import type { GameSession } from '../types';

export type GameContextValue = {
  state: GameSession;
  dispatch: Dispatch<GameAction>;
  clearGameState: () => Promise<void>;
  persistenceNotice?: string;
  persistenceReady: boolean;
};

export const GameContext = createContext<GameContextValue | null>(null);
