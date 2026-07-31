import { describe, expect, it } from 'vitest';
import { createInitialCatalogSnapshot } from '../repository/memoryCatalogRepository';
import { createCatalogExport, parseCatalogExport } from './catalogExport';
import { applyCatalogImport, importCatalogAsCopy } from './catalogImport';
import { createCatalogId } from './catalogIds';
import { validateCatalogSnapshot } from './catalogSnapshotValidation';

describe('catalogExport', () => {
  it('exports and parses one catalog without game state', () => {
    const snapshot = createInitialCatalogSnapshot();
    const catalog = snapshot.catalogs[0]!;
    const exportData = createCatalogExport(catalog, '2026-07-29T00:00:00.000Z');
    const parsed = parseCatalogExport(JSON.stringify(exportData));

    expect(parsed).toEqual(catalog);
    expect(JSON.stringify(exportData)).not.toContain('Spieler 1');
  });

  it('rejects invalid import data before it can be persisted', () => {
    expect(() =>
      parseCatalogExport(
        JSON.stringify({
          format: 'sixty-seconds-catalog',
          schemaVersion: 1,
          exportedAt: '2026-07-29T00:00:00.000Z',
          catalog: {
            id: 'not-a-ulid',
            name: 'Kaputt',
            kind: 'custom',
            taskOverrides: [],
            customTasks: [],
            customRounds: [],
            createdAt: '2026-07-29T00:00:00.000Z',
            updatedAt: '2026-07-29T00:00:00.000Z',
          },
        }),
      ),
    ).toThrow();
  });

  it('imports a catalog with a fresh id and selects it', () => {
    const current = createInitialCatalogSnapshot();
    const imported = {
      id: createCatalogId(),
      name: 'Originalkatalog',
      kind: 'custom' as const,
      taskOverrides: [],
      customTasks: [],
      customRounds: [],
      createdAt: '2026-07-29T00:00:00.000Z',
      updatedAt: '2026-07-29T00:00:00.000Z',
    };
    const id = createCatalogId();
    const next = importCatalogAsCopy(current, imported, id, '2026-07-29T00:00:00.000Z');

    expect(next.activeCatalogId).toBe(id);
    expect(next.catalogs).toHaveLength(2);
    expect(next.catalogs[1]?.id).toBe(id);
    expect(next.catalogs[1]?.name).toBe('Originalkatalog 2');
  });

  it('appends custom catalogs with unique names', () => {
    const current = createInitialCatalogSnapshot();
    const imported = {
      ...createInitialCatalogSnapshot(),
      catalogs: [
        createInitialCatalogSnapshot().catalogs[0]!,
        {
          id: createCatalogId(),
          name: 'Originalkatalog',
          kind: 'custom' as const,
          taskOverrides: [],
          customTasks: [],
          customRounds: [],
          createdAt: '2026-07-29T00:00:00.000Z',
          updatedAt: '2026-07-29T00:00:00.000Z',
        },
      ],
    };
    const next = applyCatalogImport(current, imported, 'append');

    expect(next.catalogs).toHaveLength(2);
    expect(next.catalogs[1]?.name).toBe('Originalkatalog 2');
  });

  it('merges original overrides without removing existing catalogs', () => {
    const current = createInitialCatalogSnapshot();
    const imported = {
      ...createInitialCatalogSnapshot(),
      catalogs: [
        {
          ...createInitialCatalogSnapshot().catalogs[0]!,
          taskOverrides: [
            {
              taskId: 'closeness-eye-contact-1',
              enabled: false,
              updatedAt: '2026-07-29T00:00:00.000Z',
            },
          ],
        },
      ],
    };
    const next = applyCatalogImport(current, imported, 'merge');

    expect(next.catalogs[0]?.taskOverrides[0]?.enabled).toBe(false);
    expect(validateCatalogSnapshot(next).valid).toBe(true);
  });

  it('validates eligibility pairings', () => {
    const catalog = createInitialCatalogSnapshot();
    catalog.catalogs[0]!.taskOverrides = [
      {
        taskId: 'closeness-eye-contact-1',
        eligibility: {
          allowedGenderPairings: [['female', 'not-specified']],
        },
        updatedAt: '2026-07-29T00:00:00.000Z',
      },
    ];

    expect(validateCatalogSnapshot(catalog).valid).toBe(true);

    catalog.catalogs[0]!.taskOverrides[0]!.eligibility = {
      allowedGenderPairings: [['female', 'invalid-gender' as never]],
    };

    expect(validateCatalogSnapshot(catalog).valid).toBe(false);
  });
});
