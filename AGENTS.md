# Playwright E2E Agent Guide

Diese Regeln gelten fuer alle Playwright-E2E-Tests in diesem Projekt.

## Selektoren

- Verwende ausschliesslich `page.getByTestId(...)` oder kleine Helfer, die darauf aufbauen.
- Verwende keine Selektoren ueber sichtbaren Text, aria-labels, CSS-Klassen oder DOM-Struktur.
- Wenn ein Element keine stabile `data-testid` hat, ergaenze zuerst die UI.
- Dynamische IDs folgen dem Format `<scope>:<id>`, zum Beispiel `catalog-row:original-catalog`.

## Testaufbau

- Jeder Test muss mit isoliertem Browser-State starten.
- Tests duerfen nicht von der Ausfuehrungsreihenfolge oder Daten aus anderen Tests abhaengen.
- Navigiere ueber echte Routen und Nutzeraktionen, nicht ueber interne React-APIs.
- Downloads, Dialoge und File Uploads werden ueber die Playwright-APIs getestet.

## Struktur

- Schreibe fachliche Abschnitte mit `test.step`.
- Step-Namen beschreiben die Nutzerabsicht, nicht technische Klickdetails.
- Halte Hilfsfunktionen klein und lege wiederverwendbare Test-ID-Funktionen in `tests/e2e/support/` ab.
- Assertions duerfen fachliche Daten pruefen, sollen aber nicht an CSS-Klassen oder sichtbaren Text gekoppelt sein.

## Docker

- Die Standardausfuehrung laeuft ueber `npm run e2e`.
- Die Playwright UI laeuft ueber `npm run e2e:ui` und ist auf Port `9324` erreichbar.
- Die getestete App ist das gebaute Produktions-Artefakt im E2E-Docker-Stack, nicht der Vite Dev Server.
