import { expect, test } from '@playwright/test';
import {
  type MissingCatalogResumePhase,
  resetAppStorage,
  seedMissingCatalogGameState,
  waitForPersistedGameStateCleared,
} from './support/app';
import { byTestId } from './support/testIds';

const resumeRoutes: Array<{
  route: '/' | '/round' | '/task' | '/timer' | '/feedback';
  phase: MissingCatalogResumePhase;
}> = [
  { route: '/', phase: 'task-selection' },
  { route: '/round', phase: 'task-selection' },
  { route: '/task', phase: 'task-details' },
  { route: '/timer', phase: 'countdown' },
  { route: '/feedback', phase: 'feedback' },
];

test.beforeEach(async ({ page }) => {
  await resetAppStorage(page);
});

for (const scenario of resumeRoutes) {
  test(`missing catalog blocks resumed game on ${scenario.route}`, async ({ page }) => {
    await test.step('Seed a saved game that references a deleted catalog', async () => {
      await seedMissingCatalogGameState(page, scenario.phase);
    });

    await test.step('Open a route that would resume the saved game', async () => {
      await page.goto(scenario.route);

      await expect(page).toHaveURL(scenario.route);
      await expect(byTestId(page, 'missing-catalog-page')).toBeVisible();
      await expect(byTestId(page, 'missing-catalog-delete-button')).toHaveText(
        'Spieldaten löschen',
      );
    });

    await test.step('Delete the unusable saved game data', async () => {
      await byTestId(page, 'missing-catalog-delete-button').click();

      await expect(page).toHaveURL('/');
      await waitForPersistedGameStateCleared(page);
      await expect(byTestId(page, 'missing-catalog-page')).toHaveCount(0);
    });
  });
}
