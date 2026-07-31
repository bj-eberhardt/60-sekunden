import { expect, test } from '@playwright/test';
import {
  readPersistedGameState,
  readPersistedTimer,
  resetAppStorage,
  seedCountdownGameState,
  seedGameState,
  selectFirstOfferedTask,
  setRangeValue,
  startTwoRoundGame,
  waitForPersistedGameStateCleared,
  waitForTimerNumber,
} from './support/app';
import { byTestId } from './support/testIds';

test.beforeEach(async ({ page }) => {
  await resetAppStorage(page);
});

test('selected task reaches feedback and starts the next round', async ({ page }) => {
  await test.step('Start the first round through the UI', async () => {
    await startTwoRoundGame(page);
    await selectFirstOfferedTask(page);
    await expect(byTestId(page, 'timer-number')).toBeVisible();
  });

  await test.step('Restore an expired countdown as feedback', async () => {
    await seedCountdownGameState(page, {
      endAt: Date.now() - 1_000,
      remainingMs: 0,
      turnNumber: 1,
      targetRounds: 2,
    });
    await page.goto('/timer');

    await expect(byTestId(page, 'feedback-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2 abgeschlossen');
  });

  await test.step('Continue into the second round', async () => {
    await byTestId(page, 'feedback-primary-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 2 von 2');
  });
});

test('final feedback closes the game and removes the resume panel', async ({ page }) => {
  await test.step('Open final-round feedback', async () => {
    await seedGameState(page, 'feedback');
    await page.goto('/feedback');

    await expect(byTestId(page, 'feedback-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 2 von 2 abgeschlossen');
    await expect(byTestId(page, 'feedback-primary-button')).toBeEnabled();
  });

  await test.step('Finish the game', async () => {
    await byTestId(page, 'feedback-primary-button').click();
    await waitForPersistedGameStateCleared(page);

    await expect(page).toHaveURL('/');
    await expect(byTestId(page, 'home-page')).toBeVisible();
    await expect(byTestId(page, 'home-continue-panel')).toBeHidden();
  });
});

test('passing both rounds cannot exceed the target round count', async ({ page }) => {
  await test.step('Start a two-round game', async () => {
    await startTwoRoundGame(page);
  });

  await test.step('Pass both rounds', async () => {
    await byTestId(page, 'round-pass-button').click();
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 2 von 2');

    await byTestId(page, 'round-pass-button').click();
    await expect(byTestId(page, 'feedback-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 2 von 2 abgeschlossen');
    await expect(byTestId(page, 'feedback-primary-button')).toBeEnabled();
  });

  await test.step('Close without a resumable game', async () => {
    await byTestId(page, 'feedback-primary-button').click();
    await waitForPersistedGameStateCleared(page);

    await expect(byTestId(page, 'home-page')).toBeVisible();
    await expect(byTestId(page, 'home-continue-panel')).toBeHidden();
  });
});

test('round selection survives refresh and can be resumed from home', async ({ page }) => {
  await test.step('Refresh the first round', async () => {
    await startTwoRoundGame(page);
    await page.reload();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2');
  });

  await test.step('Resume the round from home', async () => {
    await page.goto('/');
    await expect(byTestId(page, 'home-continue-panel')).toBeVisible();
    await byTestId(page, 'home-continue-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2');
  });
});

test('selected task and timer route survive refresh', async ({ page }) => {
  await test.step('Select a task and refresh the timer route', async () => {
    await startTwoRoundGame(page);
    await selectFirstOfferedTask(page);
    await page.reload();

    await expect(page).toHaveURL('/timer');
    await expect(byTestId(page, 'countdown-page')).toBeVisible();
  });

  await test.step('Keep selected task persisted', async () => {
    const gameState = await readPersistedGameState(page);

    expect(gameState?.phase).toBe('countdown');
    expect(gameState?.selectedTask?.id).toBeTruthy();
  });
});

test('countdown continues after refresh instead of restarting', async ({ page }) => {
  let timerNumberBeforeReload = 0;
  let remainingBeforeReload = 0;

  await test.step('Seed an already running countdown', async () => {
    await seedCountdownGameState(page, {
      endAt: Date.now() + 58_000,
      remainingMs: 58_000,
      turnNumber: 1,
      targetRounds: 2,
    });
    await page.goto('/timer');

    await expect(byTestId(page, 'countdown-page')).toBeVisible();
    await waitForTimerNumber(page, /5[7-8]/);
    timerNumberBeforeReload = Number(await byTestId(page, 'timer-number').textContent());
    remainingBeforeReload = (await readPersistedTimer(page))?.remainingMs ?? 0;
  });

  await test.step('Reload and verify elapsed time is preserved', async () => {
    await page.waitForTimeout(1_100);
    await page.reload();

    await expect(byTestId(page, 'countdown-page')).toBeVisible();
    const timerAfterReload = await readPersistedTimer(page);
    const timerNumberAfterReload = Number(await byTestId(page, 'timer-number').textContent());

    expect(timerAfterReload?.remainingMs).toBeLessThan(remainingBeforeReload);
    expect(timerAfterReload?.remainingMs).toBeLessThan(60_000);
    expect(timerNumberAfterReload).toBeLessThanOrEqual(timerNumberBeforeReload);
  });
});

test('expired countdown restores directly to feedback', async ({ page }) => {
  await test.step('Seed an expired countdown', async () => {
    await seedCountdownGameState(page, {
      endAt: Date.now() - 1_000,
      remainingMs: 0,
      turnNumber: 1,
      targetRounds: 2,
    });
    await page.goto('/timer');
  });

  await test.step('Show feedback for the completed round', async () => {
    await expect(byTestId(page, 'feedback-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2 abgeschlossen');
  });
});

test('home continue routes to the saved phase', async ({ page }) => {
  await test.step('Resume task selection', async () => {
    await seedGameState(page, 'task-selection');
    await page.goto('/');
    await byTestId(page, 'home-continue-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
  });

  await test.step('Resume countdown', async () => {
    await resetAppStorage(page);
    await seedGameState(page, 'countdown');
    await page.goto('/');
    await byTestId(page, 'home-continue-button').click();

    await expect(page).toHaveURL('/timer');
    await expect(byTestId(page, 'countdown-page')).toBeVisible();
  });

  await test.step('Resume feedback', async () => {
    await resetAppStorage(page);
    await seedGameState(page, 'feedback');
    await page.goto('/');
    await byTestId(page, 'home-continue-button').click();

    await expect(page).toHaveURL('/feedback');
    await expect(byTestId(page, 'feedback-page')).toBeVisible();
  });
});

test('starting a new game while one is saved replaces the state', async ({ page }) => {
  await test.step('Open home with a saved game', async () => {
    await startTwoRoundGame(page);
    await page.goto('/');

    await expect(byTestId(page, 'home-continue-panel')).toBeVisible();
  });

  await test.step('Confirm starting over', async () => {
    await byTestId(page, 'home-new-game-button').click();
    await expect(byTestId(page, 'confirm-dialog')).toBeVisible();
    await byTestId(page, 'confirm-dialog-confirm').click();

    await expect(page).toHaveURL('/new');
    await expect(byTestId(page, 'new-game-page')).toBeVisible();
  });

  await test.step('Start from the first round again', async () => {
    await setRangeValue(byTestId(page, 'new-game-round-count-input'), '2');
    await byTestId(page, 'new-game-submit-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2');
  });
});

test('invalid route and phase combinations are corrected', async ({ page }) => {
  await test.step('Timer route redirects task selection back to round', async () => {
    await seedGameState(page, 'task-selection');
    await page.goto('/timer');

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
  });

  await test.step('Round route can render saved feedback', async () => {
    await resetAppStorage(page);
    await seedGameState(page, 'feedback');
    await page.goto('/round');

    await expect(byTestId(page, 'feedback-page')).toBeVisible();
  });

  await test.step('Feedback route without selected task returns to round', async () => {
    await resetAppStorage(page);
    await startTwoRoundGame(page);
    await page.goto('/feedback');

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
  });
});
