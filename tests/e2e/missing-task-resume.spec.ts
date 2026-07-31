import { expect, test } from '@playwright/test';
import {
  type MissingTaskResumePhase,
  resetAppStorage,
  seedMissingTaskGameState,
  waitForPersistedRoundSelection,
} from './support/app';
import { byTestId } from './support/testIds';

const resumeRoutes: Array<{
  route: '/' | '/round' | '/task' | '/timer' | '/feedback';
  phase: MissingTaskResumePhase;
}> = [
  { route: '/', phase: 'task-details' },
  { route: '/round', phase: 'task-details' },
  { route: '/task', phase: 'task-details' },
  { route: '/timer', phase: 'countdown' },
  { route: '/feedback', phase: 'feedback' },
];

test.beforeEach(async ({ page }) => {
  await resetAppStorage(page);
});

for (const scenario of resumeRoutes) {
  test(`missing selected task ends the current round on ${scenario.route}`, async ({ page }) => {
    await test.step('Seed a saved game with a selected task that no longer exists', async () => {
      await seedMissingTaskGameState(page, scenario.phase);
    });

    await test.step('Open a route that would resume the saved task', async () => {
      await page.goto(scenario.route);

      await expect(page).toHaveURL(scenario.route);
      await expect(byTestId(page, 'missing-task-page')).toBeVisible();
      await expect(byTestId(page, 'missing-task-next-round-button')).toHaveText(
        'Nächste Runde starten',
      );
    });

    await test.step('End the broken round and start the next selection', async () => {
      await byTestId(page, 'missing-task-next-round-button').click();

      await expect(page).toHaveURL('/round');
      await expect(byTestId(page, 'task-selection-page')).toBeVisible();
      await waitForPersistedRoundSelection(page, 3);
      await expect(byTestId(page, 'missing-task-page')).toHaveCount(0);
    });
  });
}
