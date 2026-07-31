import {
  createInitialCatalogSnapshot,
  createUniqueCatalogName,
  getCatalogTasks,
} from '../repository/memoryCatalogRepository';
import type { CatalogSnapshot, CustomTask, TaskCatalog, TaskOverride } from '../types';
import { catalogSchemaVersion, originalCatalogId } from '../types';
import { createCatalogId } from './catalogIds';
import { validateCatalogSnapshot } from './catalogSnapshotValidation';

export type CatalogImportMode = 'replace' | 'append' | 'merge';

export function importCatalogAsCopy(
  current: CatalogSnapshot,
  imported: TaskCatalog,
  id: string,
  now: string,
): CatalogSnapshot {
  const catalog = cloneCatalogWithIdentity(
    imported.kind === 'original' ? convertOriginalCatalog(imported, id, now) : imported,
    id,
    createUniqueCatalogName(current.catalogs, imported.name),
  );
  const next = {
    ...current,
    activeCatalogId: id,
    catalogs: [...current.catalogs, { ...catalog, createdAt: now, updatedAt: now }],
  };
  const validation = validateCatalogSnapshot(next);

  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  return validation.catalog;
}

export function applyCatalogImport(
  current: CatalogSnapshot,
  imported: CatalogSnapshot,
  mode: CatalogImportMode,
): CatalogSnapshot {
  const next =
    mode === 'replace'
      ? imported
      : mode === 'append'
        ? appendCatalogs(current, imported)
        : mergeCatalogs(current, imported);
  const validation = validateCatalogSnapshot(next);

  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  return validation.catalog;
}

function appendCatalogs(current: CatalogSnapshot, imported: CatalogSnapshot): CatalogSnapshot {
  let catalogs = current.catalogs;

  for (const catalog of imported.catalogs) {
    if (catalog.id === originalCatalogId || catalog.kind === 'original') {
      continue;
    }

    const id = catalogs.some((item) => item.id === catalog.id) ? createCatalogId() : catalog.id;
    const name = createUniqueCatalogName(catalogs, catalog.name);
    const clonedCatalog = cloneCatalogWithIdentity(catalog, id, name);
    catalogs = [...catalogs, clonedCatalog];
  }

  return {
    ...current,
    catalogs,
  };
}

function mergeCatalogs(current: CatalogSnapshot, imported: CatalogSnapshot): CatalogSnapshot {
  const fallback = createInitialCatalogSnapshot();
  const importedOriginal =
    imported.catalogs.find((catalog) => catalog.id === originalCatalogId) ?? fallback.catalogs[0];
  const catalogs: TaskCatalog[] = current.catalogs.map((catalog) => {
    if (catalog.id !== originalCatalogId) {
      const importedCatalog = imported.catalogs.find((item) => item.id === catalog.id);
      return importedCatalog && importedCatalog.kind === 'custom'
        ? { ...importedCatalog, name: catalog.name }
        : catalog;
    }

    return {
      ...catalog,
      taskOverrides: mergeOverrides(catalog.taskOverrides, importedOriginal?.taskOverrides ?? []),
      customTasks: [...catalog.customTasks],
      customRounds: [...catalog.customRounds],
      updatedAt: new Date().toISOString(),
    };
  });

  const currentIds = new Set(catalogs.map((catalog) => catalog.id));
  let mergedCatalogs = catalogs;

  for (const importedCatalog of imported.catalogs) {
    if (importedCatalog.id === originalCatalogId || importedCatalog.kind === 'original') {
      continue;
    }

    if (currentIds.has(importedCatalog.id)) {
      continue;
    }

    const name = createUniqueCatalogName(mergedCatalogs, importedCatalog.name);
    mergedCatalogs = [
      ...mergedCatalogs,
      cloneCatalogWithIdentity(importedCatalog, importedCatalog.id, name),
    ];
  }

  return {
    schemaVersion: catalogSchemaVersion,
    builtInCatalogVersion: current.builtInCatalogVersion,
    activeCatalogId: current.activeCatalogId,
    catalogs: mergedCatalogs,
  };
}

function cloneCatalogWithIdentity(catalog: TaskCatalog, id: string, name: string): TaskCatalog {
  return {
    ...catalog,
    id,
    name,
    kind: 'custom',
    customTasks: catalog.customTasks.map((task) => ({ ...task })),
    taskOverrides: [],
    customRounds: catalog.customRounds.map((round) => ({
      ...round,
      catalogId: id,
    })),
  };
}

function convertOriginalCatalog(catalog: TaskCatalog, id: string, now: string): TaskCatalog {
  const taskIdMap = new Map<string, string>();
  const customTasks = getCatalogTasks(catalog).map<CustomTask>((task, index) => {
    const taskId = `${id}-task-${index + 1}`;
    taskIdMap.set(task.id, taskId);

    return {
      id: taskId,
      version: task.version,
      source: 'custom',
      title: task.title,
      text: task.text,
      mood: task.mood,
      enabled: task.enabled,
      hint: task.hint,
      eligibility: task.eligibility,
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    ...catalog,
    id,
    kind: 'custom',
    taskOverrides: [],
    customTasks,
    customRounds: catalog.customRounds.map((round) => ({
      ...round,
      catalogId: id,
      taskIds: {
        closeness: taskIdMap.get(round.taskIds.closeness) ?? round.taskIds.closeness,
        flirty: taskIdMap.get(round.taskIds.flirty) ?? round.taskIds.flirty,
        intimate: taskIdMap.get(round.taskIds.intimate) ?? round.taskIds.intimate,
      },
    })),
  };
}

function mergeOverrides(current: TaskOverride[], imported: TaskOverride[]) {
  const overrides = new Map(current.map((override) => [override.taskId, override]));

  for (const override of imported) {
    overrides.set(override.taskId, { ...overrides.get(override.taskId), ...override });
  }

  return [...overrides.values()];
}
