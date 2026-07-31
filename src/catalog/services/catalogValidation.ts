import type { BuiltInTask } from '../types';
import type { Mood } from '../../game/types';

const validMoods: Mood[] = ['closeness', 'flirty', 'intimate'];
export function validateBuiltInCatalog(tasks: BuiltInTask[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const task of tasks) {
    if (ids.has(task.id)) {
      errors.push(`Duplicate task id: ${task.id}`);
    }

    ids.add(task.id);

    if (!validMoods.includes(task.mood)) {
      errors.push(`Invalid mood for task ${task.id}: ${task.mood}`);
    }
  }

  for (const mood of validMoods) {
    if (!tasks.some((task) => task.mood === mood)) {
      errors.push(`Missing built-in task for mood: ${mood}`);
    }
  }

  return errors;
}
