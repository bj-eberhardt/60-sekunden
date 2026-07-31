import { useEffect } from 'react';
import { TaskMeta } from '../components/TaskMeta';
import { useRouter } from '../../shared/router';
import { useGame } from '../state/useGame';

export function TaskDetailsScreen() {
  const { state, dispatch } = useGame();
  const { navigate } = useRouter();
  const activePlayer = state.players[state.activePlayerIndex];
  const selectedTask = state.selectedTask;

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    dispatch({ type: 'start-timer', now: Date.now() });
    navigate('/timer');
  }, [dispatch, navigate, selectedTask]);

  if (!selectedTask) {
    return null;
  }

  return (
    <main className="app-shell" data-testid="task-details-page">
      <section className="screen-panel task-detail" aria-labelledby="task-title">
        <p className="eyebrow">{activePlayer.name} hat gewählt</p>
        <TaskMeta task={selectedTask} />
        <h1 id="task-title">{selectedTask.title}</h1>
        <p className="task-text" data-testid="task-start-copy">
          Der Countdown startet jetzt.
        </p>
      </section>
    </main>
  );
}
