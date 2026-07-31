import type { Page } from '@playwright/test';

export const originalCatalogId = 'original-catalog';
export const firstBuiltInTaskId = 'closeness-eye-contact-1';

export function byTestId(page: Page, testId: Parameters<Page['getByTestId']>[0]) {
  return page.getByTestId(testId);
}

export function catalogRowTestId(catalogId: string) {
  return `catalog-row:${catalogId}`;
}

export function catalogRowOpenTestId(catalogId: string) {
  return `catalog-row-open:${catalogId}`;
}

export function catalogRowCopyTestId(catalogId: string) {
  return `catalog-row-copy:${catalogId}`;
}

export function catalogRowExportTestId(catalogId: string) {
  return `catalog-row-export:${catalogId}`;
}

export function catalogRowDeleteTestId(catalogId: string) {
  return `catalog-row-delete:${catalogId}`;
}

export function taskRowTestId(taskId: string) {
  return `task-row:${taskId}`;
}

export function taskRowEditTestId(taskId: string) {
  return `task-row-edit:${taskId}`;
}

export function taskRowToggleTestId(taskId: string) {
  return `task-row-toggle:${taskId}`;
}

export function taskRowDeleteTestId(taskId: string) {
  return `task-row-delete:${taskId}`;
}

export function taskEligibilityPairingTestId(firstGender: string, secondGender: string) {
  return `task-eligibility-pairing:${firstGender}:${secondGender}`;
}
