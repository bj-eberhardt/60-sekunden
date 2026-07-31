import type { CustomRound } from '../types';

export type CustomRoundInput = {
  name: string;
  enabled: boolean;
  taskIds: CustomRound['taskIds'];
};

export function createCustomRound(
  input: CustomRoundInput,
  id: string,
  catalogId: string,
  now: string,
): CustomRound {
  return {
    id,
    catalogId,
    name: input.name.trim(),
    enabled: input.enabled,
    taskIds: input.taskIds,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateCustomRound(
  round: CustomRound,
  input: CustomRoundInput,
  now: string,
): CustomRound {
  return {
    ...round,
    name: input.name.trim(),
    enabled: input.enabled,
    taskIds: input.taskIds,
    updatedAt: now,
  };
}
