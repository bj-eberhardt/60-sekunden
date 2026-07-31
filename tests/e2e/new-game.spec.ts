import { expect, test, type Locator } from '@playwright/test';
import {
  createCustomCatalog,
  currentCatalogId,
  openCatalogIndex,
  openNewGame,
  readPersistedCatalogSnapshot,
  readPersistedGameState,
  resetAppStorage,
  waitForPersistedActiveCatalogId,
  waitForPersistedTargetRounds,
} from './support/app';
import { byTestId, catalogRowCopyTestId, originalCatalogId } from './support/testIds';

test.beforeEach(async ({ page }) => {
  await resetAppStorage(page);
});

test('new game starts with optional player names and fallback names', async ({ page }) => {
  await test.step('Open the new game form without entering names', async () => {
    await openNewGame(page);

    await expect(byTestId(page, 'new-game-form')).toBeVisible();
    await expect(byTestId(page, 'player-one-name-input')).toHaveValue('');
    await expect(byTestId(page, 'player-two-name-input')).toHaveValue('');
  });

  await test.step('Start the game and use fallback player names', async () => {
    await byTestId(page, 'new-game-submit-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
    await expect(byTestId(page, 'selection-title')).toContainText('Spieler 1');
  });
});

test('new game trims entered player names before starting', async ({ page }) => {
  await test.step('Enter player names with surrounding whitespace', async () => {
    await openNewGame(page);
    await byTestId(page, 'player-one-name-input').fill('  Björn  ');
    await byTestId(page, 'player-two-name-input').fill('  Alex  ');
  });

  await test.step('Start the game with normalized names', async () => {
    await byTestId(page, 'new-game-submit-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'selection-title')).toContainText('Björn');
    const gameState = await readPersistedGameState(page);
    expect(gameState?.players.map((player) => player.name)).toEqual(['Björn', 'Alex']);
  });
});

test('new game catalog selection lists all available catalogs', async ({ page }) => {
  let firstCatalogId = '';
  let secondCatalogId = '';

  await test.step('Create two custom catalogs', async () => {
    firstCatalogId = await createCustomCatalog(page, 'E2E Start Catalog A');
    secondCatalogId = await createCustomCatalog(page, 'E2E Start Catalog B');
  });

  await test.step('Open the new game form and inspect catalog options', async () => {
    await openNewGame(page);

    const catalogSelect = byTestId(page, 'new-game-catalog-select');
    const options = await catalogSelect.evaluate((select) =>
      Array.from((select as HTMLSelectElement).options).map((option) => ({
        value: option.value,
        label: option.textContent,
      })),
    );

    expect(options.map((option) => option.value)).toEqual(
      expect.arrayContaining([originalCatalogId, firstCatalogId, secondCatalogId]),
    );
    expect(options.map((option) => option.label)).toEqual(
      expect.arrayContaining(['Originalkatalog', 'E2E Start Catalog A', 'E2E Start Catalog B']),
    );
    await expect(catalogSelect).toHaveValue(secondCatalogId);
  });
});

test('new game uses the selected catalog when starting', async ({ page }) => {
  let copiedCatalogId = '';

  await test.step('Copy the original catalog into a playable custom catalog', async () => {
    await openCatalogIndex(page);
    await byTestId(page, catalogRowCopyTestId(originalCatalogId)).click();
    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    copiedCatalogId = currentCatalogId(page);
  });

  await test.step('Select the copied catalog on the new game form', async () => {
    await openNewGame(page);
    await byTestId(page, 'new-game-catalog-select').selectOption(originalCatalogId);
    await byTestId(page, 'new-game-catalog-select').selectOption(copiedCatalogId);
    await byTestId(page, 'new-game-submit-button').click();
  });

  await test.step('Persist and offer tasks from the selected catalog', async () => {
    await expect(page).toHaveURL('/round');
    await waitForPersistedActiveCatalogId(page, copiedCatalogId);

    const catalogSnapshot = await readPersistedCatalogSnapshot(page);
    const gameState = await readPersistedGameState(page);
    const activeCatalog = catalogSnapshot?.catalogs.find(
      (catalog) => catalog.id === copiedCatalogId,
    );

    expect(activeCatalog?.customTasks.length).toBeGreaterThan(0);
    expect(gameState?.offeredTasks?.every((task) => task.id.startsWith(copiedCatalogId))).toBe(
      true,
    );
  });
});

test('new game round count exposes default, boundaries and persistence', async ({ page }) => {
  await test.step('Open the new game form and verify slider attributes', async () => {
    await openNewGame(page);

    await expect(byTestId(page, 'new-game-round-count-input')).toHaveAttribute('min', '2');
    await expect(byTestId(page, 'new-game-round-count-input')).toHaveAttribute('max', '12');
    await expect(byTestId(page, 'new-game-round-count-input')).toHaveAttribute('step', '2');
    await expect(byTestId(page, 'new-game-round-count-input')).toHaveValue('6');
    await expect(byTestId(page, 'new-game-round-count-value')).toHaveText('6');
  });

  await test.step('Start a two-round game', async () => {
    await setRangeValue(byTestId(page, 'new-game-round-count-input'), '2');
    await expect(byTestId(page, 'new-game-round-count-value')).toHaveText('2');
    await byTestId(page, 'new-game-submit-button').click();

    await expect(page).toHaveURL('/round');
    await waitForPersistedTargetRounds(page, 2);
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2');
  });
});

test('new game round count supports the upper boundary', async ({ page }) => {
  await test.step('Start a twelve-round game', async () => {
    await openNewGame(page);
    await setRangeValue(byTestId(page, 'new-game-round-count-input'), '12');
    await expect(byTestId(page, 'new-game-round-count-value')).toHaveText('12');
    await byTestId(page, 'new-game-submit-button').click();
  });

  await test.step('Persist the upper boundary', async () => {
    await expect(page).toHaveURL('/round');
    await waitForPersistedTargetRounds(page, 12);
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 12');
  });
});

test('new game normalizes odd round counts to even values', async ({ page }) => {
  await test.step('Force an odd round count through the range input', async () => {
    await openNewGame(page);
    await setRangeValue(byTestId(page, 'new-game-round-count-input'), '5');
    await byTestId(page, 'new-game-submit-button').click();
  });

  await test.step('Normalize the odd value before persisting the game', async () => {
    await expect(page).toHaveURL('/round');
    await waitForPersistedTargetRounds(page, 6);
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 6');
  });
});

test('new game catalog button opens the catalog overview', async ({ page }) => {
  await test.step('Navigate from new game setup to catalog management', async () => {
    await openNewGame(page);
    await byTestId(page, 'new-game-catalog-button').click();

    await expect(page).toHaveURL('/catalog');
    await expect(byTestId(page, 'catalog-index-page')).toBeVisible();
  });
});

test('new game form remains usable after refresh', async ({ page }) => {
  await test.step('Fill the form and refresh the route', async () => {
    await openNewGame(page);
    await byTestId(page, 'player-one-name-input').fill('Björn');
    await byTestId(page, 'player-two-name-input').fill('Alex');
    await setRangeValue(byTestId(page, 'new-game-round-count-input'), '8');

    await page.reload();
    await expect(byTestId(page, 'new-game-page')).toBeVisible();
  });

  await test.step('Start a game after refresh', async () => {
    await byTestId(page, 'player-one-name-input').fill('Chris');
    await byTestId(page, 'new-game-submit-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'selection-title')).toContainText('Chris');
  });
});

async function setRangeValue(locator: Locator, value: string) {
  await locator.evaluate((input, nextValue) => {
    const rangeInput = input as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

    valueSetter?.call(rangeInput, nextValue);
    rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
    rangeInput.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
