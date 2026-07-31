# Playwright E2E Agent Guide

Diese Regeln gelten für alle Playwright-E2E-Tests in diesem Projekt.

## Selektoren

- Verwende ausschließlich `page.getByTestId(...)` oder kleine Helfer, die darauf aufbauen.
- Verwende keine Selektoren über sichtbaren Text, aria-labels, CSS-Klassen oder DOM-Struktur.
- Wenn ein Element keine stabile `data-testid` hat, ergänze zuerst die UI.
- Dynamische IDs folgen dem Format `<scope>:<id>`, zum Beispiel `catalog-row:original-catalog`.

## Testaufbau

- Jeder Test muss mit isoliertem Browser-State starten.
- Tests dürfen nicht von der Ausführungsreihenfolge oder Daten aus anderen Tests abhängen.
- Navigiere über echte Routen und Nutzeraktionen, nicht über interne React-APIs.
- Downloads, Dialoge und File Uploads werden über die Playwright-APIs getestet.

## Struktur

- Schreibe fachliche Abschnitte mit `test.step`.
- Step-Namen beschreiben die Nutzerabsicht, nicht technische Klickdetails.
- Halte Hilfsfunktionen klein und lege wiederverwendbare Test-ID-Funktionen in `tests/e2e/support/` ab.
- Assertions dürfen fachliche Daten prüfen, sollen aber nicht an CSS-Klassen oder sichtbaren Text gekoppelt sein.

## Textkodierung

- Deutsche Texte werden als UTF-8 mit Umlauten geschrieben, nicht als `ae`, `oe`, `ue` oder `ss`.
- Prüfe bei Änderungen auf Windows gezielt auf Mojibake wie `Ã`, `Â`, `â€` oder `�`.

## Docker

- Die Standardausführung läuft über `npm run e2e`.
- Die Playwright UI läuft über `npm run e2e:ui` und ist auf Port `9324` erreichbar.
- Die getestete App ist das gebaute Produktions-Artefakt im E2E-Docker-Stack, nicht der Vite Dev Server.
