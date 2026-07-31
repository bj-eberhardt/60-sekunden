import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CircleCheck, CircleOff, Copy, Download, Pencil, Trash2 } from 'lucide-react';
import { builtInTasks } from '../../content/builtInTasks';
import { Block } from '../../shared/Block';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { genderLabels, moodLabels } from '../../shared/labels';
import { ListViewItem } from '../../shared/ListViewItem';
import { getCatalogTasks } from '../repository/memoryCatalogRepository';
import { createCatalogExport, parseCatalogExport } from '../services/catalogExport';
import { importCatalogAsCopy } from '../services/catalogImport';
import { createCatalogId } from '../services/catalogIds';
import { useRouter } from '../../shared/router';
import type { BuiltInTask, CustomTask, TaskCatalog } from '../types';
import { originalCatalogId } from '../types';
import type { CustomTaskInput } from '../services/customTasks';
import type { GameTask, GenderIdentity, Mood, TaskEligibility } from '../../game/types';
import { useGame } from '../../game/state/useGame';

const moodOptions: Mood[] = ['closeness', 'flirty', 'intimate'];
const genderOptions: GenderIdentity[] = ['female', 'male', 'not-specified'];

const emptyTaskForm: CustomTaskInput = {
  title: '',
  text: '',
  mood: 'closeness',
  enabled: true,
};

type EditingTask =
  | { source: 'custom'; task: CustomTask }
  | { source: 'built-in'; task: GameTask; original: BuiltInTask };

type PendingDelete =
  { type: 'built-in-task'; task: GameTask } | { type: 'custom-task'; task: CustomTask };

export function CatalogManagementScreen() {
  const { state, dispatch } = useGame();
  const { navigate, route } = useRouter();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const taskFormRef = useRef<HTMLFormElement | null>(null);
  const taskReturnTargetRef = useRef<string | null>(null);
  const [renameDraft, setRenameDraft] = useState({ catalogId: null as string | null, value: '' });
  const [taskForm, setTaskForm] = useState<CustomTaskInput>(emptyTaskForm);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [hasPendingCatalogEdits, setHasPendingCatalogEdits] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [catalogIdToDelete, setCatalogIdToDelete] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const routeCatalogId = getCatalogIdFromRoute(route);
  const activeCatalog =
    routeCatalogId === null
      ? null
      : (state.catalog.catalogs.find((catalog) => catalog.id === routeCatalogId) ?? null);
  const catalogToDelete =
    state.catalog.catalogs.find((catalog) => catalog.id === catalogIdToDelete) ?? null;
  const renameValue =
    activeCatalog && renameDraft.catalogId === activeCatalog.id
      ? renameDraft.value
      : (activeCatalog?.name ?? '');
  const hasCatalogChanges =
    hasPendingCatalogEdits || (!!activeCatalog && renameValue.trim() !== activeCatalog.name);
  const isTaskEditScreen = taskFormOpen;
  const catalogTasks = useMemo(
    () => (activeCatalog ? getCatalogTasks(activeCatalog) : []),
    [activeCatalog],
  );
  const builtInRows = useMemo(
    () =>
      activeCatalog?.kind === 'original'
        ? builtInTasks.map((original) => ({
            original,
            task: catalogTasks.find((task) => task.id === original.id),
          }))
        : [],
    [activeCatalog, catalogTasks],
  );
  function setRenameValue(value: string) {
    if (activeCatalog) {
      setRenameDraft({ catalogId: activeCatalog.id, value });
    } else {
      setRenameDraft({ catalogId: null, value });
    }
  }

  function createCatalog() {
    const id = createCatalogId();

    dispatch({
      type: 'create-catalog',
      id,
      name: 'Neuer Aufgabenkatalog',
      now: new Date().toISOString(),
    });
    resetForms();
    setRenameValue('');
    navigate(`/catalog/${id}`);
  }

  function copyCatalog(sourceCatalogId: string) {
    const id = createCatalogId();

    dispatch({
      type: 'copy-catalog',
      sourceCatalogId,
      id,
      now: new Date().toISOString(),
    });
    resetForms();
    setRenameValue('');
    navigate(`/catalog/${id}`);
  }

  function saveCatalogDetails() {
    if (!activeCatalog || !renameValue.trim()) {
      return;
    }

    if (renameValue.trim() !== activeCatalog.name) {
      dispatch({
        type: 'rename-catalog',
        catalogId: activeCatalog.id,
        name: renameValue,
        now: new Date().toISOString(),
      });
    }

    setHasPendingCatalogEdits(false);
    navigate('/catalog');
  }

  function exportCatalog(catalog: TaskCatalog) {
    const exportData = createCatalogExport(catalog, new Date().toISOString());
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${slugifyFileName(catalog.name)}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importCatalogs(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setImportError(null);

    if (!file) {
      return;
    }

    try {
      const id = createCatalogId();
      const now = new Date().toISOString();

      dispatch({
        type: 'replace-catalog-snapshot',
        catalog: importCatalogAsCopy(state.catalog, parseCatalogExport(await file.text()), id, now),
      });
      setImportError(null);
      resetForms();
      setRenameValue('');
      navigate(`/catalog/${id}`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import fehlgeschlagen.');
    }
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCatalog || !taskForm.title.trim() || !taskForm.text.trim()) {
      return;
    }

    const now = new Date().toISOString();

    if (editingTask?.source === 'custom') {
      dispatch({
        type: 'update-custom-task',
        catalogId: activeCatalog.id,
        taskId: editingTask.task.id,
        payload: taskForm,
        now,
      });
    } else if (editingTask?.source === 'built-in') {
      dispatch({
        type: 'save-task-override',
        catalogId: activeCatalog.id,
        payload: {
          taskId: editingTask.task.id,
          enabled: taskForm.enabled,
          title: taskForm.title,
          text: taskForm.text,
          mood: taskForm.mood,
          eligibility: normalizeTaskEligibility(taskForm.eligibility),
          updatedAt: now,
        },
      });
    } else {
      dispatch({
        type: 'add-custom-task',
        catalogId: activeCatalog.id,
        id: createCatalogId(),
        payload: taskForm,
        now,
      });
    }

    setHasPendingCatalogEdits(true);
    resetTaskForm();
  }

  function startCustomEditing(task: CustomTask) {
    taskReturnTargetRef.current = getTaskListItemId(task.id);
    setEditingTask({ source: 'custom', task });
    setTaskFormOpen(true);
    setTaskForm({
      title: task.title,
      text: task.text,
      mood: task.mood,
      enabled: task.enabled,
      eligibility: task.eligibility,
    });
    scrollTaskFormIntoView();
  }

  function startBuiltInEditing(task: GameTask, original: BuiltInTask) {
    taskReturnTargetRef.current = getTaskListItemId(task.id);
    setEditingTask({ source: 'built-in', task, original });
    setTaskFormOpen(true);
    setTaskForm({
      title: task.title,
      text: task.text,
      mood: task.mood,
      enabled: task.enabled,
      eligibility: task.eligibility,
    });
    scrollTaskFormIntoView();
  }

  function startTaskCreation() {
    taskReturnTargetRef.current = null;
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setTaskFormOpen(true);
  }

  function toggleBuiltInTask(taskId: string) {
    if (!activeCatalog) {
      return;
    }

    dispatch({
      type: 'toggle-built-in-task',
      catalogId: activeCatalog.id,
      taskId,
      now: new Date().toISOString(),
    });
    setHasPendingCatalogEdits(true);
  }

  function toggleCustomTask(taskId: string) {
    if (!activeCatalog) {
      return;
    }

    dispatch({
      type: 'toggle-custom-task',
      catalogId: activeCatalog.id,
      taskId,
      now: new Date().toISOString(),
    });
    setHasPendingCatalogEdits(true);
  }

  function scrollTaskFormIntoView() {
    window.setTimeout(() => {
      taskFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function scrollElementIntoView(elementId: string | null) {
    if (!elementId) {
      return;
    }

    window.setTimeout(() => {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  function confirmPendingDelete() {
    if (!activeCatalog || !pendingDelete) {
      return;
    }

    const now = new Date().toISOString();

    if (pendingDelete.type === 'built-in-task') {
      dispatch({
        type: 'save-task-override',
        catalogId: activeCatalog.id,
        payload: {
          taskId: pendingDelete.task.id,
          enabled: false,
          title: pendingDelete.task.title,
          text: pendingDelete.task.text,
          mood: pendingDelete.task.mood,
          eligibility: pendingDelete.task.eligibility,
          updatedAt: now,
        },
      });
    }

    if (pendingDelete.type === 'custom-task') {
      dispatch({
        type: 'delete-custom-task',
        catalogId: activeCatalog.id,
        taskId: pendingDelete.task.id,
        now,
      });
      setHasPendingCatalogEdits(true);
    }

    setPendingDelete(null);
  }

  function resetTaskForm() {
    const returnTargetId = editingTask ? taskReturnTargetRef.current : null;
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setTaskFormOpen(false);
    taskReturnTargetRef.current = null;
    scrollElementIntoView(returnTargetId);
  }

  function resetForms() {
    resetTaskForm();
    setHasPendingCatalogEdits(false);
  }

  if (routeCatalogId === null) {
    return (
      <main className="app-shell catalog-index-shell" data-testid="catalog-index-page">
        <CatalogBackButton
          label="Zurueck zum Start"
          testId="catalog-back-to-home"
          onClick={() => navigate('/')}
        />

        <section className="screen-header" aria-labelledby="catalog-title">
          <p className="eyebrow">Aufgabenkatalog</p>
          <h1 id="catalog-title">Aufgabenkataloge</h1>
          <p className="intro">
            Verwalte Aufgabenkataloge, erstelle Kopien oder öffne einen Aufgabenkatalog zum
            Bearbeiten.
          </p>
        </section>

        <section className="screen-panel catalog-form" aria-label="Aufgabenkataloge verwalten">
          <button
            className="primary-action"
            data-testid="catalog-create-button"
            type="button"
            onClick={createCatalog}
          >
            Neuen Aufgabenkatalog anlegen
          </button>

          <button
            data-testid="catalog-import-button"
            type="button"
            onClick={() => importInputRef.current?.click()}
          >
            Importieren
          </button>
          <input
            ref={importInputRef}
            className="visually-hidden"
            data-testid="catalog-import-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importCatalogs(event)}
          />
          {importError ? (
            <p className="form-error" data-testid="catalog-import-error" role="alert">
              {importError}
            </p>
          ) : null}

          <div
            className="catalog-list"
            data-testid="catalog-list"
            role="list"
            aria-label="Alle Aufgabenkataloge"
          >
            {state.catalog.catalogs.map((catalog) => (
              <ListViewItem
                actions={
                  <>
                    <button
                      className="icon-button edit-action"
                      data-testid={`catalog-row-edit:${catalog.id}`}
                      type="button"
                      aria-label={`${catalog.name} bearbeiten`}
                      title="Bearbeiten"
                      onClick={() => navigate(`/catalog/${catalog.id}`)}
                    >
                      <Pencil aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      data-testid={`catalog-row-copy:${catalog.id}`}
                      type="button"
                      aria-label={`${catalog.name} kopieren`}
                      title="Kopieren"
                      onClick={() => copyCatalog(catalog.id)}
                    >
                      <Copy aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      data-testid={`catalog-row-export:${catalog.id}`}
                      type="button"
                      aria-label={`${catalog.name} exportieren`}
                      title="Exportieren"
                      onClick={() => exportCatalog(catalog)}
                    >
                      <Download aria-hidden="true" />
                    </button>
                    {catalog.id !== originalCatalogId ? (
                      <button
                        className="icon-button danger-action delete-action"
                        data-testid={`catalog-row-delete:${catalog.id}`}
                        type="button"
                        aria-label={`${catalog.name} löschen`}
                        title="Löschen"
                        onClick={() => setCatalogIdToDelete(catalog.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    ) : null}
                  </>
                }
                contentTestId={`catalog-row-open:${catalog.id}`}
                key={catalog.id}
                subtitle={catalog.kind === 'original' ? 'Original' : catalog.id}
                testId={`catalog-row:${catalog.id}`}
                title={catalog.name}
                onSelect={() => navigate(`/catalog/${catalog.id}`)}
              />
            ))}
          </div>
        </section>

        <CatalogDialogs
          catalogToDelete={catalogToDelete}
          pendingDelete={pendingDelete}
          onCancelCatalogDelete={() => setCatalogIdToDelete(null)}
          onCancelPendingDelete={() => setPendingDelete(null)}
          onConfirmCatalogDelete={() => {
            if (catalogToDelete) {
              dispatch({ type: 'delete-catalog', catalogId: catalogToDelete.id });
            }

            setCatalogIdToDelete(null);
          }}
          onConfirmPendingDelete={confirmPendingDelete}
        />
      </main>
    );
  }

  if (!activeCatalog) {
    return (
      <main className="app-shell setup-shell" data-testid="catalog-not-found-page">
        <section className="screen-panel">
          <p className="eyebrow">Aufgabenkatalog</p>
          <h1>Aufgabenkatalog nicht gefunden</h1>
          <div className="action-stack">
            <button
              className="primary-action"
              data-testid="catalog-not-found-back-button"
              type="button"
              onClick={() => navigate('/catalog')}
            >
              Zur Übersicht
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell catalog-detail-shell" data-testid="catalog-detail-page">
      {!isTaskEditScreen ? (
        <CatalogBackButton
          label="Zurueck zur Uebersicht"
          testId="catalog-back-to-index"
          onClick={() => navigate('/catalog')}
        />
      ) : null}

      <section className="screen-header" aria-labelledby="catalog-title">
        <p className="eyebrow">Aufgabenkatalog</p>
        <h1 id="catalog-title">{activeCatalog.name}</h1>
        {!isTaskEditScreen ? (
          <p className="intro">Bearbeite Aufgaben oder ändere den Namen des Aufgabenkatalogs.</p>
        ) : null}
      </section>

      <section className="management-layout catalog-edit-layout">
        <section className="catalog-detail" aria-labelledby="catalog-title">
          {!isTaskEditScreen ? (
            <>
              <Block title="Einstellungen">
                <label>
                  Aufgabenkatalogname
                  <input
                    data-testid="catalog-name-input"
                    maxLength={80}
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                  />
                </label>
              </Block>
            </>
          ) : null}

          {taskFormOpen ? (
            <form
              ref={taskFormRef}
              className="screen-panel catalog-form"
              data-testid="catalog-task-form"
              onSubmit={handleTaskSubmit}
            >
              <h2>{editingTask ? 'Aufgabe bearbeiten' : 'Aufgabe hinzufügen'}</h2>
              <label>
                Titel
                <input
                  data-testid="task-title-input"
                  required
                  maxLength={80}
                  value={taskForm.title}
                  onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                />
              </label>
              <label>
                Aufgabentext
                <textarea
                  data-testid="task-text-input"
                  required
                  maxLength={420}
                  rows={5}
                  value={taskForm.text}
                  onChange={(event) => setTaskForm({ ...taskForm, text: event.target.value })}
                />
              </label>
              <label>
                Stimmung
                <select
                  data-testid="task-mood-select"
                  value={taskForm.mood}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, mood: event.target.value as Mood })
                  }
                >
                  {moodOptions.map((mood) => (
                    <option key={mood} value={mood}>
                      {moodLabels[mood]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  checked={taskForm.enabled}
                  data-testid="task-enabled-checkbox"
                  type="checkbox"
                  onChange={(event) => setTaskForm({ ...taskForm, enabled: event.target.checked })}
                />
                Aktiviert
              </label>
              <details className="eligibility-editor" data-testid="task-eligibility-details">
                <summary>Eignung einschraenken</summary>
                <p className="field-help">
                  Ohne Auswahl ist die Aufgabe fuer alle Paarungen geeignet.
                </p>
                <div className="pairing-grid">
                  {genderOptions.flatMap((firstGender) =>
                    genderOptions.map((secondGender) => {
                      const checked = hasPairing(taskForm.eligibility, firstGender, secondGender);

                      return (
                        <label key={`${firstGender}-${secondGender}`} className="checkbox-label">
                          <input
                            checked={checked}
                            data-testid={`task-eligibility-pairing:${firstGender}:${secondGender}`}
                            type="checkbox"
                            onChange={(event) =>
                              setTaskForm({
                                ...taskForm,
                                eligibility: updatePairing(
                                  taskForm.eligibility,
                                  firstGender,
                                  secondGender,
                                  event.target.checked,
                                ),
                              })
                            }
                          />
                          {genderLabels[firstGender]} / {genderLabels[secondGender]}
                        </label>
                      );
                    }),
                  )}
                </div>
              </details>
              <div className="action-row">
                <button className="primary-action" data-testid="task-submit-button" type="submit">
                  {editingTask ? 'Speichern' : 'Hinzufügen'}
                </button>
                <button data-testid="task-cancel-button" type="button" onClick={resetTaskForm}>
                  Abbrechen
                </button>
              </div>
            </form>
          ) : null}

          {!isTaskEditScreen ? (
            <>
              <Block
                actions={
                  <button
                    className="primary-action"
                    data-testid="task-create-button"
                    type="button"
                    onClick={startTaskCreation}
                  >
                    Aufgabe hinzufuegen
                  </button>
                }
                ariaLabel="Aufgaben im ausgewaehlten Katalog"
                title="Aufgaben"
              >
                <div className="custom-task-list" role="list">
                  {activeCatalog.kind === 'original'
                    ? builtInRows.map(({ original, task }) =>
                        task ? (
                          <CatalogTaskItem
                            key={original.id}
                            task={task}
                            onEdit={() => startBuiltInEditing(task, original)}
                            onToggle={() => toggleBuiltInTask(task.id)}
                          />
                        ) : null,
                      )
                    : null}

                  {activeCatalog.customTasks.map((task) => (
                    <CatalogTaskItem
                      key={task.id}
                      task={task}
                      onDelete={() => setPendingDelete({ type: 'custom-task', task })}
                      onEdit={() => startCustomEditing(task)}
                      onToggle={() => toggleCustomTask(task.id)}
                    />
                  ))}

                  {catalogTasks.length === 0 ? (
                    <div className="empty-state" data-testid="catalog-empty-state">
                      <p>Dieser Aufgabenkatalog enthält noch keine Aufgaben.</p>
                    </div>
                  ) : null}
                </div>
              </Block>
            </>
          ) : null}
        </section>
      </section>

      {hasCatalogChanges && !isTaskEditScreen ? (
        <div className="sticky-save-bar">
          <button
            className="primary-action"
            data-testid="catalog-save-button"
            type="button"
            disabled={!renameValue.trim()}
            onClick={saveCatalogDetails}
          >
            Speichern
          </button>
        </div>
      ) : null}
      <ConfirmDialog
        confirmLabel={getPendingDeleteConfirmLabel(pendingDelete)}
        description={getPendingDeleteDescription(pendingDelete)}
        open={!!pendingDelete}
        title={getPendingDeleteTitle()}
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmPendingDelete}
      />
    </main>
  );
}

type CatalogTaskItemProps = {
  task: GameTask;
  onEdit: () => void;
  onToggle: () => void;
  onDelete?: () => void;
};

type CatalogDialogsProps = {
  catalogToDelete: TaskCatalog | null;
  pendingDelete: PendingDelete | null;
  onCancelCatalogDelete: () => void;
  onCancelPendingDelete: () => void;
  onConfirmCatalogDelete: () => void;
  onConfirmPendingDelete: () => void;
};

type CatalogBackButtonProps = {
  label: string;
  testId: string;
  onClick: () => void;
};

function CatalogBackButton({ label, testId, onClick }: CatalogBackButtonProps) {
  return (
    <nav className="catalog-back-nav" aria-label="Aufgabenkatalog verlassen">
      <button className="catalog-back-button" data-testid={testId} type="button" onClick={onClick}>
        <ArrowLeft aria-hidden="true" />
        <span>{label}</span>
      </button>
    </nav>
  );
}

function CatalogDialogs({
  catalogToDelete,
  pendingDelete,
  onCancelCatalogDelete,
  onCancelPendingDelete,
  onConfirmCatalogDelete,
  onConfirmPendingDelete,
}: CatalogDialogsProps) {
  return (
    <>
      <ConfirmDialog
        confirmLabel={getPendingDeleteConfirmLabel(pendingDelete)}
        description={getPendingDeleteDescription(pendingDelete)}
        open={!!pendingDelete}
        title={getPendingDeleteTitle()}
        tone="danger"
        onCancel={onCancelPendingDelete}
        onConfirm={onConfirmPendingDelete}
      />
      <ConfirmDialog
        confirmationInputLabel={`Tippe "${catalogToDelete?.name ?? ''}" zur Bestätigung`}
        confirmationText={catalogToDelete?.name}
        confirmLabel="Aufgabenkatalog löschen"
        description={
          catalogToDelete
            ? `Der Aufgabenkatalog "${catalogToDelete.name}" wird mit allen eigenen Aufgaben und Änderungen gelöscht. Der Originalkatalog bleibt erhalten.`
            : ''
        }
        open={!!catalogToDelete}
        title="Aufgabenkatalog wirklich löschen?"
        tone="danger"
        onCancel={onCancelCatalogDelete}
        onConfirm={onConfirmCatalogDelete}
      />
    </>
  );
}

function CatalogTaskItem({ task, onEdit, onToggle, onDelete }: CatalogTaskItemProps) {
  return (
    <ListViewItem
      actions={
        <>
          <button
            className="icon-button edit-action"
            data-testid={`task-row-edit:${task.id}`}
            type="button"
            aria-label={`${task.title} bearbeiten`}
            title="Bearbeiten"
            onClick={onEdit}
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            data-testid={`task-row-toggle:${task.id}`}
            type="button"
            aria-label={task.enabled ? `${task.title} deaktivieren` : `${task.title} aktivieren`}
            title={task.enabled ? 'Deaktivieren' : 'Aktivieren'}
            onClick={onToggle}
          >
            {task.enabled ? <CircleCheck aria-hidden="true" /> : <CircleOff aria-hidden="true" />}
          </button>
          {onDelete ? (
            <button
              className="icon-button danger-action delete-action"
              data-testid={`task-row-delete:${task.id}`}
              type="button"
              aria-label={`${task.title} löschen`}
              title="Löschen"
              onClick={onDelete}
            >
              <Trash2 aria-hidden="true" />
            </button>
          ) : null}
        </>
      }
      id={getTaskListItemId(task.id)}
      meta={<span>{moodLabels[task.mood]}</span>}
      muted={!task.enabled}
      subtitle={task.text}
      testId={`task-row:${task.id}`}
      title={task.title}
    />
  );
}

function hasPairing(
  eligibility: TaskEligibility | undefined,
  firstGender: GenderIdentity,
  secondGender: GenderIdentity,
) {
  return !!eligibility?.allowedGenderPairings?.some(
    ([first, second]) => first === firstGender && second === secondGender,
  );
}

function updatePairing(
  eligibility: TaskEligibility | undefined,
  firstGender: GenderIdentity,
  secondGender: GenderIdentity,
  enabled: boolean,
): TaskEligibility | undefined {
  const currentPairings = eligibility?.allowedGenderPairings ?? [];
  const nextPairings = enabled
    ? [...currentPairings, [firstGender, secondGender] as [GenderIdentity, GenderIdentity]]
    : currentPairings.filter(([first, second]) => first !== firstGender || second !== secondGender);

  return normalizeTaskEligibility({ allowedGenderPairings: nextPairings });
}

function normalizeTaskEligibility(
  eligibility: TaskEligibility | undefined,
): TaskEligibility | undefined {
  if (!eligibility?.allowedGenderPairings?.length) {
    return undefined;
  }

  return eligibility;
}

function getPendingDeleteTitle() {
  return 'Aufgabe wirklich loeschen?';
}

function getPendingDeleteDescription(pendingDelete: PendingDelete | null) {
  if (!pendingDelete) {
    return '';
  }

  if (pendingDelete.type === 'built-in-task') {
    return `Die Originalaufgabe "${pendingDelete.task.title}" wird nicht geloescht, sondern im Originalkatalog deaktiviert.`;
  }

  return `Die Aufgabe "${pendingDelete.task.title}" wird geloescht.`;
}

function getPendingDeleteConfirmLabel(pendingDelete: PendingDelete | null) {
  if (pendingDelete?.type === 'built-in-task') {
    return 'Aufgabe deaktivieren';
  }

  return 'Aufgabe loeschen';
}

function getCatalogIdFromRoute(route: string) {
  const prefix = '/catalog/';

  if (!route.startsWith(prefix)) {
    return null;
  }

  return decodeURIComponent(route.slice(prefix.length));
}

function getTaskListItemId(taskId: string) {
  return `catalog-task-${taskId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function slugifyFileName(value: string) {
  const slug = value
    .trim()
    .toLocaleLowerCase('de-DE')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'aufgabenkatalog';
}
