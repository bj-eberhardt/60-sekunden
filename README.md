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
