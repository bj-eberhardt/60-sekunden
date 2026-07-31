import { FileQuestion } from 'lucide-react';
import { useRouter } from '../../shared/router';
import { useGame } from '../state/useGame';

export function MissingTaskScreen() {
  const { dispatch, state } = useGame();
  const { navigate } = useRouter();

  return (
    <main className="app-shell setup-shell">
      <section
        className="screen-panel missing-task-panel"
        aria-labelledby="missing-task-title"
        data-testid="missing-task-page"
      >
        <div className="missing-task-icon-wrap" aria-hidden="true">
          <FileQuestion className="missing-task-icon" />
        </div>

        <p className="eyebrow">Runde nicht fortsetzbar</p>
        <h1 id="missing-task-title">Aufgabe fehlt</h1>
        <p className="intro">
          Die gespeicherte Aufgabe aus dieser Runde existiert nicht mehr. Beendet diese Runde und
          startet direkt mit einer neuen Auswahl.
        </p>
        {state.missingTaskId ? (
          <p className="supporting-copy">Fehlende Aufgabe: {state.missingTaskId}</p>
        ) : null}

        <div className="action-row missing-task-actions">
          <button
            className="primary-action"
            data-testid="missing-task-next-round-button"
            type="button"
            onClick={() => {
              dispatch({ type: 'continue-after-missing-task' });
              navigate('/round');
            }}
          >
            Nächste Runde starten
          </button>
        </div>
      </section>
    </main>
  );
}
