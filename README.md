# 60 Sekunden – Skeleton

Schlankes Frontend-Skeleton für das Paarspiel **60 Sekunden**.

## Enthalten

- React mit TypeScript
- Vite
- ESLint Flat Config
- Prettier
- Husky
- lint-staged
- Pre-Commit-Hook für Prettier und ESLint
- eine responsive Home-Seite
- Produkt- und Umsetzungskonzept unter [`docs/KONZEPT.md`](docs/KONZEPT.md)

Nicht enthalten sind Spielmechanik, Routing, Tests, Browser-Datenbank oder Backend-Code.

## Voraussetzungen

- Node.js 26.5.0 oder neuer
- npm 11.17.0 oder neuer
- Git

Mit nvm:

```bash
nvm use
```

## Einrichtung nach dem Entpacken

Da ZIP-Dateien kein Git-Repository enthalten, zuerst Git initialisieren und danach die Pakete
installieren. Beim Installieren aktiviert das `prepare`-Script Husky.

```bash
git init
npm install
npm run dev
```

Die lokale Entwicklungsseite wird anschließend über die von Vite ausgegebene Adresse geöffnet.

## Docker-Entwicklung

Der Entwicklungsserver kann im Docker-Dev-Profil gestartet werden:

```bash
npm run dev:docker
```

Vite läuft im Container auf `0.0.0.0:5174` und ist lokal unter
`http://localhost:5174` erreichbar. Dateiänderungen werden per Polling erkannt, damit Refresh und
Hot Reload auch bei gemounteten Windows-/Sync-Verzeichnissen funktionieren.

Der Container verwendet ein eigenes `node_modules`-Volume. Nach neuen oder geänderten Dependencies
reicht ein Image-Rebuild deshalb nicht immer aus, weil das vorhandene Volume die installierten
Pakete überdeckt.

Wenn der Dev-Container bereits läuft, können fehlende Pakete im Volume nachinstalliert werden:

```bash
npm run dev:docker:install
```

Wenn die Installation sicher frisch aufgebaut werden soll, kann das Docker-Volume verworfen und der
Dev-Container neu gebaut werden:

```bash
npm run dev:docker:fresh
```

Dieser Befehl entfernt das Docker-Dev-Volume inklusive Container-`node_modules` und startet danach
den Dev-Container mit frischem Build erneut.

## E2E-Tests mit Playwright

Die E2E-Tests laufen in einem eigenen Docker-Stack mit separaten Ports. Die App wird dabei als
Produktions-Artefakt gebaut und statisch ausgeliefert; es wird kein Vite-Dev-Server gestartet.

- App: `http://localhost:8088`
- Playwright UI: `http://localhost:9324`

Alle E2E-Tests ausführen:

```bash
npm run e2e
```

Eine einzelne Testdatei oder Playwright-Optionen können nach `--` weitergereicht werden:

```bash
npm run e2e -- tests/e2e/catalog.spec.ts
npm run e2e -- --grep "Originalkatalog"
```

Die Playwright UI wird im Playwright-Container gehostet:

```bash
npm run e2e:ui
npm run e2e:ui -- tests/e2e/catalog.spec.ts
```

Die UI bindet im Container an `0.0.0.0:9324`, damit sie vom Host aus erreichbar ist. In lokalen
Netzwerken kann dieser Port je nach Docker-/Firewall-Konfiguration auch von anderen Maschinen aus
sichtbar sein.

Neue E2E-Tests müssen die Regeln in [`docs/PLAYWRIGHT_E2E_AGENT_GUIDE.md`](AGENTS.md)
einhalten. Insbesondere werden UI-Elemente über `data-testid` angesprochen, nicht über Texte oder
CSS-Klassen.

## Git-Hook

Der Pre-Commit-Hook befindet sich unter `.husky/pre-commit` und startet `lint-staged`.
Für vorgemerkte Dateien gilt:

- TypeScript und JavaScript: Prettier, danach ESLint mit automatischen Korrekturen
- CSS, HTML, JSON, Markdown und YAML: Prettier

Beispiel:

```bash
git add .
git commit -m "Initial commit"
```

## Befehle

```bash
npm run dev          # Entwicklungsserver
npm run dev:docker   # Docker-Entwicklungsserver
npm run dev:docker:install # Dependencies im laufenden Docker-Dev-Container installieren
npm run dev:docker:fresh   # Docker-Dev-Volume löschen und Container frisch starten
npm run e2e          # Playwright-E2E-Tests im Docker-E2E-Stack ausführen
npm run e2e:ui       # Playwright UI im Docker-E2E-Stack starten
npm run build        # TypeScript prüfen und Produktions-Build erzeugen
npm run preview      # Produktions-Build lokal ansehen
npm run typecheck    # TypeScript prüfen
npm run lint         # ESLint ausführen
npm run lint:fix     # ESLint mit automatischen Korrekturen
npm run format       # Projekt mit Prettier formatieren
npm run format:check # Formatierung prüfen
npm run check        # vollständiges lokales Qualitäts-Gate
```

## Paketversionen

Die Versionen wurden am 29. Juli 2026 als exakte Versionen in `package.json` eingetragen. Ein
`package-lock.json` wird beim ersten `npm install` erzeugt.
