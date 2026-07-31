import { ArrowLeft, RefreshCw, SkipForward } from 'lucide-react';
import { RoundProgress } from '../components/RoundProgress';
import { TaskMeta } from '../components/TaskMeta';
import { primeCountdownAudio } from '../services/countdownAudio';
import { useRouter } from '../../shared/router';
import { useGame } from '../state/useGame';

export function TaskSelectionScreen() {
  const { dispatch, state } = useGame();
  const { navigate } = useRouter();
  const activePlayer = state.players[state.activePlayerIndex];

  if (!state.offeredTasks) {
    return null;
  }

  return (
    <main className="app-shell" data-testid="task-selection-page">
      <nav className="catalog-back-nav" aria-label="Runde verlassen">
        <button
          className="catalog-back-button"
          data-testid="round-back-to-home"
          type="button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft aria-hidden="true" />
          <span>Zurueck zum Start</span>
        </button>
      </nav>

      <section className="screen-header" aria-labelledby="selection-title">
        <p className="eyebrow">Runde {state.turnNumber}</p>
        <h1 id="selection-title" data-testid="selection-title">
          {activePlayer.name} ist dran
        </h1>
        <p className="selection-subtitle">
          Waehle deine Aufgabe fuer die naechsten{' '}
          <span className="selection-subtitle-emphasis">60 Sekunden</span>
        </p>
        <RoundProgress currentRound={state.turnNumber} targetRounds={state.targetRounds} />
      </section>

      <section className="task-grid" aria-label="Aufgaben zur Auswahl">
        {state.offeredTasks.map((task) => (
          <article
            className={`task-card task-card-${task.mood}`}
            data-testid={`task-card:${task.id}`}
            key={task.id}
          >
            <TaskMeta task={task} />
            <h2>{task.title}</h2>
            <p>{task.text}</p>
            <button
              className="secondary-action"
              data-testid={`task-select-button:${task.id}`}
              type="button"
              onClick={() => {
                primeCountdownAudio();
                dispatch({ type: 'select-task', taskId: task.id });
                navigate('/task');
              }}
            >
              Auswaehlen
            </button>
          </article>
        ))}
      </section>

      <nav className="action-row" aria-label="Rundenaktionen">
        <button
          className="button-with-icon"
          data-testid="round-draw-tasks-button"
          type="button"
          onClick={() => dispatch({ type: 'draw-tasks' })}
        >
          <span>Neu ziehen</span>
          <RefreshCw aria-hidden="true" />
        </button>
        <button
          className="button-with-icon"
          data-testid="round-pass-button"
          type="button"
          onClick={() => dispatch({ type: 'pass-turn' })}
        >
          <span>Passen</span>
          <SkipForward aria-hidden="true" />
        </button>
      </nav>
    </main>
  );
}
