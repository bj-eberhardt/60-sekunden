# Produkt- und Umsetzungskonzept: „60 Sekunden“

## 1. Vision

„60 Sekunden“ ist ein unkompliziertes Mini-Spiel für zwei volljährige Personen, die gemeinsam
vor einem Smartphone, Tablet oder Computer sitzen. In jedem Zug erhält die aktive Person drei
Aufgaben zur Auswahl. Jede Aufgabe gehört zu einer anderen Stimmung: **Nähe**, **Flirt** oder
**Intim**. Nach der Auswahl läuft ein Timer für 60 Sekunden. Danach lädt ein kurzer
Feedback-Bildschirm zum persönlichen Gespräch ein, ohne Antworten digital abzufragen oder zu
speichern.

Das Produkt soll Nähe, spielerische Kommunikation und gemeinsames Entdecken unterstützen. Es
gibt keine Punkte, keine Gewinner und keine Bewertung durch die App.

## 2. Kernprinzipien

- Nutzung durch zwei Erwachsene an einem gemeinsamen Gerät
- einfache und schnell verständliche Spielzüge
- drei unterschiedliche Aufgaben pro Zug
- jederzeitiges Passen ohne Begründung
- keine digitale Zustimmungs- oder Bewertungsschleife
- keine Spielhistorie und keine Speicherung intimer Antworten
- vollständige lokale Kontrolle über den Aufgabenkatalog
- kein Backend, keine Benutzerkonten und keine Cloud-Synchronisation

## 3. Spielbeginn

Das Spiel beginnt mit der Einrichtung der beiden Personen. Für jede Person werden abgefragt:

- optionaler Name
- Geschlecht

Bleibt ein Namensfeld leer, verwendet die App automatisch **Spieler 1** beziehungsweise
**Spieler 2**.

Für das Geschlecht sind mindestens folgende Optionen vorgesehen:

- weiblich
- männlich
- nicht-binär / divers
- selbst beschreiben
- keine Angabe

Die Geschlechtsangabe kann für passende und respektvolle Formulierungen verwendet werden. Die
App darf daraus jedoch keine Körpermerkmale, sexuellen Rollen oder Vorlieben ableiten.

## 4. Spielablauf

1. Die App zeigt an, welche Person an der Reihe ist.
2. Es werden genau drei Aufgaben angeboten.
3. Jede Aufgabe stammt aus einer anderen Stimmung: Nähe, Flirt und Intim.
4. Wenn möglich, stammen die drei Aufgaben zusätzlich aus unterschiedlichen Kategorien.
5. Die aktive Person wählt eine Aufgabe, lässt drei neue Aufgaben ziehen oder passt.
6. Nach der Auswahl öffnet sich die Aufgabe in einer Detailansicht.
7. Mit „60 Sekunden starten“ beginnt der Timer.
8. Nach Ablauf oder vorzeitigem Beenden erscheint der Feedback-Bildschirm.
9. Über „Weiter“ wechselt die aktive Person.

## 5. Aufgabenwahl

### 5.1 Drei Stimmungen

Jeder Zug enthält eine Aufgabe aus jeder Stimmung:

- **Nähe:** romantisch, emotional und verbindend
- **Flirt:** verspielt und sinnlich
- **Intim:** leidenschaftlich und sexuell

Eine Stimmung wird nicht vor Spielbeginn gewählt. Das Paar entscheidet in jedem Zug anhand der
drei konkreten Vorschläge neu.

### 5.2 Kategorien

Mögliche Aufgabenkategorien:

- Küssen
- Massage
- Komplimente
- Berührung
- Blickkontakt
- Gespräch
- Wünsche und Fantasien
- Rollenspiel
- eigene Kategorie

Stimmung und Kategorie sind voneinander getrennte Merkmale. Beispielsweise kann eine Aufgabe
die Stimmung „Flirt“ und die Kategorie „Massage“ besitzen.

### 5.3 Auswahlregeln

Der Auswahlalgorithmus soll:

- genau eine aktivierte Aufgabe pro Stimmung liefern,
- möglichst drei unterschiedliche Kategorien verwenden,
- deaktivierte Aufgaben ausschließen,
- lokale Bearbeitungen des Originalkatalogs berücksichtigen,
- eigene Aufgaben berücksichtigen,
- ungeeignete Aufgaben anhand ihrer optionalen Eignungsregeln ausschließen,
- direkte und kurzfristige Wiederholungen vermeiden,
- bei einem erschöpften Katalog kontrolliert ältere Aufgaben wieder zulassen.

Eine Aufgabe gilt als kürzlich angeboten, sobald sie auf dem Auswahlbildschirm sichtbar war.

## 6. Auswahlaktionen

### Aufgabe auswählen

Eine ausgewählte Aufgabe öffnet eine Detailansicht mit:

- Stimmung
- Kategorie
- Titel
- vollständigem Aufgabentext
- optionalen Hinweisen
- Button „60 Sekunden starten“
- Button „Zurück zur Auswahl“

Es ist keine zusätzliche Bestätigung durch beide Personen vorgesehen, da beide gemeinsam vor
dem Gerät sitzen und die Entscheidung miteinander treffen.

### Drei neue Aufgaben

Die aktive Person bleibt an der Reihe und erhält drei neue Vorschläge.

### Passen

Beim Passen:

- startet kein Timer,
- erscheint keine Rückfrage,
- wird kein negativer Status gespeichert,
- wechselt sofort die aktive Person,
- werden drei neue Aufgaben erzeugt.

## 7. Timer

Der Timer läuft standardmäßig 60 Sekunden. Der Bildschirm zeigt:

- aktive Person
- Aufgabentitel
- kurze Aufgabenbeschreibung
- verbleibende Zeit
- visuellen Fortschritt
- Pause
- Runde beenden

Der Timer soll anhand eines Endzeitpunkts berechnet werden, statt lediglich jede Sekunde einen
Zähler zu reduzieren. Dadurch bleibt er auch nach einer Browser-Drosselung oder einem kurzen
Wechsel in den Hintergrund konsistent.

Nach Ablauf kann optional ein dezenter lokaler Ton abgespielt werden. Die App muss ohne Ton
vollständig nutzbar sein.

## 8. Feedback-Bildschirm

Nach dem Timer erscheint ausschließlich ein Gesprächsimpuls:

> **Feedback**  
> Sagt euch, was euch gefallen hat.

Optional kann ein unterstützender Text angezeigt werden:

> Was war besonders angenehm? Wovon möchtet ihr mehr oder weniger?

Es gibt keine Eingabefelder, Auswahloptionen, Sterne oder gespeicherten Bewertungen. Der Button
„Weiter“ wechselt zur anderen Person.

## 9. Eigene Aufgaben

Die Personen können eigene Aufgaben erstellen. Eine Aufgabe enthält mindestens:

- stabile ID
- Titel
- Aufgabentext
- Stimmung
- Kategorie
- aktiviert oder deaktiviert
- Erstellungs- und Änderungszeitpunkt

Optional sind möglich:

- Hinweise
- alternative Formulierung
- Eignungsregeln
- Schlagwörter
- eigene Dauer für eine spätere Erweiterung

Eigene Aufgaben werden zusammen mit dem Originalkatalog verwendet.

## 10. Eigene Runden

Eine eigene Runde besteht aus drei festgelegten Optionen:

- einer Nähe-Aufgabe
- einer Flirt-Aufgabe
- einer intimen Aufgabe

Eigene Runden können erstellt, bearbeitet, dupliziert, deaktiviert, gelöscht, exportiert und
importiert werden. Später kann gewählt werden, ob zufällige Aufgaben, eigene Runden oder eine
Mischung verwendet werden.

## 11. Bearbeitbarer Originalkatalog

Originalaufgaben können:

- bearbeitet,
- deaktiviert,
- dupliziert,
- auf den Originalzustand zurückgesetzt werden.

Originalaufgaben werden nicht physisch aus dem mitgelieferten Katalog gelöscht. Lokale
Änderungen werden als Overrides gespeichert. Beim Laden entsteht die verwendete Aufgabe aus
dem Original und dem optionalen Override.

```ts
interface BuiltInTask {
  id: string;
  version: number;
  title: string;
  text: string;
  mood: Mood;
  category: TaskCategory;
  eligibility?: TaskEligibility;
}

interface TaskOverride {
  taskId: string;
  enabled?: boolean;
  title?: string;
  text?: string;
  mood?: Mood;
  category?: TaskCategory;
  eligibility?: TaskEligibility;
  updatedAt: string;
}
```

Dieses Modell ermöglicht App-Updates, ohne lokale Anpassungen zu überschreiben.

## 12. Lokale Browser-Datenbank

Für eigene Aufgaben, eigene Runden, Overrides und Katalogeinstellungen ist **IndexedDB**
vorgesehen. Dies ist eine lokale Browser-Datenbank und benötigt keinen Backend-Layer.

Vorgesehene Stores:

- `settings`
- `taskOverrides`
- `customTasks`
- `customRounds`
- `catalogMetadata`

Nicht dauerhaft gespeichert werden standardmäßig:

- Spielernamen
- Geschlechtsangaben
- gespielte Aufgaben
- Pässe
- Sitzungsverläufe
- persönliche Gesprächsinhalte

Die React-Komponenten greifen nicht direkt auf IndexedDB zu. Eine lokale Repository-Abstraktion
kapselt Speicherung, Abfragen, Migrationen sowie Import und Export.

## 13. Import und Export

Lokale Katalogdaten können als versionierte JSON-Datei exportiert werden. Der Export enthält:

- eigene Aufgaben
- eigene Runden
- bearbeitete Originalaufgaben
- deaktivierte Originalaufgaben
- nicht persönliche Katalogeinstellungen
- Format- und Schema-Version

Nicht exportiert werden Spielernamen, Geschlechtsangaben oder Sitzungsdaten.

Beispiel:

```json
{
  "format": "sixty-seconds-catalog",
  "schemaVersion": 1,
  "exportedAt": "2026-07-29T00:00:00.000Z",
  "taskOverrides": [],
  "customTasks": [],
  "customRounds": [],
  "settings": {
    "includeBuiltInTasks": true
  }
}
```

Beim Import werden zunächst Format, Schema-Version, erforderliche Felder, IDs, Textlängen,
Kategorien, Stimmungen und Referenzen validiert. Erst nach vollständiger Validierung darf eine
Transaktion die Browser-Datenbank verändern.

Vorgesehene Importarten:

- **Ergänzen:** nur neue Inhalte hinzufügen
- **Zusammenführen:** Einträge mit derselben ID aktualisieren
- **Ersetzen:** lokale Katalogdaten nach deutlicher Bestätigung vollständig ersetzen

## 14. Vorgesehenes Domänenmodell

```ts
type Mood = 'closeness' | 'flirty' | 'intimate';

type GenderIdentity =
  | 'female'
  | 'male'
  | 'non-binary'
  | 'custom'
  | 'not-specified';

type TaskCategory =
  | 'kissing'
  | 'massage'
  | 'compliments'
  | 'touch'
  | 'eye-contact'
  | 'conversation'
  | 'fantasy'
  | 'roleplay'
  | 'custom';

interface Player {
  id: string;
  name: string;
  gender: GenderIdentity;
  customGender?: string;
}

interface GameTask {
  id: string;
  title: string;
  text: string;
  mood: Mood;
  category: TaskCategory;
  enabled: boolean;
  eligibility?: TaskEligibility;
}
```

Die Eignungsregeln bleiben optional. Fehlen sie, ist eine Aufgabe grundsätzlich für alle
Spielerkonstellationen verfügbar.

## 15. Vorgesehene Spielzustände

```ts
type GamePhase =
  | 'player-setup'
  | 'turn-introduction'
  | 'task-selection'
  | 'task-details'
  | 'countdown'
  | 'feedback'
  | 'session-end';

interface GameSession {
  phase: GamePhase;
  players: [Player, Player];
  activePlayerIndex: 0 | 1;
  turnNumber: number;
  offeredTasks: [GameTask, GameTask, GameTask] | null;
  selectedTask: GameTask | null;
  recentlyOfferedTaskIds: string[];
  timer: TimerState;
}
```

Wichtige Aktionen:

- Spiel starten
- Aufgaben erzeugen
- Aufgabe auswählen
- Aufgaben neu ziehen
- passen
- Timer starten
- pausieren
- fortsetzen
- frühzeitig beenden
- Timer abschließen
- Feedback-Screen verlassen
- Sitzung beenden
- Spiel zurücksetzen

## 16. Vorgesehene Frontend-Architektur

Das MVP bleibt eine reine React-Anwendung. Für den zentralen Spielzustand sind `useReducer` und
ein Context ausreichend. Ein globales State-Framework ist nicht notwendig.

Vorgesehene Bereiche:

```text
src/
├── app/
├── game/
│   ├── components/
│   ├── screens/
│   ├── state/
│   └── services/
├── catalog/
│   ├── components/
│   ├── screens/
│   ├── repository/
│   └── services/
├── content/
├── database/
└── shared/
```

Das aktuelle Skeleton implementiert diese Struktur bewusst noch nicht. Es enthält nur die
technische Projektbasis und eine Home-Seite.

## 17. Aufgabenverwaltung

Der spätere Verwaltungsbereich umfasst:

- alle Aufgaben
- eigene Aufgaben
- eigene Runden
- Import und Export

Filtermöglichkeiten:

- Stimmung
- Kategorie
- aktiviert oder deaktiviert
- Original oder selbst erstellt
- bearbeitet oder unverändert

Originalaufgaben können deaktiviert, bearbeitet, dupliziert oder zurückgesetzt werden. Eigene
Aufgaben können zusätzlich gelöscht werden.

## 18. Datenschutz und Sicherheit

- keine Benutzerkonten
- kein Backend
- keine Cloud-Datenbank
- keine Analytics im MVP
- keine Werbenetzwerke
- keine externen Schriftarten erforderlich
- keine Speicherung von intimen Antworten
- keine Speicherung einer Spielhistorie
- Export enthält keine persönlichen Sitzungsdaten

Alle Aufgaben richten sich ausschließlich an Erwachsene. Passen, Pause und vorzeitiges Beenden
müssen jederzeit leicht erreichbar sein.

## 19. Barrierefreiheit und Gestaltung

Die Anwendung wird mobile-first und diskret gestaltet. Wichtig sind:

- große Touchflächen
- klare Typografie
- sichtbare Fokuszustände
- semantisches HTML
- vollständige Tastaturbedienung
- ausreichende Kontraste
- Unterstützung für `prefers-reduced-motion`
- Informationen nicht nur über Farbe
- Timer auch textuell verständlich
- keine expliziten Bilder erforderlich

## 20. MVP-Umfang

Die erste vollständige Spielversion soll später enthalten:

- Eingabe beider Namen mit Fallbacks
- Geschlechtsauswahl inklusive „Keine Angabe“
- abwechselnde Züge
- genau drei Aufgaben pro Zug
- eine Aufgabe pro Stimmung
- möglichst unterschiedliche Kategorien
- Neuziehen und Passen
- 60-Sekunden-Timer
- Pause und vorzeitiges Beenden
- Feedback-Screen ohne Dateneingabe
- integrierter und bearbeitbarer Originalkatalog
- eigene Aufgaben und eigene Runden
- IndexedDB-Speicherung
- validierten JSON-Import und -Export
- keine Spielhistorie
- kein Backend

## 21. Empfohlene Umsetzungsphasen

1. Domänentypen und Zustandsübergänge definieren.
2. Originalkatalog und Auswahlalgorithmus umsetzen.
3. Spielereinrichtung, Aufgabenwahl, Timer und Feedback-Screen entwickeln.
4. IndexedDB-Schema und Repository-Schicht implementieren.
5. Aufgaben- und Rundenverwaltung ergänzen.
6. Import, Export und Datenmigrationen umsetzen.
7. Barrierefreiheit, Tests und mobile UX finalisieren.

## 22. Definition of Done für das Skeleton

Das vorliegende Skeleton ist abgeschlossen, wenn:

- das Projekt mit React, TypeScript und Vite strukturiert ist,
- nur eine Home-Seite implementiert ist,
- ESLint und Prettier konfiguriert sind,
- der Pre-Commit-Hook vorgemerkte Dateien formatiert und lintet,
- Node- und npm-Versionen dokumentiert sind,
- das vollständige Produktkonzept als Markdown enthalten ist,
- keinerlei Spielmechanik, Datenbank oder Backend-Code vorweggenommen wird.
