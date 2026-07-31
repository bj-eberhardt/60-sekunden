import type { GameTask, TaskEligibility } from '../game/types';

export const originalCatalogId = 'original-catalog';
export const catalogSchemaVersion = 1;

export type BuiltInTask = Omit<GameTask, 'enabled'> & {
  source: 'built-in';
};

export type CustomTask = GameTask & {
  source: 'custom';
  createdAt: string;
  updatedAt: string;
};

export interface TaskOverride {
  taskId: string;
  enabled?: boolean;
  title?: string;
  text?: string;
  mood?: GameTask['mood'];
  hint?: string;
  eligibility?: TaskEligibility;
  updatedAt: string;
}

export interface CustomRound {
  id: string;
  catalogId: string;
  name: string;
  enabled: boolean;
  taskIds: {
    closeness: string;
    flirty: string;
    intimate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type TaskCatalogKind = 'original' | 'custom';

export interface TaskCatalog {
  id: string;
  name: string;
  kind: TaskCatalogKind;
  taskOverrides: TaskOverride[];
  customTasks: CustomTask[];
  customRounds: CustomRound[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogSnapshot {
  schemaVersion: number;
  builtInCatalogVersion: number;
  activeCatalogId: string;
  catalogs: TaskCatalog[];
}
