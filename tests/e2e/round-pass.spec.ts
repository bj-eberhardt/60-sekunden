import { expect, test, type Locator } from '@playwright/test';
import { openNewGame, resetAppStorage } from './support/app';
import { byTestId } from './support/testIds';

test.beforeEach(async ({ page }) => {
  await resetAppStorage(page);
});

test('passing through a two-round game ends on feedback and clears the saved game', async ({
  page,
}) => {
  await test.step('Start a short game', async () => {
    await openNewGame(page);
    await setRangeValue(byTestId(page, 'new-game-round-count-input'), '2');
    await byTestId(page, 'new-game-submit-button').click();

    await expect(page).toHaveURL('/round');
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 1 von 2');
  });

  await test.step('Pass both rounds', async () => {
    await byTestId(page, 'round-pass-button').click();
    await expect(byTestId(page, 'task-selection-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 2 von 2');

    await byTestId(page, 'round-pass-button').click();
  });

  await test.step('Finish from final feedback', async () => {
    await expect(byTestId(page, 'feedback-page')).toBeVisible();
    await expect(byTestId(page, 'round-progress-label')).toHaveText('Runde 2 von 2 abgeschlossen');
    await expect(byTestId(page, 'feedback-primary-button')).toBeEnabled();

    await byTestId(page, 'feedback-primary-button').click();
  });

  await test.step('Return home without a resumable game', async () => {
    await expect(page).toHaveURL('/');
    await expect(byTestId(page, 'home-page')).toBeVisible();
    await expect(byTestId(page, 'home-continue-panel')).toBeHidden();
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
