import { MessageCircleHeart, Sparkles } from 'lucide-react';
import { RoundProgress } from '../components/RoundProgress';
import { useRouter } from '../../shared/router';
import { useGame } from '../state/useGame';

export function FeedbackScreen() {
  const { clearGameState, state, dispatch } = useGame();
  const { navigate } = useRouter();
  const activePlayer = state.players[state.activePlayerIndex];
  const finalRoundComplete = state.turnNumber >= state.targetRounds;

  return (
    <main className="app-shell feedback-shell" data-testid="feedback-page">
      <section className="screen-panel feedback-panel" aria-labelledby="feedback-title">
        <div className="feedback-icon-wrap" aria-hidden="true">
          <Sparkles className="feedback-sparkle feedback-sparkle-left" />
          <MessageCircleHeart className="feedback-icon" />
          <Sparkles className="feedback-sparkle feedback-sparkle-right" />
        </div>

        <div className="feedback-copy">
          <p className="eyebrow">{activePlayer.name}</p>
          <h1 id="feedback-title">Feedback</h1>
          <p className="intro">Sagt euch, was euch gefallen hat.</p>
          <p className="supporting-copy">
            Was war besonders angenehm? Wovon möchtet ihr mehr oder weniger?
          </p>
        </div>

        <RoundProgress
          completed
          currentRound={state.turnNumber}
          targetRounds={state.targetRounds}
        />

        <div className="action-row feedback-actions">
          <button
            className="primary-action"
            data-testid="feedback-primary-button"
            type="button"
            onClick={() => {
              if (finalRoundComplete) {
                void clearGameState().finally(() => navigate('/'));
                return;
              }

              dispatch({ type: 'continue-after-feedback' });
              navigate('/round');
            }}
          >
            {finalRoundComplete ? 'Spiel abschließen' : 'Nächste Runde starten'}
          </button>
          <button
            data-testid="feedback-secondary-button"
            type="button"
            onClick={() => navigate('/')}
          >
            Zurück zum Start
          </button>
        </div>
      </section>
    </main>
  );
}
