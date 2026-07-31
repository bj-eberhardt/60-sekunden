import { describe, expect, it } from 'vitest';
import { validateBuiltInCatalog } from '../catalog/services/catalogValidation';
import { builtInTasks } from './builtInTasks';

describe('builtInTasks', () => {
  it('passes catalog quality validation', () => {
    expect(validateBuiltInCatalog(builtInTasks)).toEqual([]);
  });
});
