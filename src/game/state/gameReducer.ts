import {
  createCopiedCatalog,
  getActiveCatalog,
  createInitialCatalogSnapshot,
  createUniqueCatalogName,
  getCatalogTasks,
  getPlayableCatalog,
  upsertOverride,
} from '../../catalog/repository/memoryCatalogRepository';
import type { TaskCatalog, TaskOverride } from '../../catalog/types';
import type { CustomRoundInput } from '../../catalog/services/customRounds';
import { originalCatalogId } from '../../catalog/types';
import { createCustomRound, updateCustomRound } from '../../catalog/services/customRounds';
import type { CustomTaskInput } from '../../catalog/services/customTasks';
import { createCustomTask, updateCustomTask } from '../../catalog/services/customTasks';
import type { GameMode, GameSession, GenderIdentity, Player, TimerState } from '../types';
import {
  rememberOfferedRound,
  rememberOfferedTasks,
  selectOfferedRoundTasks,
  selectOfferedTasks,
} from '../services/taskSelection';

const defaultTimerDurationMs = 60_000;
const timerStartDelayMs = 3_000;
const defaultTargetRounds = 6;

const emptyTimer: TimerState = {
  durationMs: defaultTimerDurationMs,
  endAt: null,
  remainingMs: defaultTimerDurationMs,
  paused: false,
};

export const initialGameSession: GameSession = {
  phase: 'player-setup',
  players: [
    { id: 'player-1', name: 'Spieler 1', gender: 'not-specified' },
    { id: 'player-2', name: 'Spieler 2', gender: 'not-specified' },
  ],
  activePlayerIndex: 0,
  turnNumber: 1,
  targetRounds: defaultTargetRounds,
  gameMode: 'random',
  offeredTasks: null,
  offeredRoundId: null,
  selectedTask: null,
  missingCatalogId: null,
  missingTaskId: null,
  recentlyOfferedTaskIds: [],
  recentlyOfferedRoundIds: [],
  timer: emptyTimer,
  catalog: createInitialCatalogSnapshot(),
};

export type PlayerSetupInput = {
  firstName: string;
  firstGender: GenderIdentity;
  secondName: string;
  secondGender: GenderIdentity;
  gameMode: GameMode;
  targetRounds: number;
};

export type GameAction =
  | { type: 'hydrate-state'; payload: GameSession }
  | { type: 'start-game'; payload: PlayerSetupInput }
  | { type: 'select-catalog'; catalogId: string }
  | { type: 'create-catalog'; id: string; name: string; now: string }
  | { type: 'rename-catalog'; catalogId: string; name: string; now: string }
  | { type: 'copy-catalog'; sourceCatalogId: string; id: string; now: string }
  | { type: 'delete-catalog'; catalogId: string }
  | { type: 'replace-catalog-snapshot'; catalog: GameSession['catalog'] }
  | {
      type: 'add-custom-task';
      catalogId: string;
      payload: CustomTaskInput;
      id: string;
      now: string;
    }
  | {
      type: 'update-custom-task';
      catalogId: string;
      taskId: string;
      payload: CustomTaskInput;
      now: string;
    }
  | { type: 'toggle-custom-task'; catalogId: string; taskId: string; now: string }
  | { type: 'delete-custom-task'; catalogId: string; taskId: string; now: string }
  | { type: 'duplicate-task'; catalogId: string; taskId: string; id: string; now: string }
  | { type: 'save-task-override'; catalogId: string; payload: TaskOverride }
  | { type: 'toggle-built-in-task'; catalogId: string; taskId: string; now: string }
  | { type: 'reset-built-in-task'; catalogId: string; taskId: string; now: string }
  | {
      type: 'add-custom-round';
      catalogId: string;
      payload: CustomRoundInput;
      id: string;
      now: string;
    }
  | {
      type: 'update-custom-round';
      catalogId: string;
      roundId: string;
      payload: CustomRoundInput;
      now: string;
    }
  | { type: 'toggle-custom-round'; catalogId: string; roundId: string; now: string }
  | { type: 'duplicate-custom-round'; catalogId: string; roundId: string; id: string; now: string }
  | { type: 'delete-custom-round'; catalogId: string; roundId: string; now: string }
  | { type: 'draw-tasks' }
  | { type: 'select-task'; taskId: string }
  | { type: 'back-to-selection' }
  | { type: 'pass-turn' }
  | { type: 'start-timer'; now: number }
  | { type: 'pause-timer'; now: number }
  | { type: 'resume-timer'; now: number }
  | { type: 'finish-timer' }
  | { type: 'continue-after-feedback' }
  | { type: 'continue-after-missing-task' }
  | { type: 'reset-game-state' }
  | { type: 'reset-game' };

export function gameReducer(state: GameSession, action: GameAction): GameSession {
  switch (action.type) {
    case 'hydrate-state':
      return action.payload;

    case 'start-game': {
      const players: [Player, Player] = [
        normalizePlayer(
          'player-1',
          action.payload.firstName,
          action.payload.firstGender,
          'Spieler 1',
        ),
        normalizePlayer(
          'player-2',
          action.payload.secondName,
          action.payload.secondGender,
          'Spieler 2',
        ),
      ];
      return drawTasks({
        ...initialGameSession,
        catalog: state.catalog,
        players,
        activePlayerIndex: 0,
        gameMode: action.payload.gameMode,
        targetRounds: normalizeTargetRounds(action.payload.targetRounds),
        recentlyOfferedRoundIds: [],
      });
    }

    case 'select-catalog':
      if (!state.catalog.catalogs.some((catalog) => catalog.id === action.catalogId)) {
        return state;
      }

      return {
        ...state,
        catalog: { ...state.catalog, activeCatalogId: action.catalogId },
        offeredTasks: null,
        offeredRoundId: null,
        selectedTask: null,
        missingCatalogId: null,
        missingTaskId: null,
        recentlyOfferedTaskIds: [],
        recentlyOfferedRoundIds: [],
      };

    case 'create-catalog': {
      const name = createUniqueCatalogName(state.catalog.catalogs, action.name);
      const catalog: TaskCatalog = {
        id: action.id,
        name,
        kind: 'custom',
        taskOverrides: [],
        customTasks: [],
        customRounds: [],
        createdAt: action.now,
        updatedAt: action.now,
      };

      return {
        ...state,
        catalog: {
          ...state.catalog,
          activeCatalogId: catalog.id,
          catalogs: [...state.catalog.catalogs, catalog],
        },
      };
    }

    case 'rename-catalog': {
      const currentCatalog = state.catalog.catalogs.find(
        (catalog) => catalog.id === action.catalogId,
      );

      if (!currentCatalog) {
        return state;
      }

      const otherCatalogs = state.catalog.catalogs.filter(
        (catalog) => catalog.id !== action.catalogId,
      );
      const name = createUniqueCatalogName(otherCatalogs, action.name);

      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        name,
        updatedAt: action.now,
      }));
    }

    case 'copy-catalog': {
      const sourceCatalog = state.catalog.catalogs.find(
        (catalog) => catalog.id === action.sourceCatalogId,
      );

      if (!sourceCatalog) {
        return state;
      }

      const name = createUniqueCatalogName(state.catalog.catalogs, `${sourceCatalog.name} Kopie`);
      const catalog = createCopiedCatalog(sourceCatalog, action.id, name, action.now);

      return {
        ...state,
        catalog: {
          ...state.catalog,
          activeCatalogId: catalog.id,
          catalogs: [...state.catalog.catalogs, catalog],
        },
      };
    }

    case 'delete-catalog':
      if (action.catalogId === originalCatalogId) {
        return state;
      }

      return {
        ...state,
        catalog: {
          ...state.catalog,
          activeCatalogId:
            state.catalog.activeCatalogId === action.catalogId
              ? originalCatalogId
              : state.catalog.activeCatalogId,
          catalogs: state.catalog.catalogs.filter((catalog) => catalog.id !== action.catalogId),
        },
        offeredTasks: null,
        offeredRoundId: null,
        selectedTask: null,
        missingCatalogId: null,
        missingTaskId: null,
        recentlyOfferedTaskIds: [],
        recentlyOfferedRoundIds: [],
      };

    case 'replace-catalog-snapshot':
      return {
        ...state,
        catalog: action.catalog,
        offeredTasks: null,
        offeredRoundId: null,
        selectedTask: null,
        missingCatalogId: null,
        missingTaskId: null,
        recentlyOfferedTaskIds: [],
        recentlyOfferedRoundIds: [],
      };

    case 'add-custom-task':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customTasks: [
          ...catalog.customTasks,
          createCustomTask(action.payload, action.id, action.now),
        ],
        updatedAt: action.now,
      }));

    case 'update-custom-task':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customTasks: catalog.customTasks.map((task) =>
          task.id === action.taskId ? updateCustomTask(task, action.payload, action.now) : task,
        ),
        updatedAt: action.now,
      }));

    case 'toggle-custom-task':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customTasks: catalog.customTasks.map((task) =>
          task.id === action.taskId
            ? { ...task, enabled: !task.enabled, updatedAt: action.now }
            : task,
        ),
        updatedAt: action.now,
      }));

    case 'delete-custom-task':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customTasks: catalog.customTasks.filter((task) => task.id !== action.taskId),
        customRounds: catalog.customRounds.filter(
          (round) =>
            round.taskIds.closeness !== action.taskId &&
            round.taskIds.flirty !== action.taskId &&
            round.taskIds.intimate !== action.taskId,
        ),
        updatedAt: action.now,
      }));

    case 'duplicate-task':
      return updateCatalog(state, action.catalogId, (catalog) => {
        const task = getCatalogTasks(catalog).find((item) => item.id === action.taskId);

        if (!task) {
          return catalog;
        }

        return {
          ...catalog,
          customTasks: [
            ...catalog.customTasks,
            createCustomTask(
              {
                title: `${task.title} Kopie`,
                text: task.text,
                mood: task.mood,
                enabled: task.enabled,
                eligibility: task.eligibility,
              },
              action.id,
              action.now,
            ),
          ],
          updatedAt: action.now,
        };
      });

    case 'save-task-override':
      return updateCatalog(state, action.catalogId, (catalog) => {
        if (catalog.kind !== 'original') {
          return catalog;
        }

        return {
          ...catalog,
          taskOverrides: upsertOverride(catalog.taskOverrides, action.payload),
          updatedAt: action.payload.updatedAt,
        };
      });

    case 'toggle-built-in-task':
      return updateCatalog(state, action.catalogId, (catalog) => {
        if (catalog.kind !== 'original') {
          return catalog;
        }

        const currentTask = getCatalogTasks(catalog).find((task) => task.id === action.taskId);

        if (!currentTask) {
          return catalog;
        }

        return {
          ...catalog,
          taskOverrides: upsertOverride(catalog.taskOverrides, {
            taskId: action.taskId,
            enabled: !currentTask.enabled,
            updatedAt: action.now,
          }),
          updatedAt: action.now,
        };
      });

    case 'reset-built-in-task':
      return updateCatalog(state, action.catalogId, (catalog) => {
        if (catalog.kind !== 'original') {
          return catalog;
        }

        return {
          ...catalog,
          taskOverrides: catalog.taskOverrides.filter(
            (override) => override.taskId !== action.taskId,
          ),
          updatedAt: action.now,
        };
      });

    case 'add-custom-round':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customRounds: [
          ...catalog.customRounds,
          createCustomRound(action.payload, action.id, action.catalogId, action.now),
        ],
        updatedAt: action.now,
      }));

    case 'update-custom-round':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customRounds: catalog.customRounds.map((round) =>
          round.id === action.roundId
            ? updateCustomRound(round, action.payload, action.now)
            : round,
        ),
        updatedAt: action.now,
      }));

    case 'toggle-custom-round':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customRounds: catalog.customRounds.map((round) =>
          round.id === action.roundId
            ? { ...round, enabled: !round.enabled, updatedAt: action.now }
            : round,
        ),
        updatedAt: action.now,
      }));

    case 'duplicate-custom-round':
      return updateCatalog(state, action.catalogId, (catalog) => {
        const round = catalog.customRounds.find((item) => item.id === action.roundId);

        if (!round) {
          return catalog;
        }

        return {
          ...catalog,
          customRounds: [
            ...catalog.customRounds,
            createCustomRound(
              {
                name: `${round.name} Kopie`,
                enabled: round.enabled,
                taskIds: round.taskIds,
              },
              action.id,
              action.catalogId,
              action.now,
            ),
          ],
          updatedAt: action.now,
        };
      });

    case 'delete-custom-round':
      return updateCatalog(state, action.catalogId, (catalog) => ({
        ...catalog,
        customRounds: catalog.customRounds.filter((round) => round.id !== action.roundId),
        updatedAt: action.now,
      }));

    case 'draw-tasks':
      return drawTasks({
        ...state,
        offeredRoundId: null,
        selectedTask: null,
        missingTaskId: null,
        timer: emptyTimer,
      });

    case 'select-task': {
      const selectedTask = state.offeredTasks?.find((task) => task.id === action.taskId) ?? null;

      if (!selectedTask) {
        return state;
      }

      return { ...state, phase: 'task-details', selectedTask, missingTaskId: null };
    }

    case 'back-to-selection':
      return {
        ...state,
        phase: 'task-selection',
        selectedTask: null,
        missingTaskId: null,
        timer: emptyTimer,
      };

    case 'pass-turn':
      if (state.turnNumber >= state.targetRounds) {
        return {
          ...state,
          phase: 'feedback',
          selectedTask: null,
          missingTaskId: null,
          timer: emptyTimer,
          offeredRoundId: null,
        };
      }

      return drawTasks({
        ...state,
        activePlayerIndex: getNextPlayerIndex(state.activePlayerIndex),
        turnNumber: state.turnNumber + 1,
        selectedTask: null,
        missingTaskId: null,
        timer: emptyTimer,
        offeredRoundId: null,
      });

    case 'start-timer':
      return {
        ...state,
        phase: 'countdown',
        timer: {
          durationMs: defaultTimerDurationMs,
          endAt: action.now + timerStartDelayMs + defaultTimerDurationMs,
          remainingMs: defaultTimerDurationMs,
          paused: false,
        },
      };

    case 'pause-timer': {
      if (!state.timer.endAt || state.timer.paused) {
        return state;
      }

      return {
        ...state,
        timer: {
          ...state.timer,
          endAt: null,
          remainingMs: Math.max(0, state.timer.endAt - action.now),
          paused: true,
        },
      };
    }

    case 'resume-timer': {
      if (!state.timer.paused) {
        return state;
      }

      return {
        ...state,
        timer: {
          ...state.timer,
          endAt: action.now + state.timer.remainingMs,
          paused: false,
        },
      };
    }

    case 'finish-timer':
      return {
        ...state,
        phase: 'feedback',
        timer: { ...state.timer, endAt: null, remainingMs: 0, paused: false },
      };

    case 'continue-after-feedback':
      if (state.turnNumber >= state.targetRounds) {
        return state;
      }

      return drawTasks({
        ...state,
        activePlayerIndex: getNextPlayerIndex(state.activePlayerIndex),
        turnNumber: state.turnNumber + 1,
        selectedTask: null,
        missingTaskId: null,
        timer: emptyTimer,
        offeredRoundId: null,
      });

    case 'continue-after-missing-task':
      if (state.turnNumber >= state.targetRounds) {
        return {
          ...initialGameSession,
          catalog: state.catalog,
        };
      }

      return drawTasks({
        ...state,
        activePlayerIndex: getNextPlayerIndex(state.activePlayerIndex),
        turnNumber: state.turnNumber + 1,
        selectedTask: null,
        missingTaskId: null,
        timer: emptyTimer,
        offeredRoundId: null,
      });

    case 'reset-game':
      return initialGameSession;

    case 'reset-game-state':
      return {
        ...initialGameSession,
        catalog: state.catalog,
      };
  }
}

function drawTasks(state: GameSession): GameSession {
  const activeCatalog = getActiveCatalog(state.catalog);
  const playableTasks = getPlayableCatalog(state.catalog);
  const roundSelection =
    state.gameMode === 'random' || !activeCatalog
      ? null
      : selectRoundWithFallback(
          playableTasks,
          activeCatalog.customRounds,
          state.players,
          state.recentlyOfferedRoundIds,
          state.gameMode,
        );
  const offeredTasks =
    roundSelection?.offeredTasks ??
    selectOfferedTasks(playableTasks, state.players, state.recentlyOfferedTaskIds);
  const offeredRoundId = roundSelection?.roundId ?? null;

  return {
    ...state,
    phase: 'task-selection',
    offeredTasks,
    offeredRoundId,
    selectedTask: null,
    missingTaskId: null,
    recentlyOfferedTaskIds: rememberOfferedTasks(state.recentlyOfferedTaskIds, offeredTasks),
    recentlyOfferedRoundIds: rememberOfferedRound(state.recentlyOfferedRoundIds, offeredRoundId),
  };
}

function selectRoundWithFallback(
  tasks: ReturnType<typeof getPlayableCatalog>,
  rounds: NonNullable<ReturnType<typeof getActiveCatalog>>['customRounds'],
  players: [Player, Player],
  recentlyOfferedRoundIds: string[],
  gameMode: GameMode,
) {
  try {
    return selectOfferedRoundTasks(tasks, rounds, players, recentlyOfferedRoundIds);
  } catch (error) {
    if (gameMode === 'mixed') {
      return null;
    }

    throw error;
  }
}

function normalizePlayer(
  id: string,
  name: string,
  gender: GenderIdentity,
  fallbackName: string,
): Player {
  const trimmedName = name.trim();

  return {
    id,
    name: trimmedName.length > 0 ? trimmedName : fallbackName,
    gender,
  };
}

function normalizeTargetRounds(targetRounds: number) {
  if (!Number.isFinite(targetRounds)) {
    return defaultTargetRounds;
  }

  const clampedTargetRounds = Math.min(Math.max(Math.round(targetRounds), 2), 12);

  return clampedTargetRounds % 2 === 0 ? clampedTargetRounds : clampedTargetRounds + 1;
}

function getNextPlayerIndex(activePlayerIndex: 0 | 1): 0 | 1 {
  return activePlayerIndex === 0 ? 1 : 0;
}

function updateCatalog(
  state: GameSession,
  catalogId: string,
  update: (catalog: TaskCatalog) => TaskCatalog,
): GameSession {
  return {
    ...state,
    catalog: {
      ...state.catalog,
      catalogs: state.catalog.catalogs.map((catalog) =>
        catalog.id === catalogId ? update(catalog) : catalog,
      ),
    },
  };
}
