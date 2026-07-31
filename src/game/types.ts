import type { CatalogSnapshot } from '../catalog/types';

export type Mood = 'closeness' | 'flirty' | 'intimate';

export type GenderIdentity = 'female' | 'male' | 'not-specified';

export interface Player {
  id: string;
  name: string;
  gender: GenderIdentity;
}

export interface TaskEligibility {
  allowedGenderPairings?: Array<[GenderIdentity, GenderIdentity]>;
}

export interface GameTask {
  id: string;
  version: number;
  title: string;
  text: string;
  mood: Mood;
  enabled: boolean;
  hint?: string;
  eligibility?: TaskEligibility;
}

export type GamePhase =
  'player-setup' | 'task-selection' | 'task-details' | 'countdown' | 'feedback';

export type GameMode = 'random' | 'customRounds' | 'mixed';

export interface TimerState {
  durationMs: number;
  endAt: number | null;
  remainingMs: number;
  paused: boolean;
}

export interface GameSession {
  phase: GamePhase;
  players: [Player, Player];
  activePlayerIndex: 0 | 1;
  turnNumber: number;
  targetRounds: number;
  gameMode: GameMode;
  offeredTasks: [GameTask, GameTask, GameTask] | null;
  offeredRoundId: string | null;
  selectedTask: GameTask | null;
  missingCatalogId: string | null;
  missingTaskId: string | null;
  recentlyOfferedTaskIds: string[];
  recentlyOfferedRoundIds: string[];
  timer: TimerState;
  catalog: CatalogSnapshot;
}
