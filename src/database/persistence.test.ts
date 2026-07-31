import { describe, expect, it, vi } from 'vitest';
import {
  createInitialCatalogSnapshot,
  getCatalogTasks,
} from '../catalog/repository/memoryCatalogRepository';
import {
  getCatalogMigrationPlan,
  migrateCatalogSnapshot,
} from '../catalog/services/catalogMigration';
import { initialGameSession } from '../game/state/gameReducer';
import { createPersistedGameState, restoreGameSession } from './persistence';

describe('persistence serialization', () => {
  it('separates catalog data from persisted game state', () => {
    const persistedGameState = createPersistedGameState(initialGameSession);

    expect('catalog' in persistedGameState).toBe(false);
  });

  it('restores catalog and game state separately', () => {
    const catalog = createInitialCatalogSnapshot();
    const gameState = createPersistedGameState({
      ...initialGameSession,
      phase: 'feedback',
      turnNumber: 4,
    });
    const restoredSession = restoreGameSession(initialGameSession, catalog, gameState);

    expect(restoredSession.catalog).toBe(catalog);
    expect(restoredSession.phase).toBe('feedback');
    expect(restoredSession.turnNumber).toBe(4);
  });

  it('persists the selected task for refresh restore on task routes', () => {
    const selectedTask = getCatalogTasks(createInitialCatalogSnapshot().catalogs[0])[0];
    const persistedGameState = createPersistedGameState({
      ...initialGameSession,
      phase: 'task-details',
      selectedTask,
    });

    expect(persistedGameState.selectedTask).toEqual(selectedTask);
  });

  it('keeps a running countdown active on restore when time remains', () => {
    vi.setSystemTime(2_000);

    const gameState = createPersistedGameState({
      ...initialGameSession,
      phase: 'countdown',
      timer: {
        durationMs: 60_000,
        endAt: 12_000,
        remainingMs: 60_000,
        paused: false,
      },
    });
    const restoredSession = restoreGameSession(initialGameSession, undefined, gameState);

    expect(gameState.timer.endAt).toBe(12_000);
    expect(gameState.timer.paused).toBe(false);
    expect(restoredSession.timer.endAt).toBe(12_000);
    expect(restoredSession.timer.paused).toBe(false);
    expect(restoredSession.timer.remainingMs).toBe(10_000);

    vi.useRealTimers();
  });

  it('restores an expired countdown as feedback', () => {
    vi.setSystemTime(13_000);

    const gameState = createPersistedGameState({
      ...initialGameSession,
      phase: 'countdown',
      timer: {
        durationMs: 60_000,
        endAt: 12_000,
        remainingMs: 1_000,
        paused: false,
      },
    });
    const restoredSession = restoreGameSession(initialGameSession, undefined, gameState);

    expect(restoredSession.phase).toBe('feedback');
    expect(restoredSession.timer.endAt).toBeNull();
    expect(restoredSession.timer.remainingMs).toBe(0);
    expect(restoredSession.timer.paused).toBe(false);

    vi.useRealTimers();
  });

  it('restores legacy game state defaults', () => {
    const restoredSession = restoreGameSession(initialGameSession, undefined, {
      ...createPersistedGameState(initialGameSession),
      gameMode: undefined as never,
      targetRounds: undefined as never,
      offeredRoundId: undefined as never,
      recentlyOfferedRoundIds: undefined as never,
    });

    expect(restoredSession.gameMode).toBe('random');
    expect(restoredSession.targetRounds).toBe(6);
    expect(restoredSession.offeredRoundId).toBeNull();
    expect(restoredSession.recentlyOfferedRoundIds).toEqual([]);
  });

  it('normalizes restored target rounds to even values', () => {
    const restoredSession = restoreGameSession(initialGameSession, undefined, {
      ...createPersistedGameState(initialGameSession),
      targetRounds: 5,
    });

    expect(restoredSession.targetRounds).toBe(6);
  });

  it('migrates legacy catalog snapshots without customRounds', () => {
    const legacy = createInitialCatalogSnapshot();
    delete (legacy as { schemaVersion?: number }).schemaVersion;
    delete (legacy.catalogs[0] as { customRounds?: unknown }).customRounds;

    const migration = migrateCatalogSnapshot(legacy);

    expect(migration.status).toBe('migrated');
    expect(migration.catalog?.catalogs[0]?.customRounds).toEqual([]);
  });

  it('exposes an explicit catalog migration plan', () => {
    const plan = getCatalogMigrationPlan(0);

    expect(plan?.map((step) => `${step.fromVersion}->${step.toVersion}`)).toEqual(['0->1']);
    expect(getCatalogMigrationPlan(99)).toBeNull();
  });
});
