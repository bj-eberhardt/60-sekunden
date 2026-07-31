import type { CatalogSnapshot } from '../catalog/types';
import { migrateCatalogSnapshot } from '../catalog/services/catalogMigration';
import { getCatalogTasks } from '../catalog/repository/memoryCatalogRepository';
import type { GameSession } from '../game/types';
import {
  catalogStoreName,
  deleteStoreValue,
  gameStateStoreName,
  readStoreValue,
  writeStoreValue,
} from './indexedDb';

const catalogKey = 'catalog-snapshot';
const gameStateKey = 'current-game-state';

export type PersistedGameState = Omit<GameSession, 'catalog'> & {
  activeCatalogId?: string;
};

export type PersistedAppState = {
  catalog: CatalogSnapshot | undefined;
  gameState: PersistedGameState | undefined;
  catalogNotice?: string;
  gameStateNotice?: string;
  shouldRewriteCatalog: boolean;
};

export function createPersistedGameState(session: GameSession): PersistedGameState {
  return {
    phase: session.phase,
    players: session.players,
    activePlayerIndex: session.activePlayerIndex,
    turnNumber: session.turnNumber,
    targetRounds: session.targetRounds,
    gameMode: session.gameMode,
    offeredTasks: session.offeredTasks,
    offeredRoundId: session.offeredRoundId,
    selectedTask: session.selectedTask,
    missingCatalogId: session.missingCatalogId,
    missingTaskId: session.missingTaskId,
    activeCatalogId: session.missingCatalogId ?? session.catalog.activeCatalogId,
    recentlyOfferedTaskIds: session.recentlyOfferedTaskIds,
    recentlyOfferedRoundIds: session.recentlyOfferedRoundIds,
    timer: session.timer,
  };
}

export function restoreGameSession(
  fallbackSession: GameSession,
  catalog: CatalogSnapshot | undefined,
  gameState: PersistedGameState | undefined,
): GameSession {
  const restoredCatalog = catalog ?? fallbackSession.catalog;
  const missingCatalogId = getMissingCatalogId(restoredCatalog, gameState);
  const missingTaskId = getMissingTaskId(restoredCatalog, gameState, missingCatalogId);

  return {
    ...fallbackSession,
    ...normalizeRestoredGameState(fallbackSession, gameState),
    catalog: restoredCatalog,
    missingCatalogId,
    missingTaskId,
  };
}

export async function loadPersistedAppState(): Promise<PersistedAppState> {
  const [catalog, gameState] = await Promise.all([
    readStoreValue<CatalogSnapshot>(catalogStoreName, catalogKey),
    readStoreValue<PersistedGameState>(gameStateStoreName, gameStateKey),
  ]);

  const migration = migrateCatalogSnapshot(catalog);
  const validGameState = isPersistedGameState(gameState) ? gameState : undefined;

  return {
    catalog: migration.catalog,
    gameState: validGameState,
    catalogNotice:
      migration.status === 'migrated'
        ? 'Lokale Katalogdaten wurden auf das aktuelle Format migriert.'
        : migration.status === 'invalid'
          ? 'Lokale Katalogdaten waren ungueltig und wurden durch den Originalkatalog ersetzt.'
          : undefined,
    gameStateNotice:
      gameState && !validGameState
        ? 'Der gespeicherte Spielstand war ungueltig und wurde verworfen.'
        : undefined,
    shouldRewriteCatalog: migration.status === 'migrated' || migration.status === 'invalid',
  };
}

export function saveCatalogSnapshot(catalog: CatalogSnapshot) {
  return writeStoreValue(catalogStoreName, catalogKey, catalog);
}

export function saveGameState(gameState: PersistedGameState) {
  return writeStoreValue(gameStateStoreName, gameStateKey, gameState);
}

export function deletePersistedGameState() {
  return deleteStoreValue(gameStateStoreName, gameStateKey);
}

function normalizeRestoredTimer<T extends PersistedGameState>(gameState: T): T {
  if (!gameState.timer.endAt || gameState.phase !== 'countdown') {
    return gameState;
  }

  const remainingMs = Math.max(0, gameState.timer.endAt - Date.now());

  if (remainingMs <= 0) {
    return {
      ...gameState,
      phase: 'feedback',
      timer: {
        ...gameState.timer,
        endAt: null,
        remainingMs: 0,
        paused: false,
      },
    };
  }

  return {
    ...gameState,
    timer: {
      ...gameState.timer,
      remainingMs,
      paused: false,
    },
  };
}

function normalizeRestoredGameState(
  fallbackSession: GameSession,
  gameState: PersistedGameState | undefined,
): PersistedGameState {
  const restored = {
    ...fallbackSession,
    ...(gameState ?? {}),
    catalog: undefined,
    gameMode: gameState?.gameMode ?? fallbackSession.gameMode,
    targetRounds: normalizeTargetRounds(gameState?.targetRounds, fallbackSession.targetRounds),
    offeredRoundId: gameState?.offeredRoundId ?? null,
    missingCatalogId: gameState?.missingCatalogId ?? null,
    missingTaskId: gameState?.missingTaskId ?? null,
    recentlyOfferedRoundIds: gameState?.recentlyOfferedRoundIds ?? [],
  };

  return normalizeRestoredTimer(restored);
}

function getMissingCatalogId(catalog: CatalogSnapshot, gameState: PersistedGameState | undefined) {
  if (!gameState || gameState.phase === 'player-setup') {
    return null;
  }

  const activeCatalogId =
    gameState.missingCatalogId ?? gameState.activeCatalogId ?? catalog.activeCatalogId;

  return catalog.catalogs.some((item) => item.id === activeCatalogId) ? null : activeCatalogId;
}

function getMissingTaskId(
  catalog: CatalogSnapshot,
  gameState: PersistedGameState | undefined,
  missingCatalogId: string | null,
) {
  if (!gameState?.selectedTask || missingCatalogId || !isSelectedTaskPhase(gameState.phase)) {
    return null;
  }

  const activeCatalogId = gameState.activeCatalogId ?? catalog.activeCatalogId;
  const activeCatalog = catalog.catalogs.find((item) => item.id === activeCatalogId);

  if (!activeCatalog) {
    return null;
  }

  return getCatalogTasks(activeCatalog).some((task) => task.id === gameState.selectedTask?.id)
    ? null
    : gameState.selectedTask.id;
}

function isSelectedTaskPhase(phase: GameSession['phase']) {
  return phase === 'task-details' || phase === 'countdown' || phase === 'feedback';
}

function normalizeTargetRounds(targetRounds: number | undefined, fallbackTargetRounds: number) {
  if (typeof targetRounds !== 'number' || !Number.isFinite(targetRounds)) {
    return fallbackTargetRounds;
  }

  const clampedTargetRounds = Math.min(Math.max(Math.round(targetRounds), 2), 12);

  return clampedTargetRounds % 2 === 0 ? clampedTargetRounds : clampedTargetRounds + 1;
}

function isPersistedGameState(value: unknown): value is PersistedGameState {
  const gameState = value as PersistedGameState | undefined;

  return (
    !!gameState &&
    typeof gameState === 'object' &&
    Array.isArray(gameState.players) &&
    typeof gameState.turnNumber === 'number' &&
    !!gameState.timer
  );
}
