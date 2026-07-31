import { builtInCatalogVersion, builtInTasks } from '../../content/builtInTasks';
import type { CatalogSnapshot, CustomTask, TaskCatalog, TaskOverride } from '../types';
import { catalogSchemaVersion, originalCatalogId } from '../types';

const initialTimestamp = '2026-07-29T00:00:00.000Z';

export function createInitialCatalogSnapshot(): CatalogSnapshot {
  return {
    schemaVersion: catalogSchemaVersion,
    builtInCatalogVersion,
    activeCatalogId: originalCatalogId,
    catalogs: [
      {
        id: originalCatalogId,
        name: 'Originalkatalog',
        kind: 'original',
        taskOverrides: [],
        customTasks: [],
        customRounds: [],
        createdAt: initialTimestamp,
        updatedAt: initialTimestamp,
      },
    ],
  };
}

export function getActiveCatalog(snapshot = createInitialCatalogSnapshot()) {
  return (
    snapshot.catalogs.find((catalog) => catalog.id === snapshot.activeCatalogId) ??
    snapshot.catalogs[0]
  );
}

export function getPlayableCatalog(snapshot = createInitialCatalogSnapshot()) {
  const activeCatalog = getActiveCatalog(snapshot);

  if (!activeCatalog) {
    return [];
  }

  return getCatalogTasks(activeCatalog);
}

export function getCatalogTasks(catalog: TaskCatalog) {
  if (catalog.kind === 'custom') {
    return catalog.customTasks;
  }

  return [...resolveBuiltInTasks(catalog.taskOverrides), ...catalog.customTasks];
}

export function createCopiedCatalog(
  sourceCatalog: TaskCatalog,
  id: string,
  name: string,
  now: string,
) {
  const customTasks = getCatalogTasks(sourceCatalog).map<CustomTask>((task, index) => ({
    id: `${id}-task-${index + 1}`,
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
  }));

  return {
    id,
    name,
    kind: 'custom' as const,
    taskOverrides: [],
    customTasks,
    customRounds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createUniqueCatalogName(catalogs: TaskCatalog[], requestedName: string) {
  const baseName = requestedName.trim();
  const fallbackName = baseName.length > 0 ? baseName : 'Neuer Katalog';
  const existingNames = new Set(catalogs.map((catalog) => catalog.name.toLocaleLowerCase('de-DE')));

  if (!existingNames.has(fallbackName.toLocaleLowerCase('de-DE'))) {
    return fallbackName;
  }

  let suffix = 2;
  let candidate = `${fallbackName} ${suffix}`;

  while (existingNames.has(candidate.toLocaleLowerCase('de-DE'))) {
    suffix += 1;
    candidate = `${fallbackName} ${suffix}`;
  }

  return candidate;
}

export function upsertOverride(overrides: TaskOverride[], nextOverride: TaskOverride) {
  const existingOverride = overrides.find((override) => override.taskId === nextOverride.taskId);

  if (!existingOverride) {
    return [...overrides, nextOverride];
  }

  return overrides.map((override) =>
    override.taskId === nextOverride.taskId ? { ...override, ...nextOverride } : override,
  );
}

function resolveBuiltInTasks(overrides: TaskOverride[]) {
  return builtInTasks.map((task) => {
    const override = overrides.find((item) => item.taskId === task.id);

    return {
      ...task,
      enabled: override?.enabled ?? true,
      title: override?.title ?? task.title,
      text: override?.text ?? task.text,
      mood: override?.mood ?? task.mood,
      hint: override?.hint ?? task.hint,
      eligibility: override?.eligibility ?? task.eligibility,
    };
  });
}
