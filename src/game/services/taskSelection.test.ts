import { describe, expect, it } from 'vitest';
import { getPlayableCatalog } from '../../catalog/repository/memoryCatalogRepository';
import type { CustomRound } from '../../catalog/types';
import type { Player } from '../types';
import { selectOfferedRoundTasks, selectOfferedTasks } from './taskSelection';

const players: [Player, Player] = [
  { id: 'player-1', name: 'Spieler 1', gender: 'not-specified' },
  { id: 'player-2', name: 'Spieler 2', gender: 'not-specified' },
];

describe('selectOfferedTasks', () => {
  it('offers exactly one task per mood', () => {
    const offeredTasks = selectOfferedTasks(getPlayableCatalog(), players, []);

    expect(offeredTasks).toHaveLength(3);
    expect(offeredTasks.map((task) => task.mood).sort()).toEqual([
      'closeness',
      'flirty',
      'intimate',
    ]);
  });

  it('prefers fresh tasks over recently offered tasks', () => {
    const recentTaskIds = ['closeness-eye-contact-1', 'flirty-kissing-1', 'intimate-touch-1'];
    const offeredTasks = selectOfferedTasks(getPlayableCatalog(), players, recentTaskIds);

    expect(offeredTasks.map((task) => task.id)).not.toContain('closeness-eye-contact-1');
    expect(offeredTasks.map((task) => task.id)).not.toContain('flirty-kissing-1');
    expect(offeredTasks.map((task) => task.id)).not.toContain('intimate-touch-1');
  });

  it('falls back to a random task from the oldest candidates when all mood tasks are recent', () => {
    const catalog = getPlayableCatalog();
    const offeredTasks = selectOfferedTasks(catalog, players, [
      'closeness-eye-contact-1',
      'closeness-compliment-1',
      'closeness-conversation-1',
      'closeness-massage-1',
      'flirty-kissing-1',
      'flirty-touch-1',
      'flirty-fantasy-1',
      'flirty-roleplay-1',
      'intimate-touch-1',
      'intimate-kissing-1',
      'intimate-fantasy-1',
      'intimate-massage-1',
    ]);

    expect(offeredTasks.map((task) => task.mood).sort()).toEqual([
      'closeness',
      'flirty',
      'intimate',
    ]);
  });

  it('limits exhausted fallback selection to the five oldest candidates', () => {
    const closenessTasks = Array.from({ length: 7 }, (_, index) => ({
      id: `closeness-${index + 1}`,
      version: 1,
      title: `Nähe ${index + 1}`,
      text: `Aufgabe ${index + 1}`,
      mood: 'closeness' as const,
      enabled: true,
    }));
    const catalog = [
      ...closenessTasks,
      {
        id: 'flirty-1',
        version: 1,
        title: 'Flirt',
        text: 'Flirt',
        mood: 'flirty' as const,
        enabled: true,
      },
      {
        id: 'intimate-1',
        version: 1,
        title: 'Intim',
        text: 'Intim',
        mood: 'intimate' as const,
        enabled: true,
      },
    ];
    const offeredTasks = Array.from({ length: 30 }, () =>
      selectOfferedTasks(catalog, players, [
        'closeness-1',
        'closeness-2',
        'closeness-3',
        'closeness-4',
        'closeness-5',
        'closeness-6',
        'closeness-7',
        'flirty-1',
        'intimate-1',
      ]),
    );
    const offeredClosenessTaskIds = new Set(offeredTasks.map((tasks) => tasks[0].id));

    expect([...offeredClosenessTaskIds].sort()).toEqual([
      'closeness-1',
      'closeness-2',
      'closeness-3',
      'closeness-4',
      'closeness-5',
    ]);
  });

  it('selects playable custom round tasks', () => {
    const rounds: CustomRound[] = [
      {
        id: 'round-1',
        catalogId: 'original-catalog',
        name: 'Runde 1',
        enabled: true,
        taskIds: {
          closeness: 'closeness-eye-contact-1',
          flirty: 'flirty-kissing-1',
          intimate: 'intimate-touch-1',
        },
        createdAt: '2026-07-29T00:00:00.000Z',
        updatedAt: '2026-07-29T00:00:00.000Z',
      },
    ];
    const selectedRound = selectOfferedRoundTasks(getPlayableCatalog(), rounds, players, []);

    expect(selectedRound.roundId).toBe('round-1');
    expect(selectedRound.offeredTasks.map((task) => task.mood)).toEqual([
      'closeness',
      'flirty',
      'intimate',
    ]);
  });
});
