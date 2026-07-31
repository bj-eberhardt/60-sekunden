import type { CustomTask } from '../types';
import type { Mood, TaskEligibility } from '../../game/types';

export type CustomTaskInput = {
  title: string;
  text: string;
  mood: Mood;
  enabled: boolean;
  eligibility?: TaskEligibility;
};

export function createCustomTask(input: CustomTaskInput, id: string, now: string): CustomTask {
  return {
    id,
    version: 1,
    source: 'custom',
    title: input.title.trim(),
    text: input.text.trim(),
    mood: input.mood,
    enabled: input.enabled,
    eligibility: normalizeEligibility(input.eligibility),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateCustomTask(
  task: CustomTask,
  input: CustomTaskInput,
  now: string,
): CustomTask {
  return {
    ...task,
    title: input.title.trim(),
    text: input.text.trim(),
    mood: input.mood,
    enabled: input.enabled,
    eligibility: normalizeEligibility(input.eligibility),
    updatedAt: now,
  };
}

function normalizeEligibility(eligibility: TaskEligibility | undefined) {
  if (!eligibility?.allowedGenderPairings?.length) {
    return undefined;
  }

  return eligibility;
}
