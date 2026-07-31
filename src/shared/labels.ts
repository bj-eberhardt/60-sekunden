import type { GenderIdentity, Mood } from '../game/types';

export const moodLabels: Record<Mood, string> = {
  closeness: 'Nähe',
  flirty: 'Flirt',
  intimate: 'Intim',
};

export const genderLabels: Record<GenderIdentity, string> = {
  female: 'weiblich',
  male: 'männlich',
  'not-specified': 'keine Angabe',
};
