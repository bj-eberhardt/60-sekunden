import { builtInTasks } from '../../content/builtInTasks';
import type { TaskEligibility } from '../../game/types';
import type { CatalogSnapshot, TaskCatalog } from '../types';
import { catalogSchemaVersion, originalCatalogId } from '../types';

const validMoods = ['closeness', 'flirty', 'intimate'];
const validGenderIdentities = ['female', 'male', 'not-specified'];
const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export type CatalogValidationResult =
  { valid: true; catalog: CatalogSnapshot } | { valid: false; errors: string[] };

export function validateCatalogSnapshot(value: unknown): CatalogValidationResult {
  const errors: string[] = [];
  const catalog = value as CatalogSnapshot;

  if (!catalog || typeof catalog !== 'object') {
    return { valid: false, errors: ['Katalogdaten fehlen.'] };
  }

  if (catalog.schemaVersion !== catalogSchemaVersion) {
    errors.push('Nicht unterstuetzte Katalog-Schema-Version.');
  }

  if (!Array.isArray(catalog.catalogs)) {
    errors.push('Katalogliste fehlt.');
  }

  if (
    !catalog.catalogs?.some((item) => item.id === originalCatalogId && item.kind === 'original')
  ) {
    errors.push('Originalkatalog fehlt.');
  }

  const names = new Set<string>();
  const ids = new Set<string>();

  for (const item of catalog.catalogs ?? []) {
    validateTaskCatalog(item, errors);

    const normalizedName = item.name.toLocaleLowerCase('de-DE');

    if (names.has(normalizedName)) {
      errors.push(`Katalogname ist nicht eindeutig: ${item.name}`);
    }

    if (ids.has(item.id)) {
      errors.push(`Katalog-ID ist nicht eindeutig: ${item.id}`);
    }

    names.add(normalizedName);
    ids.add(item.id);
  }

  if (!ids.has(catalog.activeCatalogId)) {
    errors.push('Aktiver Katalog existiert nicht.');
  }

  return errors.length === 0 ? { valid: true, catalog } : { valid: false, errors };
}

function validateTaskCatalog(catalog: TaskCatalog, errors: string[]) {
  if (catalog.kind === 'custom' && !ulidPattern.test(catalog.id)) {
    errors.push(`Katalog-ID ist keine ULID: ${catalog.id}`);
  }

  if (!catalog.name.trim() || catalog.name.length > 80) {
    errors.push(`Ungueltiger Katalogname: ${catalog.name}`);
  }

  if (!Array.isArray(catalog.taskOverrides)) {
    errors.push(`Override-Liste fehlt: ${catalog.id}`);
  }

  if (!Array.isArray(catalog.customTasks)) {
    errors.push(`Aufgabenliste fehlt: ${catalog.id}`);
  }

  if (!Array.isArray(catalog.customRounds)) {
    errors.push(`Rundenliste fehlt: ${catalog.id}`);
  }

  for (const task of catalog.customTasks ?? []) {
    if (!task.title.trim() || task.title.length > 80) {
      errors.push(`Ungueltiger Aufgabentitel: ${task.id}`);
    }

    if (!task.text.trim() || task.text.length > 420) {
      errors.push(`Ungueltiger Aufgabentext: ${task.id}`);
    }

    if (!validMoods.includes(task.mood)) {
      errors.push(`Ungueltige Stimmung: ${task.id}`);
    }

    validateEligibility(task.eligibility, task.id, errors);
  }

  for (const override of catalog.taskOverrides ?? []) {
    if (!builtInTasks.some((task) => task.id === override.taskId)) {
      errors.push(`Override verweist auf unbekannte Originalaufgabe: ${override.taskId}`);
    }

    if (override.mood && !validMoods.includes(override.mood)) {
      errors.push(`Override enthaelt ungueltige Stimmung: ${override.taskId}`);
    }

    validateEligibility(override.eligibility, override.taskId, errors);
  }

  const taskIds = new Set([
    ...builtInTasks.map((task) => task.id),
    ...(catalog.customTasks ?? []).map((task) => task.id),
  ]);

  for (const round of catalog.customRounds ?? []) {
    if (!round.name.trim() || round.name.length > 80) {
      errors.push(`Ungueltiger Rundenname: ${round.id}`);
    }

    if (round.catalogId !== catalog.id) {
      errors.push(`Runde gehoert zu falschem Katalog: ${round.id}`);
    }

    if (
      !taskIds.has(round.taskIds.closeness) ||
      !taskIds.has(round.taskIds.flirty) ||
      !taskIds.has(round.taskIds.intimate)
    ) {
      errors.push(`Runde verweist auf unbekannte Aufgabe: ${round.id}`);
    }
  }
}

function validateEligibility(
  eligibility: TaskEligibility | undefined,
  ownerId: string,
  errors: string[],
) {
  if (!eligibility?.allowedGenderPairings) {
    return;
  }

  if (!Array.isArray(eligibility.allowedGenderPairings)) {
    errors.push(`Eignungsregeln sind ungueltig: ${ownerId}`);
    return;
  }

  for (const pairing of eligibility.allowedGenderPairings) {
    if (
      !Array.isArray(pairing) ||
      pairing.length !== 2 ||
      !validGenderIdentities.includes(pairing[0]) ||
      !validGenderIdentities.includes(pairing[1])
    ) {
      errors.push(`Eignungspaarung ist ungueltig: ${ownerId}`);
    }
  }
}
