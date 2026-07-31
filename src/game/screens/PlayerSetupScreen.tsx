import { FormEvent, useState } from 'react';
import { genderLabels } from '../../shared/labels';
import { useRouter } from '../../shared/router';
import { useGame } from '../state/useGame';
import type { GenderIdentity } from '../types';

const genderOptions: GenderIdentity[] = ['female', 'male', 'not-specified'];

export function PlayerSetupScreen() {
  const { dispatch, persistenceNotice, state } = useGame();
  const { navigate } = useRouter();
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [firstGender, setFirstGender] = useState<GenderIdentity>('not-specified');
  const [secondGender, setSecondGender] = useState<GenderIdentity>('not-specified');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [targetRounds, setTargetRounds] = useState(6);
  const effectiveSelectedCatalogId = selectedCatalogId ?? state.catalog.activeCatalogId;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: 'select-catalog', catalogId: effectiveSelectedCatalogId });
    dispatch({
      type: 'start-game',
      payload: {
        firstName,
        firstGender,
        secondName,
        secondGender,
        gameMode: 'random',
        targetRounds,
      },
    });
    navigate('/round');
  }

  return (
    <main className="app-shell setup-shell" data-testid="new-game-page">
      <section className="screen-panel" aria-labelledby="setup-title">
        <p className="eyebrow">Start</p>
        <h1 id="setup-title">Neues Spiel</h1>
        <p className="intro">
          Richtet beide Personen ein. Namen sind optional und bleiben nur für diese Sitzung im
          Browserzustand.
        </p>
        {persistenceNotice ? (
          <p className="status-note" role="status">
            {persistenceNotice}
          </p>
        ) : null}

        <form className="setup-form" data-testid="new-game-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Person 1</legend>
            <label>
              Name
              <input
                autoComplete="off"
                data-testid="player-one-name-input"
                placeholder="Spieler 1"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>
            <label>
              Geschlecht
              <select
                data-testid="player-one-gender-select"
                value={firstGender}
                onChange={(event) => setFirstGender(event.target.value as GenderIdentity)}
              >
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {genderLabels[gender]}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Person 2</legend>
            <label>
              Name
              <input
                autoComplete="off"
                data-testid="player-two-name-input"
                placeholder="Spieler 2"
                value={secondName}
                onChange={(event) => setSecondName(event.target.value)}
              />
            </label>
            <label>
              Geschlecht
              <select
                data-testid="player-two-gender-select"
                value={secondGender}
                onChange={(event) => setSecondGender(event.target.value as GenderIdentity)}
              >
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {genderLabels[gender]}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="catalog-selection-fieldset">
            <legend>Aufgabenkatalog</legend>
            <label>
              Aufgabenkatalog
              <select
                data-testid="new-game-catalog-select"
                value={effectiveSelectedCatalogId}
                onChange={(event) => setSelectedCatalogId(event.target.value)}
              >
                {state.catalog.catalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>
                    {catalog.name}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="round-count-fieldset">
            <legend>Rundenanzahl</legend>
            <label>
              <span className="range-label-row">
                <span>Wie viele Runden möchtet ihr spielen?</span>
                <strong data-testid="new-game-round-count-value">{targetRounds}</strong>
              </span>
              <input
                data-testid="new-game-round-count-input"
                max="12"
                min="2"
                step="2"
                type="range"
                value={targetRounds}
                onChange={(event) => setTargetRounds(Number(event.target.value))}
              />
            </label>
            <p className="field-help">
              Gerade Rundenanzahlen sorgen dafür, dass beide gleich oft dran sind.
            </p>
          </fieldset>

          <div className="setup-actions">
            <button className="primary-action" data-testid="new-game-submit-button" type="submit">
              Spiel starten
            </button>
            <button
              data-testid="new-game-catalog-button"
              type="button"
              onClick={() => navigate('/catalog')}
            >
              Aufgabenkatalog
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
