import { useState } from 'react';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import type { AppRoute } from '../../shared/router';
import { useRouter } from '../../shared/router';
import { useGame } from '../state/useGame';
import type { GamePhase } from '../types';
import homeTitleAvif from '../../assets/sixty-seconds-slogan.avif';
import homeTitleWebp from '../../assets/sixty-seconds-slogan.webp';

export function HomeScreen() {
  const { clearGameState, persistenceNotice, persistenceReady, state } = useGame();
  const { navigate } = useRouter();
  const [newGameDialogOpen, setNewGameDialogOpen] = useState(false);
  const hasSavedGame = persistenceReady && state.phase !== 'player-setup';
  const [firstPlayer, secondPlayer] = state.players;
  const openRounds = Math.max(state.targetRounds - state.turnNumber + 1, 0);

  return (
    <main className="app-shell setup-shell home-shell" data-testid="home-page">
      <section className="screen-panel" aria-labelledby="home-title">
        <p className="eyebrow">Start</p>
        <h1 className="home-title" id="home-title">
          <picture>
            <source srcSet={homeTitleAvif} type="image/avif" />
            <img className="home-title-image" src={homeTitleWebp} alt="60 Sekunden" />
          </picture>
        </h1>
        {persistenceNotice ? (
          <p className="status-note" role="status">
            {persistenceNotice}
          </p>
        ) : null}

        {hasSavedGame ? (
          <div className="continue-panel home-continue-panel" data-testid="home-continue-panel">
            <p>
              Das Spiel zwischen <strong>{firstPlayer.name}</strong> und{' '}
              <strong>{secondPlayer.name}</strong> hat noch{' '}
              <strong>
                {openRounds} {openRounds === 1 ? 'Runde' : 'Runden'}
              </strong>{' '}
              offen.
              <span className="home-continue-question">Wollt ihr das Spiel fortsetzen?</span>
            </p>
            <button
              className="primary-action"
              data-testid="home-continue-button"
              type="button"
              onClick={() => navigate(getRouteForPhase(state.phase))}
            >
              Spiel fortsetzen
            </button>
          </div>
        ) : (
          <p className="intro">Startet ein neues Spiel und richtet beide Personen ein.</p>
        )}

        <div className="action-stack">
          <button
            className="primary-action"
            data-testid="home-new-game-button"
            type="button"
            onClick={() => {
              if (hasSavedGame) {
                setNewGameDialogOpen(true);
                return;
              }

              navigate('/new');
            }}
          >
            Neues Spiel starten
          </button>
          <button className="primary-action" type="button" onClick={() => navigate('/catalog')}>
            Aufgabenkatalog
          </button>
        </div>
      </section>
      <ConfirmDialog
        confirmLabel="Neues Spiel starten"
        description="Damit wird das aktuelle Spiel beendet. Kataloge, eigene Aufgaben und Original-Overrides bleiben erhalten."
        open={newGameDialogOpen}
        title="Aktuelles Spiel beenden?"
        tone="danger"
        onCancel={() => setNewGameDialogOpen(false)}
        onConfirm={() => {
          setNewGameDialogOpen(false);
          void clearGameState().finally(() => navigate('/new'));
        }}
      />
    </main>
  );
}

function getRouteForPhase(phase: GamePhase): AppRoute {
  switch (phase) {
    case 'task-selection':
      return '/round';
    case 'task-details':
      return '/task';
    case 'countdown':
      return '/timer';
    case 'feedback':
      return '/feedback';
    case 'player-setup':
      return '/new';
  }
}
