import { describe, expect, it } from 'vitest';
import { getActiveCatalog } from '../../catalog/repository/memoryCatalogRepository';
import { originalCatalogId } from '../../catalog/types';
import { gameReducer, initialGameSession } from './gameReducer';

describe('gameReducer', () => {
  it('starts a game with fallback player names and offered tasks', () => {
    const state = gameReducer(initialGameSession, {
      type: 'start-game',
      payload: {
        firstName: '',
        firstGender: 'not-specified',
        secondName: '  Alex  ',
        secondGender: 'female',
        gameMode: 'random',
        targetRounds: 6,
      },
    });

    expect(state.phase).toBe('task-selection');
    expect(state.players[0].name).toBe('Spieler 1');
    expect(state.players[1].name).toBe('Alex');
    expect(state.targetRounds).toBe(6);
    expect(state.offeredTasks).toHaveLength(3);
  });

  it('keeps the active player when drawing new tasks', () => {
    const startedState = gameReducer(initialGameSession, {
      type: 'start-game',
      payload: {
        firstName: '',
        firstGender: 'not-specified',
        secondName: '',
        secondGender: 'not-specified',
        gameMode: 'random',
        targetRounds: 6,
      },
    });
    const redrawnState = gameReducer(startedState, { type: 'draw-tasks' });

    expect(redrawnState.phase).toBe('task-selection');
    expect(redrawnState.activePlayerIndex).toBe(startedState.activePlayerIndex);
  });

  it('passes immediately to the next player', () => {
    const startedState = gameReducer(initialGameSession, {
      type: 'start-game',
      payload: {
        firstName: '',
        firstGender: 'not-specified',
        secondName: '',
        secondGender: 'not-specified',
        gameMode: 'random',
        targetRounds: 6,
      },
    });
    const passedState = gameReducer(startedState, { type: 'pass-turn' });

    expect(passedState.phase).toBe('task-selection');
    expect(passedState.activePlayerIndex).toBe(1);
    expect(passedState.turnNumber).toBe(2);
  });

  it('shows feedback when passing on the final round', () => {
    const finalRoundState = {
      ...initialGameSession,
      phase: 'task-selection' as const,
      turnNumber: 2,
      targetRounds: 2,
    };
    const passedState = gameReducer(finalRoundState, { type: 'pass-turn' });

    expect(passedState.phase).toBe('feedback');
    expect(passedState.turnNumber).toBe(2);
  });

  it('calculates timer pause and resume from timestamps', () => {
    const countdownState = gameReducer(initialGameSession, { type: 'start-timer', now: 1_000 });
    const pausedState = gameReducer(countdownState, { type: 'pause-timer', now: 11_000 });
    const resumedState = gameReducer(pausedState, { type: 'resume-timer', now: 20_000 });

    expect(pausedState.timer.remainingMs).toBe(53_000);
    expect(pausedState.timer.paused).toBe(true);
    expect(resumedState.timer.endAt).toBe(73_000);
    expect(resumedState.timer.paused).toBe(false);
  });

  it('continues from feedback to the next player with new offered tasks', () => {
    const feedbackState = {
      ...initialGameSession,
      phase: 'feedback' as const,
      activePlayerIndex: 0 as const,
      turnNumber: 1,
    };
    const nextState = gameReducer(feedbackState, { type: 'continue-after-feedback' });

    expect(nextState.phase).toBe('task-selection');
    expect(nextState.activePlayerIndex).toBe(1);
    expect(nextState.turnNumber).toBe(2);
    expect(nextState.offeredTasks).toHaveLength(3);
  });

  it('does not advance beyond the configured final round', () => {
    const feedbackState = {
      ...initialGameSession,
      phase: 'feedback' as const,
      activePlayerIndex: 0 as const,
      turnNumber: 3,
      targetRounds: 3,
    };
    const nextState = gameReducer(feedbackState, { type: 'continue-after-feedback' });

    expect(nextState).toBe(feedbackState);
  });

  it('normalizes target rounds to even values', () => {
    const state = gameReducer(initialGameSession, {
      type: 'start-game',
      payload: {
        firstName: '',
        firstGender: 'not-specified',
        secondName: '',
        secondGender: 'not-specified',
        gameMode: 'random',
        targetRounds: 5,
      },
    });

    expect(state.targetRounds).toBe(6);
  });

  it('manages custom tasks in the in-memory catalog', () => {
    const addedState = gameReducer(initialGameSession, {
      type: 'add-custom-task',
      catalogId: originalCatalogId,
      id: 'custom-task-1',
      now: '2026-07-29T00:00:00.000Z',
      payload: {
        title: '  Eigene Nähe  ',
        text: '  Eine eigene Aufgabe.  ',
        mood: 'closeness',
        enabled: true,
      },
    });
    const updatedState = gameReducer(addedState, {
      type: 'update-custom-task',
      catalogId: originalCatalogId,
      taskId: 'custom-task-1',
      now: '2026-07-29T00:01:00.000Z',
      payload: {
        title: 'Eigene Nähe aktualisiert',
        text: 'Ein neuer Text.',
        mood: 'flirty',
        enabled: true,
      },
    });
    const toggledState = gameReducer(updatedState, {
      type: 'toggle-custom-task',
      catalogId: originalCatalogId,
      taskId: 'custom-task-1',
      now: '2026-07-29T00:02:00.000Z',
    });
    const deletedState = gameReducer(toggledState, {
      type: 'delete-custom-task',
      catalogId: originalCatalogId,
      taskId: 'custom-task-1',
      now: '2026-07-29T00:03:00.000Z',
    });
    const addedCatalog = getActiveCatalog(addedState.catalog);
    const updatedCatalog = getActiveCatalog(updatedState.catalog);
    const toggledCatalog = getActiveCatalog(toggledState.catalog);
    const deletedCatalog = getActiveCatalog(deletedState.catalog);

    expect(addedCatalog?.customTasks[0]?.title).toBe('Eigene Nähe');
    expect(updatedCatalog?.customTasks[0]?.mood).toBe('flirty');
    expect(toggledCatalog?.customTasks[0]?.enabled).toBe(false);
    expect(deletedCatalog?.customTasks).toEqual([]);
  });

  it('manages built-in task overrides', () => {
    const overriddenState = gameReducer(initialGameSession, {
      type: 'save-task-override',
      catalogId: originalCatalogId,
      payload: {
        taskId: 'closeness-eye-contact-1',
        enabled: false,
        title: 'Bearbeitete Originalaufgabe',
        text: 'Bearbeiteter Text.',
        mood: 'flirty',
        updatedAt: '2026-07-29T00:00:00.000Z',
      },
    });
    const toggledState = gameReducer(overriddenState, {
      type: 'toggle-built-in-task',
      catalogId: originalCatalogId,
      taskId: 'closeness-eye-contact-1',
      now: '2026-07-29T00:01:00.000Z',
    });
    const resetState = gameReducer(toggledState, {
      type: 'reset-built-in-task',
      catalogId: originalCatalogId,
      taskId: 'closeness-eye-contact-1',
      now: '2026-07-29T00:02:00.000Z',
    });
    const overriddenCatalog = getActiveCatalog(overriddenState.catalog);
    const toggledCatalog = getActiveCatalog(toggledState.catalog);
    const resetCatalog = getActiveCatalog(resetState.catalog);

    expect(overriddenCatalog?.taskOverrides[0]?.title).toBe('Bearbeitete Originalaufgabe');
    expect(toggledCatalog?.taskOverrides[0]?.enabled).toBe(true);
    expect(resetCatalog?.taskOverrides).toEqual([]);
  });

  it('copies and deletes catalogs while protecting the original catalog', () => {
    const copiedState = gameReducer(initialGameSession, {
      type: 'copy-catalog',
      sourceCatalogId: originalCatalogId,
      id: 'copy-1',
      now: '2026-07-29T00:00:00.000Z',
    });
    const attemptedOriginalDeleteState = gameReducer(copiedState, {
      type: 'delete-catalog',
      catalogId: originalCatalogId,
    });
    const deletedCopyState = gameReducer(attemptedOriginalDeleteState, {
      type: 'delete-catalog',
      catalogId: 'copy-1',
    });

    expect(copiedState.catalog.catalogs).toHaveLength(2);
    expect(copiedState.catalog.activeCatalogId).toBe('copy-1');
    expect(attemptedOriginalDeleteState.catalog.catalogs).toHaveLength(2);
    expect(deletedCopyState.catalog.catalogs).toHaveLength(1);
    expect(deletedCopyState.catalog.activeCatalogId).toBe(originalCatalogId);
  });

  it('manages custom rounds in a catalog', () => {
    const addedState = gameReducer(initialGameSession, {
      type: 'add-custom-round',
      catalogId: originalCatalogId,
      id: 'round-1',
      now: '2026-07-29T00:00:00.000Z',
      payload: {
        name: 'Erste Runde',
        enabled: true,
        taskIds: {
          closeness: 'closeness-eye-contact-1',
          flirty: 'flirty-kissing-1',
          intimate: 'intimate-touch-1',
        },
      },
    });
    const duplicatedState = gameReducer(addedState, {
      type: 'duplicate-custom-round',
      catalogId: originalCatalogId,
      roundId: 'round-1',
      id: 'round-2',
      now: '2026-07-29T00:01:00.000Z',
    });
    const toggledState = gameReducer(duplicatedState, {
      type: 'toggle-custom-round',
      catalogId: originalCatalogId,
      roundId: 'round-2',
      now: '2026-07-29T00:02:00.000Z',
    });
    const deletedState = gameReducer(toggledState, {
      type: 'delete-custom-round',
      catalogId: originalCatalogId,
      roundId: 'round-1',
      now: '2026-07-29T00:03:00.000Z',
    });
    const activeCatalog = getActiveCatalog(deletedState.catalog);

    expect(getActiveCatalog(addedState.catalog)?.customRounds).toHaveLength(1);
    expect(getActiveCatalog(duplicatedState.catalog)?.customRounds).toHaveLength(2);
    expect(getActiveCatalog(toggledState.catalog)?.customRounds[1]?.enabled).toBe(false);
    expect(activeCatalog?.customRounds.map((round) => round.id)).toEqual(['round-2']);
  });

  it('uses playable custom rounds when the game mode requires them', () => {
    const roundState = gameReducer(initialGameSession, {
      type: 'add-custom-round',
      catalogId: originalCatalogId,
      id: 'round-1',
      now: '2026-07-29T00:00:00.000Z',
      payload: {
        name: 'Erste Runde',
        enabled: true,
        taskIds: {
          closeness: 'closeness-eye-contact-1',
          flirty: 'flirty-kissing-1',
          intimate: 'intimate-touch-1',
        },
      },
    });
    const startedState = gameReducer(roundState, {
      type: 'start-game',
      payload: {
        firstName: '',
        firstGender: 'not-specified',
        secondName: '',
        secondGender: 'not-specified',
        gameMode: 'customRounds',
        targetRounds: 6,
      },
    });

    expect(startedState.offeredRoundId).toBe('round-1');
    expect(startedState.offeredTasks?.map((task) => task.id)).toEqual([
      'closeness-eye-contact-1',
      'flirty-kissing-1',
      'intimate-touch-1',
    ]);
  });
});
