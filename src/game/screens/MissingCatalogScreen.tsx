import { AlertTriangle } from 'lucide-react';
import { useRouter } from '../../shared/router';
import { useGame } from '../state/useGame';

export function MissingCatalogScreen() {
  const { clearGameState, state } = useGame();
  const { navigate } = useRouter();

  return (
    <main className="app-shell setup-shell">
      <section
        className="screen-panel missing-catalog-panel"
        aria-labelledby="missing-catalog-title"
        data-testid="missing-catalog-page"
      >
        <div className="missing-catalog-icon-wrap" aria-hidden="true">
          <AlertTriangle className="missing-catalog-icon" />
        </div>

        <p className="eyebrow">Spielstand nicht fortsetzbar</p>
        <h1 id="missing-catalog-title">Katalog fehlt</h1>
        <p className="intro">
          Dieses gespeicherte Spiel verweist auf einen Katalog, der nicht mehr vorhanden ist.
          Deshalb kann die Runde nicht fortgesetzt werden.
        </p>
        {state.missingCatalogId ? (
          <p className="supporting-copy">Fehlender Katalog: {state.missingCatalogId}</p>
        ) : null}

        <div className="action-row missing-catalog-actions">
          <button
            className="primary-action"
            data-testid="missing-catalog-delete-button"
            type="button"
            onClick={() => {
              void clearGameState().finally(() => navigate('/'));
            }}
          >
            Spieldaten löschen
          </button>
        </div>
      </section>
    </main>
  );
}
