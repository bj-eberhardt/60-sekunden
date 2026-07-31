import { Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from '../../shared/router';
import { useCountdownAudioPart } from '../services/countdownAudio';
import type { CountdownAudioPart } from '../services/countdownAudio';
import { useGame } from '../state/useGame';

const timerOutroDelayMs = 3_000;

export function CountdownScreen() {
  const { state, dispatch } = useGame();
  const { navigate } = useRouter();
  const selectedTask = state.selectedTask;
  const activePlayer = state.players[state.activePlayerIndex];
  const [now, setNow] = useState(
    state.timer.endAt ? state.timer.endAt - state.timer.remainingMs : 0,
  );

  const rawRemainingMs = useMemo(() => {
    if (state.timer.paused || !state.timer.endAt) {
      return state.timer.remainingMs;
    }

    return Math.max(0, state.timer.endAt - now);
  }, [now, state.timer.endAt, state.timer.paused, state.timer.remainingMs]);
  const remainingMs = Math.min(rawRemainingMs, state.timer.durationMs);
  const timerStarted = !state.timer.endAt || rawRemainingMs <= state.timer.durationMs;
  const timerFinished = !state.timer.paused && state.timer.endAt !== null && rawRemainingMs <= 0;
  const almostOver = timerStarted && !timerFinished && remainingMs <= 10_000;
  const audioPart: CountdownAudioPart | null = timerFinished
    ? 'countdownEnd'
    : almostOver
      ? 'countdownAlmostOver'
      : timerStarted
        ? 'countdownStart'
        : null;

  useCountdownAudioPart(audioPart);

  useEffect(() => {
    if (document.hidden) {
      return;
    }

    if (!state.timer.paused && state.timer.endAt) {
      return;
    }

    if (selectedTask && state.timer.remainingMs > 0) {
      dispatch({ type: 'resume-timer', now: Date.now() });
    }
  }, [dispatch, selectedTask, state.timer.endAt, state.timer.paused, state.timer.remainingMs]);

  useEffect(() => {
    function syncTimerWithVisibility() {
      if (!selectedTask) {
        return;
      }

      if (document.hidden) {
        if (!state.timer.paused && state.timer.endAt) {
          dispatch({ type: 'pause-timer', now: Date.now() });
        }
        return;
      }

      if (state.timer.paused && state.timer.remainingMs > 0) {
        dispatch({ type: 'resume-timer', now: Date.now() });
      }
    }

    document.addEventListener('visibilitychange', syncTimerWithVisibility);
    syncTimerWithVisibility();

    return () => document.removeEventListener('visibilitychange', syncTimerWithVisibility);
  }, [dispatch, selectedTask, state.timer.endAt, state.timer.paused, state.timer.remainingMs]);

  useEffect(() => {
    if (state.timer.paused || !state.timer.endAt) {
      return;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(intervalId);
  }, [state.timer.endAt, state.timer.paused]);

  useEffect(() => {
    if (state.timer.paused || rawRemainingMs > 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: 'finish-timer' });
      navigate('/feedback');
    }, timerOutroDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, navigate, rawRemainingMs, state.timer.endAt, state.timer.paused]);

  if (!selectedTask) {
    return null;
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = Math.min(Math.max(1 - remainingMs / state.timer.durationMs, 0), 1);
  const taskText = `${activePlayer.name}, ${lowercaseFirst(selectedTask.text)}`;
  const timerStyle = { '--timer-progress': `${progress * 360}deg` } as CSSProperties;

  return (
    <main className="app-shell countdown-shell" data-testid="countdown-page">
      <section className="countdown-panel" aria-labelledby="countdown-title">
        <div
          className="timer"
          role="timer"
          aria-label={`${remainingSeconds} Sekunden verbleibend`}
          aria-live="polite"
          style={timerStyle}
        >
          <div className="timer-ring" aria-hidden="true" />
          <span className="timer-number" data-testid="timer-number">
            {remainingSeconds}
          </span>
          <Heart className="timer-heart" aria-hidden="true" />
        </div>

        <div className="countdown-copy">
          <p className="eyebrow">{activePlayer.name}</p>
          <h1 id="countdown-title">{selectedTask.title}</h1>
          <p className="task-text">{taskText}</p>
          {selectedTask.hint ? <p className="hint">{selectedTask.hint}</p> : null}
        </div>
      </section>
    </main>
  );
}

function lowercaseFirst(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return trimmed;
  }

  return `${trimmed.charAt(0).toLocaleLowerCase('de-DE')}${trimmed.slice(1)}`;
}
