import type { CustomRound } from '../../catalog/types';
import type { GameTask, Mood, Player } from '../types';

const moodOrder: Mood[] = ['closeness', 'flirty', 'intimate'];
const maxRecentTaskIds = 12;
const maxRecentRoundIds = 8;
const oldestCandidatePoolSize = 5;

export function selectOfferedTasks(
  catalog: GameTask[],
  players: [Player, Player],
  activePlayerIndex: 0 | 1,
  recentlyOfferedTaskIds: string[],
): [GameTask, GameTask, GameTask] {
  const offeredTasks = moodOrder.map((mood) => {
    const candidates = catalog.filter(
      (task) =>
        task.enabled &&
        task.mood === mood &&
        isEligibleForPlayers(task, players, activePlayerIndex),
    );

    if (candidates.length === 0) {
      throw new Error(`No enabled task available for mood "${mood}".`);
    }

    const freshCandidates = candidates.filter((task) => !recentlyOfferedTaskIds.includes(task.id));
    const selectedTask =
      freshCandidates.length > 0
        ? pickRandom(freshCandidates)
        : pickRandomOldestCandidates(candidates, recentlyOfferedTaskIds);

    return selectedTask;
  });

  return offeredTasks as [GameTask, GameTask, GameTask];
}

export function rememberOfferedTasks(
  recentlyOfferedTaskIds: string[],
  offeredTasks: [GameTask, GameTask, GameTask],
): string[] {
  return [...recentlyOfferedTaskIds, ...offeredTasks.map((task) => task.id)].slice(
    -maxRecentTaskIds,
  );
}

export function selectOfferedRoundTasks(
  tasks: GameTask[],
  rounds: CustomRound[],
  players: [Player, Player],
  activePlayerIndex: 0 | 1,
  recentlyOfferedRoundIds: string[],
): { offeredTasks: [GameTask, GameTask, GameTask]; roundId: string } {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const candidates = rounds.filter((round) => {
    if (!round.enabled) {
      return false;
    }

    return moodOrder.every((mood) => {
      const task = taskMap.get(round.taskIds[mood]);
      return (
        !!task &&
        task.enabled &&
        task.mood === mood &&
        isEligibleForPlayers(task, players, activePlayerIndex)
      );
    });
  });

  if (candidates.length === 0) {
    throw new Error('No enabled custom round is playable for the current players.');
  }

  const freshCandidates = candidates.filter((round) => !recentlyOfferedRoundIds.includes(round.id));
  const selectedRound =
    freshCandidates.length > 0
      ? pickRandom(freshCandidates)
      : pickRandomOldestCandidates(candidates, recentlyOfferedRoundIds);
  const offeredTasks = moodOrder.map((mood) => taskMap.get(selectedRound.taskIds[mood]));

  if (offeredTasks.some((task) => !task)) {
    throw new Error('Selected round references an unavailable task.');
  }

  return {
    offeredTasks: offeredTasks as [GameTask, GameTask, GameTask],
    roundId: selectedRound.id,
  };
}

export function rememberOfferedRound(
  recentlyOfferedRoundIds: string[],
  roundId: string | null,
): string[] {
  if (!roundId) {
    return recentlyOfferedRoundIds;
  }

  return [...recentlyOfferedRoundIds, roundId].slice(-maxRecentRoundIds);
}

function isEligibleForPlayers(
  task: GameTask,
  players: [Player, Player],
  activePlayerIndex: 0 | 1,
): boolean {
  if (!task.eligibility?.allowedGenderPairings) {
    return true;
  }

  const activePlayer = players[activePlayerIndex];
  const partner = players[activePlayerIndex === 0 ? 1 : 0];
  const pairing = [activePlayer.gender, partner.gender];

  return task.eligibility.allowedGenderPairings.some(
    ([firstGender, secondGender]) => firstGender === pairing[0] && secondGender === pairing[1],
  );
}

function pickRandom<T>(items: T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];

  if (!item) {
    throw new Error('Cannot pick an item from an empty list.');
  }

  return item;
}

function pickRandomOldestCandidates<T extends { id: string }>(
  items: T[],
  recentlyOfferedIds: string[],
) {
  const oldestCandidates = [...items]
    .sort(
      (firstItem, secondItem) =>
        getRecentIndex(firstItem.id, recentlyOfferedIds) -
        getRecentIndex(secondItem.id, recentlyOfferedIds),
    )
    .slice(0, oldestCandidatePoolSize);

  return pickRandom(oldestCandidates);
}

function getRecentIndex(id: string, recentlyOfferedIds: string[]) {
  const index = recentlyOfferedIds.lastIndexOf(id);
  return index === -1 ? Number.NEGATIVE_INFINITY : index;
}
