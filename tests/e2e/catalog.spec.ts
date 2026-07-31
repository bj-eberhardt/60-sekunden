import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import {
  createCustomCatalog,
  createCustomTask,
  currentCatalogId,
  openCatalogIndex,
  reloadAndExpectCatalogDetail,
  resetAppStorage,
  waitForPersistedCatalogName,
  waitForPersistedCustomTask,
  waitForPersistedOriginalOverrideTitle,
} from './support/app';
import {
  byTestId,
  catalogRowCopyTestId,
  catalogRowDeleteTestId,
  catalogRowExportTestId,
  catalogRowOpenTestId,
  catalogRowTestId,
  firstBuiltInTaskId,
  originalCatalogId,
  taskEligibilityPairingTestId,
  taskRowDeleteTestId,
  taskRowEditTestId,
  taskRowTestId,
  taskRowToggleTestId,
} from './support/testIds';

const importedCatalogId = '01K183N9QY0000000000000000';
const duplicateNameCatalogId = '01K183N9QY0000000000000002';

test.beforeEach(async ({ page }) => {
  await resetAppStorage(page);
});

test('catalog index shows the original catalog and creates custom catalogs', async ({ page }) => {
  await test.step('Open the catalog overview', async () => {
    await openCatalogIndex(page);

    await expect(byTestId(page, 'catalog-index-page')).toBeVisible();
    await expect(byTestId(page, 'catalog-list')).toBeVisible();
  });

  await test.step('Verify the original catalog is available and not deletable from the index', async () => {
    await expect(byTestId(page, catalogRowTestId(originalCatalogId))).toBeVisible();
    await expect(byTestId(page, catalogRowDeleteTestId(originalCatalogId))).toHaveCount(0);
  });

  await test.step('Create a new custom catalog and land on its detail page', async () => {
    await byTestId(page, 'catalog-create-button').click();

    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    await expect(byTestId(page, 'catalog-empty-state')).toBeVisible();
    expect(currentCatalogId(page)).not.toBe(originalCatalogId);
  });

  await test.step('Copy the original catalog into an editable catalog', async () => {
    await openCatalogIndex(page);
    await byTestId(page, catalogRowCopyTestId(originalCatalogId)).click();

    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    expect(currentCatalogId(page)).not.toBe(originalCatalogId);
    await expect(byTestId(page, 'catalog-delete-button')).toHaveCount(0);
    await expect(byTestId(page, /^task-row:[^:]+$/)).toHaveCount(12);
  });
});

test('catalog routing supports app, detail, browser-back and not-found paths', async ({ page }) => {
  let catalogId = '';

  await test.step('Navigate from a catalog detail page back to the catalog overview', async () => {
    catalogId = await createCustomCatalog(page);
    await byTestId(page, 'catalog-back-to-index').click();

    await expect(byTestId(page, 'catalog-index-page')).toBeVisible();
  });

  await test.step('Navigate from the catalog overview back to the home route', async () => {
    await byTestId(page, 'catalog-back-to-home').click();

    await expect(page).toHaveURL('/');
  });

  await test.step('Use browser back from catalog detail to catalog overview', async () => {
    await openCatalogIndex(page);
    await byTestId(page, catalogRowOpenTestId(catalogId)).click();
    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();

    await page.goBack();

    await expect(byTestId(page, 'catalog-index-page')).toBeVisible();
  });

  await test.step('Open a missing catalog route and return to the overview', async () => {
    await page.goto('/catalog/not-existing-id');

    await expect(byTestId(page, 'catalog-not-found-page')).toBeVisible();
    await byTestId(page, 'catalog-not-found-back-button').click();
    await expect(byTestId(page, 'catalog-index-page')).toBeVisible();
  });
});

test('custom catalog can be renamed and its tasks can be managed', async ({ page }) => {
  let catalogId = '';
  let taskId = '';

  await test.step('Create and rename a custom catalog', async () => {
    catalogId = await createCustomCatalog(page, 'E2E Custom Catalog');

    await expect(byTestId(page, 'catalog-name-input')).toHaveValue('E2E Custom Catalog');
  });

  await test.step('Add a custom task to the catalog', async () => {
    taskId = await createCustomTask(page);

    await expect(byTestId(page, taskRowTestId(taskId))).toBeVisible();
    await expect(byTestId(page, taskRowDeleteTestId(taskId))).toBeVisible();
  });

  await test.step('Toggle the custom task off and on again', async () => {
    await byTestId(page, taskRowToggleTestId(taskId)).click();
    await expect(byTestId(page, taskRowTestId(taskId))).toHaveAttribute('data-muted', 'true');

    await byTestId(page, taskRowToggleTestId(taskId)).click();
    await expect(byTestId(page, taskRowTestId(taskId))).toHaveAttribute('data-muted', 'false');
  });

  await test.step('Edit the custom task content', async () => {
    await byTestId(page, taskRowEditTestId(taskId)).click();
    await byTestId(page, 'task-title-input').fill('E2E Aufgabe bearbeitet');
    await byTestId(page, 'task-text-input').fill(
      'Der Aufgabentext wurde im E2E-Test aktualisiert.',
    );
    await byTestId(page, 'task-submit-button').click();

    await expect(byTestId(page, taskRowTestId(taskId))).toBeVisible();
  });

  await test.step('Cancel the custom task delete dialog and keep the task', async () => {
    await byTestId(page, taskRowDeleteTestId(taskId)).click();
    await expect(byTestId(page, 'confirm-dialog')).toBeVisible();
    await byTestId(page, 'confirm-dialog-cancel').click();

    await expect(byTestId(page, taskRowTestId(taskId))).toBeVisible();
  });

  await test.step('Delete the custom task through the confirmation dialog', async () => {
    await byTestId(page, taskRowDeleteTestId(taskId)).click();
    await byTestId(page, 'confirm-dialog-confirm').click();

    await expect(byTestId(page, taskRowTestId(taskId))).toHaveCount(0);
  });

  await test.step('Delete the custom catalog through the confirmation dialog', async () => {
    await openCatalogIndex(page);
    await byTestId(page, catalogRowDeleteTestId(catalogId)).click();
    await byTestId(page, 'confirm-dialog-input').fill('E2E Custom Catalog');
    await byTestId(page, 'confirm-dialog-confirm').click();

    await expect(byTestId(page, catalogRowTestId(catalogId))).toHaveCount(0);
  });
});

test('task edit screens hide catalog actions and can be canceled', async ({ page }) => {
  let taskId = '';

  await test.step('Open a custom task creation screen and verify catalog actions are hidden', async () => {
    await createCustomCatalog(page, 'E2E Edit State Catalog');
    await byTestId(page, 'task-create-button').click();

    await expect(byTestId(page, 'catalog-task-form')).toBeVisible();
    await expect(byTestId(page, 'catalog-save-button')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-back-to-index')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-name-input')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-delete-button')).toHaveCount(0);
  });

  await test.step('Cancel custom task creation and return to the task list', async () => {
    await byTestId(page, 'task-cancel-button').click();

    await expect(byTestId(page, 'catalog-task-form')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-empty-state')).toBeVisible();
  });

  await test.step('Open a custom task edit screen and verify catalog actions are hidden', async () => {
    taskId = await createCustomTask(page);
    await byTestId(page, taskRowEditTestId(taskId)).click();

    await expect(byTestId(page, 'catalog-task-form')).toBeVisible();
    await expect(byTestId(page, 'catalog-save-button')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-back-to-index')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-name-input')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-delete-button')).toHaveCount(0);
  });

  await test.step('Cancel custom task editing and return to the task list', async () => {
    await byTestId(page, 'task-cancel-button').click();

    await expect(byTestId(page, 'catalog-task-form')).toHaveCount(0);
    await expect(byTestId(page, taskRowTestId(taskId))).toBeVisible();
  });

  await test.step('Open a built-in task edit screen and verify catalog actions are hidden', async () => {
    await openCatalogIndex(page);
    await byTestId(page, catalogRowOpenTestId(originalCatalogId)).click();
    await byTestId(page, taskRowEditTestId(firstBuiltInTaskId)).click();

    await expect(byTestId(page, 'catalog-task-form')).toBeVisible();
    await expect(byTestId(page, 'catalog-save-button')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-back-to-index')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-name-input')).toHaveCount(0);
    await expect(byTestId(page, 'catalog-delete-button')).toHaveCount(0);
  });
});

test('Originalkatalog tasks can be overridden but not deleted', async ({ page }) => {
  await test.step('Open the original catalog detail page', async () => {
    await openCatalogIndex(page);
    await byTestId(page, catalogRowOpenTestId(originalCatalogId)).click();

    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    expect(currentCatalogId(page)).toBe(originalCatalogId);
  });

  await test.step('Verify original catalog and built-in tasks are not deletable', async () => {
    await expect(byTestId(page, 'catalog-delete-button')).toHaveCount(0);
    await expect(byTestId(page, taskRowDeleteTestId(firstBuiltInTaskId))).toHaveCount(0);
  });

  await test.step('Override a built-in task through the edit form', async () => {
    await byTestId(page, taskRowEditTestId(firstBuiltInTaskId)).click();
    await byTestId(page, 'task-title-input').fill('E2E Original Override');
    await byTestId(page, 'task-text-input').fill('Dieser Text überschreibt eine Built-in-Aufgabe.');
    await byTestId(page, 'task-submit-button').click();

    await expect(byTestId(page, taskRowTestId(firstBuiltInTaskId))).toBeVisible();
  });

  await test.step('Disable the built-in task without removing its row', async () => {
    await byTestId(page, taskRowToggleTestId(firstBuiltInTaskId)).click();

    await expect(byTestId(page, taskRowTestId(firstBuiltInTaskId))).toHaveAttribute(
      'data-muted',
      'true',
    );
    await expect(byTestId(page, taskRowTestId(firstBuiltInTaskId))).toBeVisible();
  });

  await test.step('Re-enable the built-in task', async () => {
    await byTestId(page, taskRowToggleTestId(firstBuiltInTaskId)).click();

    await expect(byTestId(page, taskRowTestId(firstBuiltInTaskId))).toHaveAttribute(
      'data-muted',
      'false',
    );
  });
});

test('catalog delete dialogs enforce confirmation and support canceling from index', async ({
  page,
}) => {
  let catalogId = '';

  await test.step('Create a custom catalog and open its index delete dialog', async () => {
    catalogId = await createCustomCatalog(page, 'E2E Delete Dialog Catalog');
    await openCatalogIndex(page);
    await byTestId(page, catalogRowDeleteTestId(catalogId)).click();

    await expect(byTestId(page, 'confirm-dialog')).toBeVisible();
    await expect(byTestId(page, 'confirm-dialog-confirm')).toBeDisabled();
  });

  await test.step('Reject an inexact confirmation value', async () => {
    await byTestId(page, 'confirm-dialog-input').fill('Wrong Catalog');

    await expect(byTestId(page, 'confirm-dialog-confirm')).toBeDisabled();
    await expect(byTestId(page, catalogRowTestId(catalogId))).toBeVisible();
  });

  await test.step('Cancel the delete dialog and keep the catalog', async () => {
    await byTestId(page, 'confirm-dialog-cancel').click();

    await expect(byTestId(page, catalogRowTestId(catalogId))).toBeVisible();
  });

  await test.step('Confirm the exact catalog name and remove the catalog row', async () => {
    await byTestId(page, catalogRowDeleteTestId(catalogId)).click();
    await byTestId(page, 'confirm-dialog-input').fill('E2E Delete Dialog Catalog');
    await byTestId(page, 'confirm-dialog-confirm').click();

    await expect(byTestId(page, catalogRowTestId(catalogId))).toHaveCount(0);
  });
});

test('catalog and task forms reject invalid input and enforce max lengths', async ({ page }) => {
  await test.step('Disable catalog saving for empty and whitespace-only names', async () => {
    await createCustomCatalog(page);
    await byTestId(page, 'catalog-name-input').fill('');
    await expect(byTestId(page, 'catalog-save-button')).toBeDisabled();

    await byTestId(page, 'catalog-name-input').fill('   ');
    await expect(byTestId(page, 'catalog-save-button')).toBeDisabled();
  });

  await test.step('Limit the catalog name input to 80 characters', async () => {
    await byTestId(page, 'catalog-name-input').fill('A'.repeat(90));

    await expect(byTestId(page, 'catalog-name-input')).toHaveValue('A'.repeat(80));
  });

  await test.step('Reject a new task without a title', async () => {
    await byTestId(page, 'task-create-button').click();
    await byTestId(page, 'task-text-input').fill('Text ohne Titel.');
    await byTestId(page, 'task-submit-button').click();

    await expect(byTestId(page, 'catalog-task-form')).toBeVisible();
    await expect(byTestId(page, /^task-row:[^:]+$/)).toHaveCount(0);
  });

  await test.step('Reject a new task without text', async () => {
    await byTestId(page, 'task-title-input').fill('Titel ohne Text');
    await byTestId(page, 'task-text-input').fill('');
    await byTestId(page, 'task-submit-button').click();

    await expect(byTestId(page, 'catalog-task-form')).toBeVisible();
    await expect(byTestId(page, /^task-row:[^:]+$/)).toHaveCount(0);
  });

  await test.step('Reject whitespace-only task values', async () => {
    await byTestId(page, 'task-title-input').fill('   ');
    await byTestId(page, 'task-text-input').fill('   ');
    await byTestId(page, 'task-submit-button').click();

    await expect(byTestId(page, 'catalog-task-form')).toBeVisible();
    await expect(byTestId(page, /^task-row:[^:]+$/)).toHaveCount(0);
  });

  await test.step('Limit task title and text inputs to their max lengths', async () => {
    await byTestId(page, 'task-title-input').fill('T'.repeat(90));
    await byTestId(page, 'task-text-input').fill('X'.repeat(430));

    await expect(byTestId(page, 'task-title-input')).toHaveValue('T'.repeat(80));
    await expect(byTestId(page, 'task-text-input')).toHaveValue('X'.repeat(420));
  });
});

test('catalog edits persist across reloads', async ({ page }) => {
  let catalogId = '';
  let taskId = '';

  await test.step('Persist a renamed catalog and a custom task across reload', async () => {
    catalogId = await createCustomCatalog(page, 'E2E Persist Catalog');
    taskId = await createCustomTask(page, {
      title: 'E2E Persist Task',
      text: 'Diese Aufgabe prüft Persistenz.',
      mood: 'closeness',
    });
    await waitForPersistedCatalogName(page, catalogId, 'E2E Persist Catalog');
    await waitForPersistedCustomTask(page, catalogId, taskId, true);

    await reloadAndExpectCatalogDetail(page);

    expect(currentCatalogId(page)).toBe(catalogId);
    await expect(byTestId(page, 'catalog-name-input')).toHaveValue('E2E Persist Catalog');
    await expect(byTestId(page, taskRowTestId(taskId))).toBeVisible();
  });

  await test.step('Keep a deleted custom task deleted across reload', async () => {
    await byTestId(page, taskRowDeleteTestId(taskId)).click();
    await byTestId(page, 'confirm-dialog-confirm').click();
    await waitForPersistedCustomTask(page, catalogId, taskId, false);
    await reloadAndExpectCatalogDetail(page);

    await expect(byTestId(page, taskRowTestId(taskId))).toHaveCount(0);
  });

  await test.step('Persist an original task override across reload', async () => {
    await page.goto(`/catalog/${originalCatalogId}`);
    await byTestId(page, taskRowEditTestId(firstBuiltInTaskId)).click();
    await byTestId(page, 'task-title-input').fill('E2E Persisted Original Override');
    await byTestId(page, 'task-submit-button').click();
    await waitForPersistedOriginalOverrideTitle(
      page,
      firstBuiltInTaskId,
      'E2E Persisted Original Override',
    );
    await reloadAndExpectCatalogDetail(page);
    await byTestId(page, taskRowEditTestId(firstBuiltInTaskId)).click();

    await expect(byTestId(page, 'task-title-input')).toHaveValue('E2E Persisted Original Override');
  });
});

test('catalog import and export cover valid, invalid and duplicate cases', async ({
  page,
}, testInfo) => {
  let importedCopyCatalogId = '';

  await test.step('Export the original catalog as a JSON download', async () => {
    await openCatalogIndex(page);
    const downloadPromise = page.waitForEvent('download');
    await byTestId(page, catalogRowExportTestId(originalCatalogId)).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(download.suggestedFilename()).toMatch(/\.json$/);
    expect(downloadPath).not.toBeNull();

    const exportedCatalog = JSON.parse(await readFile(downloadPath!, 'utf8')) as {
      format?: unknown;
      schemaVersion?: unknown;
      exportedAt?: unknown;
      catalog?: {
        id?: unknown;
        name?: unknown;
        kind?: unknown;
        taskOverrides?: unknown;
        customTasks?: unknown;
        customRounds?: unknown;
      };
    };

    expect(exportedCatalog.format).toBe('sixty-seconds-catalog');
    expect(exportedCatalog.schemaVersion).toBe(1);
    expect(typeof exportedCatalog.exportedAt).toBe('string');
    expect(new Date(exportedCatalog.exportedAt as string).toString()).not.toBe('Invalid Date');
    expect(exportedCatalog.catalog).toMatchObject({
      id: originalCatalogId,
      name: 'Originalkatalog',
      kind: 'original',
      taskOverrides: [],
      customTasks: [],
      customRounds: [],
    });
  });

  await test.step('Show an import error for invalid JSON', async () => {
    const invalidImportPath = testInfo.outputPath('invalid-catalog-import.json');
    await writeFile(invalidImportPath, '{ "format": "wrong" }');
    await byTestId(page, 'catalog-import-input').setInputFiles(invalidImportPath);

    await expect(byTestId(page, 'catalog-import-error')).toBeVisible();
  });

  await test.step('Clear the import error after a valid custom catalog import', async () => {
    const validImportPath = testInfo.outputPath('valid-catalog-import.json');
    await writeFile(validImportPath, JSON.stringify(createValidCatalogExport(), null, 2));
    await byTestId(page, 'catalog-import-input').setInputFiles(validImportPath);

    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    await expect(byTestId(page, 'catalog-import-error')).toHaveCount(0);
    importedCopyCatalogId = currentCatalogId(page);
    expect(currentCatalogId(page)).not.toBe(importedCatalogId);
    await expect(byTestId(page, /^task-row:[^:]+$/)).toHaveCount(1);
  });

  await test.step('Export a custom catalog with a slugged JSON filename', async () => {
    const downloadPromise = page.waitForEvent('download');
    await byTestId(page, 'catalog-back-to-index').click();
    await byTestId(page, catalogRowExportTestId(importedCopyCatalogId)).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^e2e-import-catalog-\d{4}-\d{2}-\d{2}\.json$/);
  });

  await test.step('Import an original catalog export as a custom copy', async () => {
    const originalImportPath = testInfo.outputPath('original-catalog-import.json');
    await writeFile(originalImportPath, JSON.stringify(createOriginalCatalogExport(), null, 2));
    await byTestId(page, 'catalog-import-input').setInputFiles(originalImportPath);

    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    expect(currentCatalogId(page)).not.toBe(originalCatalogId);
    await expect(byTestId(page, 'catalog-delete-button')).toHaveCount(0);
  });

  await test.step('Import a duplicate catalog name and keep both rows available', async () => {
    await openCatalogIndex(page);
    const beforeCount = await byTestId(page, /^catalog-row:[^:]+$/).count();
    const duplicateImportPath = testInfo.outputPath('duplicate-name-catalog-import.json');
    await writeFile(
      duplicateImportPath,
      JSON.stringify(
        createValidCatalogExport({
          catalogId: duplicateNameCatalogId,
          name: 'E2E Import Catalog',
          taskId: 'duplicate-e2e-task',
        }),
        null,
        2,
      ),
    );
    await byTestId(page, 'catalog-import-input').setInputFiles(duplicateImportPath);
    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    await openCatalogIndex(page);

    await expect(byTestId(page, /^catalog-row:[^:]+$/)).toHaveCount(beforeCount + 1);
  });
});

test('custom catalogs can be copied and copied again', async ({ page }) => {
  let catalogId = '';
  let copiedCatalogId = '';
  let sourceTaskId = '';

  await test.step('Create a custom catalog with a custom task', async () => {
    catalogId = await createCustomCatalog(page, 'E2E Copy Source');
    sourceTaskId = await createCustomTask(page, {
      title: 'E2E Copy Task',
      text: 'Diese Aufgabe muss in der Kopie landen.',
      mood: 'intimate',
    });
    await waitForPersistedCustomTask(page, catalogId, sourceTaskId, true);
  });

  await test.step('Copy the custom catalog and verify it is editable', async () => {
    await openCatalogIndex(page);
    await byTestId(page, catalogRowCopyTestId(catalogId)).click();
    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    copiedCatalogId = currentCatalogId(page);

    expect(copiedCatalogId).not.toBe(catalogId);
    await expect(byTestId(page, 'catalog-delete-button')).toHaveCount(0);
    await expect(byTestId(page, /^task-row:[^:]+$/)).toHaveCount(1);
  });

  await test.step('Copy the copied catalog and keep both copies reachable', async () => {
    await openCatalogIndex(page);
    const beforeCount = await byTestId(page, /^catalog-row:[^:]+$/).count();
    await byTestId(page, catalogRowCopyTestId(copiedCatalogId)).click();
    await expect(byTestId(page, 'catalog-detail-page')).toBeVisible();
    const secondCopiedCatalogId = currentCatalogId(page);
    await byTestId(page, 'catalog-back-to-index').click();

    expect(secondCopiedCatalogId).not.toBe(copiedCatalogId);
    await expect(byTestId(page, catalogRowTestId(copiedCatalogId))).toBeVisible();
    await expect(byTestId(page, catalogRowTestId(secondCopiedCatalogId))).toBeVisible();
    await expect(byTestId(page, /^catalog-row:[^:]+$/)).toHaveCount(beforeCount + 1);
  });
});

test('task eligibility pairings can be saved and removed', async ({ page }) => {
  let taskId = '';

  await test.step('Create a task with an eligibility pairing', async () => {
    await createCustomCatalog(page, 'E2E Eligibility Catalog');
    taskId = await createCustomTask(page);
    await byTestId(page, taskRowEditTestId(taskId)).click();
    await byTestId(page, 'task-eligibility-details').click();
    await byTestId(page, taskEligibilityPairingTestId('female', 'male')).check();
    await byTestId(page, 'task-submit-button').click();
  });

  await test.step('Reopen the task and verify the pairing is persisted', async () => {
    await byTestId(page, taskRowEditTestId(taskId)).click();
    await byTestId(page, 'task-eligibility-details').click();

    await expect(byTestId(page, taskEligibilityPairingTestId('female', 'male'))).toBeChecked();
  });

  await test.step('Remove the pairing and verify it stays removed', async () => {
    await byTestId(page, taskEligibilityPairingTestId('female', 'male')).uncheck();
    await byTestId(page, 'task-submit-button').click();
    await byTestId(page, taskRowEditTestId(taskId)).click();
    await byTestId(page, 'task-eligibility-details').click();

    await expect(byTestId(page, taskEligibilityPairingTestId('female', 'male'))).not.toBeChecked();
  });
});

function createValidCatalogExport(
  options: { catalogId?: string; name?: string; taskId?: string } = {},
) {
  return {
    format: 'sixty-seconds-catalog',
    schemaVersion: 1,
    exportedAt: '2026-07-29T00:00:00.000Z',
    catalog: {
      id: options.catalogId ?? importedCatalogId,
      name: options.name ?? 'E2E Import Catalog',
      kind: 'custom',
      taskOverrides: [],
      customTasks: [
        {
          id: options.taskId ?? 'imported-e2e-task',
          version: 1,
          source: 'custom',
          title: 'Importierte E2E Aufgabe',
          text: 'Diese Aufgabe wird über einen Playwright-Dateiupload importiert.',
          mood: 'closeness',
          enabled: true,
          createdAt: '2026-07-29T00:00:00.000Z',
          updatedAt: '2026-07-29T00:00:00.000Z',
        },
      ],
      customRounds: [],
      createdAt: '2026-07-29T00:00:00.000Z',
      updatedAt: '2026-07-29T00:00:00.000Z',
    },
  };
}

function createOriginalCatalogExport() {
  return {
    format: 'sixty-seconds-catalog',
    schemaVersion: 1,
    exportedAt: '2026-07-29T00:00:00.000Z',
    catalog: {
      id: originalCatalogId,
      name: 'Originalkatalog',
      kind: 'original',
      taskOverrides: [
        {
          taskId: firstBuiltInTaskId,
          enabled: false,
          updatedAt: '2026-07-29T00:00:00.000Z',
        },
      ],
      customTasks: [],
      customRounds: [],
      createdAt: '2026-07-29T00:00:00.000Z',
      updatedAt: '2026-07-29T00:00:00.000Z',
    },
  };
}
