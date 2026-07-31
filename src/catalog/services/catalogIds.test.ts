import { describe, expect, it } from 'vitest';
import { createCatalogId } from './catalogIds';

describe('createCatalogId', () => {
  it('creates a ULID-shaped catalog id', () => {
    expect(createCatalogId(1_785_283_200_000)).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});
