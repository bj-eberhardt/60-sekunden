import { createInitialCatalogSnapshot } from '../repository/memoryCatalogRepository';
import type { CatalogSnapshot, TaskCatalog } from '../types';
import { catalogSchemaVersion } from '../types';
import { validateCatalogSnapshot } from './catalogSnapshotValidation';

export const catalogExportFormat = 'sixty-seconds-catalog';

export type CatalogExport = {
  format: typeof catalogExportFormat;
  schemaVersion: number;
  exportedAt: string;
  catalog: TaskCatalog;
};

export function createCatalogExport(catalog: TaskCatalog, exportedAt: string): CatalogExport {
  return {
    format: catalogExportFormat,
    schemaVersion: catalogSchemaVersion,
    exportedAt,
    catalog,
  };
}

export function parseCatalogExport(json: string): TaskCatalog {
  const parsed = JSON.parse(json) as Partial<CatalogExport>;

  if (parsed.format !== catalogExportFormat || parsed.schemaVersion !== catalogSchemaVersion) {
    throw new Error('Ungueltiges oder nicht unterstuetztes Katalogformat.');
  }

  const catalog = parsed.catalog;

  if (!catalog) {
    throw new Error('Der Export enthaelt keine Katalogdaten.');
  }

  if (!isTaskCatalog(catalog)) {
    throw new Error('Der Export enthaelt keinen einzelnen Fragenkatalog.');
  }

  const validation = validateCatalogSnapshot(createValidationSnapshot(catalog));

  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  return validation.catalog.catalogs.find((item) => item.id === catalog.id)!;
}

function createValidationSnapshot(catalog: TaskCatalog): CatalogSnapshot {
  const initialSnapshot = createInitialCatalogSnapshot();

  if (catalog.kind === 'original') {
    return {
      ...initialSnapshot,
      activeCatalogId: catalog.id,
      catalogs: [catalog],
    };
  }

  return {
    ...initialSnapshot,
    activeCatalogId: catalog.id,
    catalogs: [initialSnapshot.catalogs[0]!, catalog],
  };
}

function isTaskCatalog(value: unknown): value is TaskCatalog {
  const catalog = value as Partial<TaskCatalog> | undefined;

  return (
    !!catalog &&
    typeof catalog === 'object' &&
    typeof catalog.id === 'string' &&
    typeof catalog.name === 'string' &&
    (catalog.kind === 'original' || catalog.kind === 'custom') &&
    Array.isArray(catalog.taskOverrides) &&
    Array.isArray(catalog.customTasks) &&
    Array.isArray(catalog.customRounds) &&
    typeof catalog.createdAt === 'string' &&
    typeof catalog.updatedAt === 'string'
  );
}
