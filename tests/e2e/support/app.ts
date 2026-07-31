import { expect, type Locator, type Page } from '@playwright/test';
import { byTestId } from './testIds';

const databaseName = 'sixty-seconds';

export async function openNewGame(page: Page) {
  await page.goto('/new');
  await expect(byTestId(page, 'new-game-page')).toBeVisible();
}

export async function openCatalogIndex(page: Page) {
  await page.goto('/catalog');
}

export async function setRangeValue(locator: Locator, value: string) {
  await locator.evaluate((input, nextValue) => {
    const rangeInput = input as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

    valueSetter?.call(rangeInput, nextValue);
    rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
    rangeInput.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

export async function startTwoRoundGame(page: Page) {
  await openNewGame(page);
  await setRangeValue(byTestId(page, 'new-game-round-count-input'), '2');
  await byTestId(page, 'new-game-submit-button').click();

  await expect(page).toHaveURL('/round');
  await expect(byTestId(page, 'task-selection-page')).toBeVisible();
  await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2');
  await waitForPersistedRoundSelection(page, 1);
}

export async function selectFirstOfferedTask(page: Page) {
  await byTestId(page, /^task-select-button:[^:]+$/)
    .first()
    .click();
  await expect(page).toHaveURL('/timer');
  await expect(byTestId(page, 'countdown-page')).toBeVisible();
}

export async function createCustomCatalog(page: Page, name?: string) {
  await openCatalogIndex(page);
  await byTestId(page, 'catalog-create-button').click();
  await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
  const catalogId = currentCatalogId(page);

  if (name) {
    await byTestId(page, 'catalog-name-input').fill(name);
    await byTestId(page, 'catalog-save-button').click();
    await expect(byTestId(page, 'catalog-index-page')).toBeVisible();
    await byTestId(page, `catalog-row-open:${catalogId}`).click();
    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
  }

  return catalogId;
}

export async function createCustomTask(
  page: Page,
  task = {
    title: 'E2E Aufgabe',
    text: 'Eine Aufgabe, die nur für den E2E-Test existiert.',
    mood: 'flirty',
  },
) {
  await byTestId(page, 'task-create-button').click();
  await byTestId(page, 'task-title-input').fill(task.title);
  await byTestId(page, 'task-text-input').fill(task.text);
  await byTestId(page, 'task-mood-select').selectOption(task.mood);
  await byTestId(page, 'task-submit-button').click();

  const taskRow = byTestId(page, /^task-row:[^:]+$/);
  await expect(taskRow.last()).toBeVisible();
  const lastTaskTestId = await taskRow.last().getAttribute('data-testid');
  const taskId = lastTaskTestId?.replace('task-row:', '') ?? '';

  expect(taskId).not.toBe('');

  return taskId;
}

export async function reloadAndExpectCatalogDetail(page: Page) {
  await page.reload();
  await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
}

export async function waitForPersistedCustomTask(
  page: Page,
  catalogId: string,
  taskId: string,
  present: boolean,
) {
  await page.waitForFunction(
    async ({ databaseName, catalogId, taskId, present }) => {
      const snapshot = await new Promise<PersistedCatalogSnapshot | undefined>(
        (resolve, reject) => {
          const openRequest = indexedDB.open(databaseName, 1);

          openRequest.onerror = () => reject(openRequest.error);
          openRequest.onsuccess = () => {
            const database = openRequest.result;
            const readRequest = database
              .transaction('catalog', 'readonly')
              .objectStore('catalog')
              .get('catalog-snapshot');

            readRequest.onerror = () => {
              database.close();
              reject(readRequest.error);
            };
            readRequest.onsuccess = () => {
              database.close();
              resolve(readRequest.result as PersistedCatalogSnapshot | undefined);
            };
          };
        },
      );
      const catalog = snapshot?.catalogs.find((item) => item.id === catalogId);
      const hasTask = !!catalog?.customTasks.some((task) => task.id === taskId);

      return present ? hasTask : !hasTask;
    },
    { databaseName, catalogId, taskId, present },
  );
}

export async function waitForPersistedCatalogName(page: Page, catalogId: string, name: string) {
  await page.waitForFunction(
    async ({ databaseName, catalogId, name }) => {
      const snapshot = await new Promise<PersistedCatalogSnapshot | undefined>(
        (resolve, reject) => {
          const openRequest = indexedDB.open(databaseName, 1);

          openRequest.onerror = () => reject(openRequest.error);
          openRequest.onsuccess = () => {
            const database = openRequest.result;
            const readRequest = database
              .transaction('catalog', 'readonly')
              .objectStore('catalog')
              .get('catalog-snapshot');

            readRequest.onerror = () => {
              database.close();
              reject(readRequest.error);
            };
            readRequest.onsuccess = () => {
              database.close();
              resolve(readRequest.result as PersistedCatalogSnapshot | undefined);
            };
          };
        },
      );
      const catalog = snapshot?.catalogs.find((item) => item.id === catalogId);

      return catalog?.name === name;
    },
    { databaseName, catalogId, name },
  );
}

export async function waitForPersistedOriginalOverrideTitle(
  page: Page,
  taskId: string,
  title: string,
) {
  await page.waitForFunction(
    async ({ databaseName, taskId, title }) => {
      const snapshot = await new Promise<PersistedCatalogSnapshot | undefined>(
        (resolve, reject) => {
          const openRequest = indexedDB.open(databaseName, 1);

          openRequest.onerror = () => reject(openRequest.error);
          openRequest.onsuccess = () => {
            const database = openRequest.result;
            const readRequest = database
              .transaction('catalog', 'readonly')
              .objectStore('catalog')
              .get('catalog-snapshot');

            readRequest.onerror = () => {
              database.close();
              reject(readRequest.error);
            };
            readRequest.onsuccess = () => {
              database.close();
              resolve(readRequest.result as PersistedCatalogSnapshot | undefined);
            };
          };
        },
      );
      const originalCatalog = snapshot?.catalogs.find((item) => item.id === 'original-catalog');
      const override = originalCatalog?.taskOverrides.find((item) => item.taskId === taskId);

      return override?.title === title;
    },
    { databaseName, taskId, title },
  );
}

export async function readPersistedGameState(page: Page) {
  return page.evaluate(async (databaseName) => {
    return new Promise<PersistedGameStateSnapshot | undefined>((resolve, reject) => {
      const openRequest = indexedDB.open(databaseName, 1);

      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onsuccess = () => {
        const database = openRequest.result;
        const readRequest = database
          .transaction('gameState', 'readonly')
          .objectStore('gameState')
          .get('current-game-state');

        readRequest.onerror = () => {
          database.close();
          reject(readRequest.error);
        };
        readRequest.onsuccess = () => {
          database.close();
          resolve(readRequest.result as PersistedGameStateSnapshot | undefined);
        };
      };
    });
  }, databaseName);
}

export async function readPersistedTimer(page: Page) {
  const gameState = await readPersistedGameState(page);

  return gameState?.timer;
}

export async function waitForTimerNumber(page: Page, expected: string | RegExp) {
  await expect(byTestId(page, 'timer-number')).toHaveText(expected);
}

export async function simulateDocumentVisibility(page: Page, hidden: boolean) {
  await page.evaluate((nextHidden) => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => nextHidden,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (nextHidden ? 'hidden' : 'visible'),
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

export type SeedGamePhase = 'task-selection' | 'countdown' | 'feedback';

export async function seedGameState(page: Page, phase: SeedGamePhase) {
  const selectedTask = phase === 'task-selection' ? null : seededTasks[0];
  const timer =
    phase === 'countdown'
      ? {
          durationMs: 60_000,
          endAt: Date.now() + 63_000,
          remainingMs: 60_000,
          paused: false,
        }
      : {
          durationMs: 60_000,
          endAt: null,
          remainingMs: 60_000,
          paused: false,
        };

  await writeSeededGameState(page, {
    phase,
    selectedTask,
    timer,
    turnNumber: phase === 'feedback' ? 2 : 1,
    targetRounds: 2,
  });
}

export async function seedCountdownGameState(
  page: Page,
  options: { endAt: number; remainingMs?: number; turnNumber?: number; targetRounds?: number },
) {
  await writeSeededGameState(page, {
    phase: 'countdown',
    selectedTask: seededTasks[0],
    timer: {
      durationMs: 60_000,
      endAt: options.endAt,
      remainingMs: options.remainingMs ?? 60_000,
      paused: false,
    },
    turnNumber: options.turnNumber ?? 1,
    targetRounds: options.targetRounds ?? 2,
  });
}

export async function readPersistedCatalogSnapshot(page: Page) {
  return page.evaluate(async (databaseName) => {
    return new Promise<PersistedCatalogSnapshot | undefined>((resolve, reject) => {
      const openRequest = indexedDB.open(databaseName, 1);

      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onsuccess = () => {
        const database = openRequest.result;
        const readRequest = database
          .transaction('catalog', 'readonly')
          .objectStore('catalog')
          .get('catalog-snapshot');

        readRequest.onerror = () => {
          database.close();
          reject(readRequest.error);
        };
        readRequest.onsuccess = () => {
          database.close();
          resolve(readRequest.result as PersistedCatalogSnapshot | undefined);
        };
      };
    });
  }, databaseName);
}

export async function waitForPersistedTargetRounds(page: Page, targetRounds: number) {
  await page.waitForFunction(
    async ({ databaseName, targetRounds }) => {
      const gameState = await new Promise<PersistedGameStateSnapshot | undefined>(
        (resolve, reject) => {
          const openRequest = indexedDB.open(databaseName, 1);

          openRequest.onerror = () => reject(openRequest.error);
          openRequest.onsuccess = () => {
            const database = openRequest.result;
            const readRequest = database
              .transaction('gameState', 'readonly')
              .objectStore('gameState')
              .get('current-game-state');

            readRequest.onerror = () => {
              database.close();
              reject(readRequest.error);
            };
            readRequest.onsuccess = () => {
              database.close();
              resolve(readRequest.result as PersistedGameStateSnapshot | undefined);
            };
          };
        },
      );

      return gameState?.targetRounds === targetRounds;
    },
    { databaseName, targetRounds },
  );
}

export async function waitForPersistedActiveCatalogId(page: Page, catalogId: string) {
  await page.waitForFunction(
    async ({ databaseName, catalogId }) => {
      const snapshot = await new Promise<PersistedCatalogSnapshot | undefined>(
        (resolve, reject) => {
          const openRequest = indexedDB.open(databaseName, 1);

          openRequest.onerror = () => reject(openRequest.error);
          openRequest.onsuccess = () => {
            const database = openRequest.result;
            const readRequest = database
              .transaction('catalog', 'readonly')
              .objectStore('catalog')
              .get('catalog-snapshot');

            readRequest.onerror = () => {
              database.close();
              reject(readRequest.error);
            };
            readRequest.onsuccess = () => {
              database.close();
              resolve(readRequest.result as PersistedCatalogSnapshot | undefined);
            };
          };
        },
      );

      return snapshot?.activeCatalogId === catalogId;
    },
    { databaseName, catalogId },
  );
}

export type MissingCatalogResumePhase =
  'task-selection' | 'task-details' | 'countdown' | 'feedback';

export async function seedMissingCatalogGameState(page: Page, phase: MissingCatalogResumePhase) {
  await page.evaluate(
    async ({ databaseName, phase }) => {
      const missingCatalogId = '01K183N9QY0000000000009999';
      const timestamp = '2026-07-29T00:00:00.000Z';
      const task = {
        id: 'missing-catalog-task-1',
        version: 1,
        title: 'E2E Missing Catalog Task',
        text: 'eine Aufgabe aus einem gelöschten Katalog.',
        mood: 'closeness',
        enabled: true,
      };
      const offeredTasks = [
        task,
        { ...task, id: 'missing-catalog-task-2', mood: 'flirty' },
        { ...task, id: 'missing-catalog-task-3', mood: 'intimate' },
      ];
      const selectedTask = phase === 'task-selection' ? null : task;
      const timer =
        phase === 'countdown'
          ? {
              durationMs: 60_000,
              endAt: Date.now() + 30_000,
              remainingMs: 30_000,
              paused: false,
            }
          : {
              durationMs: 60_000,
              endAt: null,
              remainingMs: 60_000,
              paused: false,
            };

      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const openRequest = indexedDB.open(databaseName, 1);

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onupgradeneeded = () => {
          const database = openRequest.result;

          if (!database.objectStoreNames.contains('catalog')) {
            database.createObjectStore('catalog');
          }

          if (!database.objectStoreNames.contains('gameState')) {
            database.createObjectStore('gameState');
          }
        };
      });

      try {
        const transaction = database.transaction(['catalog', 'gameState'], 'readwrite');

        transaction.objectStore('catalog').put(
          {
            schemaVersion: 1,
            builtInCatalogVersion: 1,
            activeCatalogId: 'original-catalog',
            catalogs: [
              {
                id: 'original-catalog',
                name: 'Originalkatalog',
                kind: 'original',
                taskOverrides: [],
                customTasks: [],
                customRounds: [],
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
          },
          'catalog-snapshot',
        );
        transaction.objectStore('gameState').put(
          {
            phase,
            players: [
              { id: 'player-1', name: 'Spieler 1', gender: 'not-specified' },
              { id: 'player-2', name: 'Spieler 2', gender: 'not-specified' },
            ],
            activePlayerIndex: 0,
            turnNumber: 2,
            targetRounds: 6,
            gameMode: 'random',
            offeredTasks,
            offeredRoundId: null,
            selectedTask,
            missingCatalogId: null,
            activeCatalogId: missingCatalogId,
            recentlyOfferedTaskIds: [],
            recentlyOfferedRoundIds: [],
            timer,
          },
          'current-game-state',
        );

        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
      } finally {
        database.close();
      }
    },
    { databaseName, phase },
  );
}

export type MissingTaskResumePhase = 'task-details' | 'countdown' | 'feedback';

export async function seedMissingTaskGameState(page: Page, phase: MissingTaskResumePhase) {
  await page.evaluate(
    async ({ databaseName, phase }) => {
      const timestamp = '2026-07-29T00:00:00.000Z';
      const deletedTask = {
        id: 'deleted-selected-task',
        version: 1,
        title: 'E2E Deleted Task',
        text: 'eine Aufgabe, die nicht mehr im Katalog existiert.',
        mood: 'closeness',
        enabled: true,
      };
      const offeredTasks = [
        deletedTask,
        { ...deletedTask, id: 'deleted-offered-task-2', mood: 'flirty' },
        { ...deletedTask, id: 'deleted-offered-task-3', mood: 'intimate' },
      ];
      const timer =
        phase === 'countdown'
          ? {
              durationMs: 60_000,
              endAt: Date.now() + 30_000,
              remainingMs: 30_000,
              paused: false,
            }
          : {
              durationMs: 60_000,
              endAt: null,
              remainingMs: 60_000,
              paused: false,
            };

      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const openRequest = indexedDB.open(databaseName, 1);

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onupgradeneeded = () => {
          const database = openRequest.result;

          if (!database.objectStoreNames.contains('catalog')) {
            database.createObjectStore('catalog');
          }

          if (!database.objectStoreNames.contains('gameState')) {
            database.createObjectStore('gameState');
          }
        };
      });

      try {
        const transaction = database.transaction(['catalog', 'gameState'], 'readwrite');

        transaction.objectStore('catalog').put(
          {
            schemaVersion: 1,
            builtInCatalogVersion: 1,
            activeCatalogId: 'original-catalog',
            catalogs: [
              {
                id: 'original-catalog',
                name: 'Originalkatalog',
                kind: 'original',
                taskOverrides: [],
                customTasks: [],
                customRounds: [],
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
          },
          'catalog-snapshot',
        );
        transaction.objectStore('gameState').put(
          {
            phase,
            players: [
              { id: 'player-1', name: 'Spieler 1', gender: 'not-specified' },
              { id: 'player-2', name: 'Spieler 2', gender: 'not-specified' },
            ],
            activePlayerIndex: 0,
            turnNumber: 2,
            targetRounds: 6,
            gameMode: 'random',
            offeredTasks,
            offeredRoundId: null,
            selectedTask: deletedTask,
            missingCatalogId: null,
            missingTaskId: null,
            activeCatalogId: 'original-catalog',
            recentlyOfferedTaskIds: [],
            recentlyOfferedRoundIds: [],
            timer,
          },
          'current-game-state',
        );

        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
      } finally {
        database.close();
      }
    },
    { databaseName, phase },
  );
}

export async function waitForPersistedRoundSelection(page: Page, turnNumber: number) {
  await page.waitForFunction(
    async ({ databaseName, turnNumber }) => {
      const gameState = await new Promise<PersistedGameStateSnapshot | undefined>(
        (resolve, reject) => {
          const openRequest = indexedDB.open(databaseName, 1);

          openRequest.onerror = () => reject(openRequest.error);
          openRequest.onsuccess = () => {
            const database = openRequest.result;
            const readRequest = database
              .transaction('gameState', 'readonly')
              .objectStore('gameState')
              .get('current-game-state');

            readRequest.onerror = () => {
              database.close();
              reject(readRequest.error);
            };
            readRequest.onsuccess = () => {
              database.close();
              resolve(readRequest.result as PersistedGameStateSnapshot | undefined);
            };
          };
        },
      );

      return (
        gameState?.phase === 'task-selection' &&
        gameState.turnNumber === turnNumber &&
        !gameState.missingTaskId
      );
    },
    { databaseName, turnNumber },
  );
}

export async function waitForPersistedGameStateCleared(page: Page) {
  await page.waitForFunction(async (databaseName) => {
    const gameState = await new Promise<PersistedGameStateSnapshot | undefined>(
      (resolve, reject) => {
        const openRequest = indexedDB.open(databaseName, 1);

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const readRequest = database
            .transaction('gameState', 'readonly')
            .objectStore('gameState')
            .get('current-game-state');

          readRequest.onerror = () => {
            database.close();
            reject(readRequest.error);
          };
          readRequest.onsuccess = () => {
            database.close();
            resolve(readRequest.result as PersistedGameStateSnapshot | undefined);
          };
        };
      },
    );

    return !gameState || gameState.phase === 'player-setup';
  }, databaseName);
}

const seededTimestamp = '2026-07-29T00:00:00.000Z';
const seededTasks = [
  {
    id: 'closeness-eye-contact-1',
    version: 1,
    source: 'built-in',
    title: 'Nur ansehen',
    text: 'Setzt euch bequem hin und schaut euch ruhig in die Augen.',
    mood: 'closeness',
    enabled: true,
  },
  {
    id: 'flirty-kissing-1',
    version: 1,
    source: 'built-in',
    title: 'Langsamer Kuss',
    text: 'Kuesst euch langsam und spielerisch.',
    mood: 'flirty',
    enabled: true,
  },
  {
    id: 'intimate-touch-1',
    version: 1,
    source: 'built-in',
    title: 'Nähe führen',
    text: 'Die aktive Person führt eine Berührung.',
    mood: 'intimate',
    enabled: true,
  },
] as const;

type SeededGameStateInput = {
  phase: SeedGamePhase;
  selectedTask: (typeof seededTasks)[number] | null;
  timer: PersistedTimerSnapshot;
  turnNumber: number;
  targetRounds: number;
};

async function writeSeededGameState(page: Page, gameStateInput: SeededGameStateInput) {
  await page.evaluate(
    async ({ databaseName, gameStateInput, seededTasks, seededTimestamp }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const openRequest = indexedDB.open(databaseName, 1);

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onupgradeneeded = () => {
          const database = openRequest.result;

          if (!database.objectStoreNames.contains('catalog')) {
            database.createObjectStore('catalog');
          }

          if (!database.objectStoreNames.contains('gameState')) {
            database.createObjectStore('gameState');
          }
        };
      });

      try {
        const transaction = database.transaction(['catalog', 'gameState'], 'readwrite');

        transaction.objectStore('catalog').put(
          {
            schemaVersion: 1,
            builtInCatalogVersion: 1,
            activeCatalogId: 'original-catalog',
            catalogs: [
              {
                id: 'original-catalog',
                name: 'Originalkatalog',
                kind: 'original',
                taskOverrides: [],
                customTasks: [],
                customRounds: [],
                createdAt: seededTimestamp,
                updatedAt: seededTimestamp,
              },
            ],
          },
          'catalog-snapshot',
        );
        transaction.objectStore('gameState').put(
          {
            phase: gameStateInput.phase,
            players: [
              { id: 'player-1', name: 'Spieler 1', gender: 'not-specified' },
              { id: 'player-2', name: 'Spieler 2', gender: 'not-specified' },
            ],
            activePlayerIndex: 0,
            turnNumber: gameStateInput.turnNumber,
            targetRounds: gameStateInput.targetRounds,
            gameMode: 'random',
            offeredTasks: [...seededTasks],
            offeredRoundId: null,
            selectedTask: gameStateInput.selectedTask,
            missingCatalogId: null,
            missingTaskId: null,
            activeCatalogId: 'original-catalog',
            recentlyOfferedTaskIds: [],
            recentlyOfferedRoundIds: [],
            timer: gameStateInput.timer,
          },
          'current-game-state',
        );

        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
      } finally {
        database.close();
      }
    },
    { databaseName, gameStateInput, seededTasks, seededTimestamp },
  );
}

type PersistedCatalogSnapshot = {
  activeCatalogId: string;
  catalogs: Array<{
    id: string;
    name: string;
    customTasks: Array<{ id: string }>;
    taskOverrides: Array<{ taskId: string; title?: string }>;
  }>;
};

type PersistedGameStateSnapshot = {
  phase: string;
  players: Array<{ name: string; gender: string }>;
  activePlayerIndex: number;
  turnNumber: number;
  targetRounds: number;
  offeredTasks: Array<{ id: string }> | null;
  selectedTask?: { id: string } | null;
  timer: PersistedTimerSnapshot;
  missingCatalogId?: string | null;
  missingTaskId?: string | null;
  activeCatalogId?: string;
};

type PersistedTimerSnapshot = {
  durationMs: number;
  endAt: number | null;
  remainingMs: number;
  paused: boolean;
};

export async function resetAppStorage(page: Page) {
  await page.goto('/');
  await page.evaluate((name) => {
    return new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(name);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onblocked = () => resolve();
    });
  }, databaseName);
}

export function currentCatalogId(page: Page) {
  const [, catalogId = ''] = new URL(page.url()).pathname.match(/^\/catalog\/(.+)$/) ?? [];

  return decodeURIComponent(catalogId);
}
