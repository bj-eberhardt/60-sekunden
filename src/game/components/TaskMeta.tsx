import { Flame, Heart } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GameTask } from '../types';
import type { Mood } from '../types';

type TaskMetaProps = {
  task: GameTask;
};

const moodDisplay: Record<Mood, string> = {
  closeness: 'NÄHE',
  flirty: 'FLIRT',
  intimate: 'INTIM',
};

function LipsIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 36">
      <path d="M4 18C15 7 22 7 32 15C42 7 49 7 60 18C48 29 16 29 4 18Z" />
      <path d="M4 18C18 20 46 20 60 18" />
      <path d="M20 12C24 15 28 16 32 15C36 16 40 15 44 12" />
    </svg>
  );
}

const moodIcons: Record<Mood, ReactNode> = {
  closeness: <Heart aria-hidden="true" />,
  flirty: <LipsIcon />,
  intimate: <Flame aria-hidden="true" />,
};

export function TaskMeta({ task }: TaskMetaProps) {
  return (
    <p className="task-meta">
      <span className="task-meta-icon">{moodIcons[task.mood]}</span>
      <span className="task-meta-label">{moodDisplay[task.mood]}</span>
    </p>
  );
}
