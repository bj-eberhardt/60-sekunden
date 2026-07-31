import { describe, expect, it } from 'vitest';
import {
  createCopiedCatalog,
  createInitialCatalogSnapshot,
  createUniqueCatalogName,
  getActiveCatalog,
  getPlayableCatalog,
} from './memoryCatalogRepository';
import type { CustomTask } from '../types';
import { originalCatalogId } from '../types';

describe('memoryCatalogRepository', () => {
  it('creates a default snapshot that includes built-in tasks', () => {
    const snapshot = createInitialCatalogSnapshot();
    const catalog = getPlayableCatalog(snapshot);

    expect(snapshot.activeCatalogId).toBe(originalCatalogId);
    expect(snapshot.catalogs[0]?.name).toBe('Originalkatalog');
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog.every((task) => task.enabled)).toBe(true);
  });

  it('applies original catalog overrides without changing the source catalog', () => {
    const snapshot = createInitialCatalogSnapshot();
    const originalCatalog = snapshot.catalogs[0];

    if (!originalCatalog) {
      throw new Error('Missing original catalog.');
    }

    const catalog = getPlayableCatalog({
      ...snapshot,
      catalogs: [
        {
          ...originalCatalog,
          taskOverrides: [
            {
              taskId: 'closeness-eye-contact-1',
              enabled: false,
              title: 'Angepasster Titel',
              updatedAt: '2026-07-29T00:00:00.000Z',
            },
          ],
        },
      ],
    });
    const task = catalog.find((item) => item.id === 'closeness-eye-contact-1');

    expect(task?.enabled).toBe(false);
    expect(task?.title).toBe('Angepasster Titel');
  });

  it('can use a custom catalog as active catalog', () => {
    const customTask: CustomTask = {
      id: 'custom-closeness-1',
      version: 1,
      source: 'custom',
      title: 'Eigene Aufgabe',
      text: 'Eine eigene Aufgabe für diese Sitzung.',
      mood: 'closeness',
      enabled: true,
      createdAt: '2026-07-29T00:00:00.000Z',
      updatedAt: '2026-07-29T00:00:00.000Z',
    };
    const snapshot = createInitialCatalogSnapshot();
    const catalog = getPlayableCatalog({
      ...snapshot,
      activeCatalogId: 'custom-catalog',
      catalogs: [
        ...snapshot.catalogs,
        {
          id: 'custom-catalog',
          name: 'Eigener Katalog',
          kind: 'custom',
          taskOverrides: [],
          customTasks: [customTask],
          customRounds: [],
          createdAt: '2026-07-29T00:00:00.000Z',
          updatedAt: '2026-07-29T00:00:00.000Z',
        },
      ],
    });

    expect(catalog).toEqual([customTask]);
  });

  it('copies a catalog into a custom catalog with unique task IDs', () => {
    const sourceCatalog = getActiveCatalog(createInitialCatalogSnapshot());

    if (!sourceCatalog) {
      throw new Error('Missing active catalog.');
    }

    const copy = createCopiedCatalog(
      sourceCatalog,
      'copied-catalog',
      'Originalkatalog Kopie',
      '2026-07-29T00:00:00.000Z',
    );

    expect(copy.kind).toBe('custom');
    expect(copy.customTasks[0]?.id).toBe('copied-catalog-task-1');
    expect(copy.customTasks.length).toBeGreaterThan(0);
  });

  it('creates unique catalog names', () => {
    const snapshot = createInitialCatalogSnapshot();

    expect(createUniqueCatalogName(snapshot.catalogs, 'Originalkatalog')).toBe('Originalkatalog 2');
  });
});
