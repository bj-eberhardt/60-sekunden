import { createInitialCatalogSnapshot } from '../repository/memoryCatalogRepository';
import type { CatalogSnapshot, TaskCatalog } from '../types';
import { catalogSchemaVersion, originalCatalogId } from '../types';
import { validateCatalogSnapshot } from './catalogSnapshotValidation';

type MutableCatalogSnapshot = Partial<CatalogSnapshot> & {
  schemaVersion?: number;
  catalogs?: Array<Partial<TaskCatalog>>;
};

type CatalogMigrationStep = {
  fromVersion: number;
  toVersion: number;
  migrate: (snapshot: MutableCatalogSnapshot) => MutableCatalogSnapshot;
};

export type CatalogMigrationResult =
  | { status: 'missing'; catalog: undefined; migrated: false; errors: [] }
  | { status: 'valid'; catalog: CatalogSnapshot; migrated: false; errors: [] }
  | { status: 'migrated'; catalog: CatalogSnapshot; migrated: true; errors: [] }
  | { status: 'invalid'; catalog: CatalogSnapshot; migrated: false; errors: string[] };

const legacyVersion = 0;
const migrationSteps: CatalogMigrationStep[] = [
  {
    fromVersion: legacyVersion,
    toVersion: 1,
    migrate: migrateLegacyToVersionOne,
  },
];

export function migrateCatalogSnapshot(value: unknown): CatalogMigrationResult {
  if (!value) {
    return { status: 'missing', catalog: undefined, migrated: false, errors: [] };
  }

  const directValidation = validateCatalogSnapshot(value);

  if (directValidation.valid) {
    return { status: 'valid', catalog: directValidation.catalog, migrated: false, errors: [] };
  }

  const pipelineResult = runCatalogMigrations(value);

  if (pipelineResult) {
    const migratedValidation = validateCatalogSnapshot(pipelineResult);

    if (migratedValidation.valid) {
      return {
        status: 'migrated',
        catalog: migratedValidation.catalog,
        migrated: true,
        errors: [],
      };
    }
  }

  return {
    status: 'invalid',
    catalog: createInitialCatalogSnapshot(),
    migrated: false,
    errors: directValidation.errors,
  };
}

export function getCatalogMigrationPlan(fromVersion: number, toVersion = catalogSchemaVersion) {
  const plan: CatalogMigrationStep[] = [];
  let currentVersion = fromVersion;

  while (currentVersion < toVersion) {
    const step = migrationSteps.find((item) => item.fromVersion === currentVersion);

    if (!step) {
      return null;
    }

    plan.push(step);
    currentVersion = step.toVersion;
  }

  return currentVersion === toVersion ? plan : null;
}

function runCatalogMigrations(value: unknown): CatalogSnapshot | null {
  const snapshot = value as MutableCatalogSnapshot | undefined;

  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const fromVersion =
    typeof snapshot.schemaVersion === 'number' ? snapshot.schemaVersion : legacyVersion;
  const plan = getCatalogMigrationPlan(fromVersion);

  if (!plan) {
    return null;
  }

  return plan.reduce<MutableCatalogSnapshot>(
    (nextSnapshot, step) => step.migrate(nextSnapshot),
    snapshot,
  ) as CatalogSnapshot;
}

function migrateLegacyToVersionOne(snapshot: MutableCatalogSnapshot): MutableCatalogSnapshot {
  if (!Array.isArray(snapshot.catalogs)) {
    return snapshot;
  }

  const catalogs = snapshot.catalogs.map((catalog) => normalizeLegacyCatalog(catalog));
  const hasOriginal = catalogs.some(
    (catalog) => catalog.id === originalCatalogId && catalog.kind === 'original',
  );

  return {
    ...snapshot,
    schemaVersion: 1,
    builtInCatalogVersion:
      typeof snapshot.builtInCatalogVersion === 'number' ? snapshot.builtInCatalogVersion : 1,
    activeCatalogId:
      typeof snapshot.activeCatalogId === 'string' ? snapshot.activeCatalogId : originalCatalogId,
    catalogs: hasOriginal
      ? catalogs
      : [createInitialCatalogSnapshot().catalogs[0] as TaskCatalog, ...catalogs],
  };
}

function normalizeLegacyCatalog(catalog: Partial<TaskCatalog>): TaskCatalog {
  const now = new Date().toISOString();

  return {
    id: typeof catalog.id === 'string' ? catalog.id : originalCatalogId,
    name: typeof catalog.name === 'string' ? catalog.name : 'Originalkatalog',
    kind: catalog.kind === 'custom' ? 'custom' : 'original',
    taskOverrides: Array.isArray(catalog.taskOverrides) ? catalog.taskOverrides : [],
    customTasks: Array.isArray(catalog.customTasks) ? catalog.customTasks : [],
    customRounds: Array.isArray(catalog.customRounds) ? catalog.customRounds : [],
    createdAt: typeof catalog.createdAt === 'string' ? catalog.createdAt : now,
    updatedAt: typeof catalog.updatedAt === 'string' ? catalog.updatedAt : now,
  };
}
