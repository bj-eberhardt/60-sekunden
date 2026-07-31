import { FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral';
  confirmationText?: string;
  confirmationInputLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  tone = 'neutral',
  confirmationText,
  confirmationInputLabel = 'Bestätigung',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLFormElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const [inputValue, setInputValue] = useState('');
  const confirmationMatches = !confirmationText || inputValue === confirmationText;
  const handleCancel = useCallback(() => {
    setInputValue('');
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timeoutId = window.setTimeout(() => cancelButtonRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [handleCancel, open]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmationMatches) {
      setInputValue('');
      onConfirm();
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        ref={dialogRef}
        className={`confirm-dialog confirm-dialog-${tone}`}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        data-testid="confirm-dialog"
        role="dialog"
        onSubmit={handleSubmit}
      >
        <div className="confirm-dialog-header">
          <p className="eyebrow">{tone === 'danger' ? 'Bestätigung' : 'Hinweis'}</p>
          <h2 id={titleId}>{title}</h2>
        </div>
        <p id={descriptionId}>{description}</p>
        {confirmationText ? (
          <label>
            {confirmationInputLabel}
            <input
              autoComplete="off"
              data-testid="confirm-dialog-input"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
          </label>
        ) : null}
        <div className="action-row">
          <button
            ref={cancelButtonRef}
            data-testid="confirm-dialog-cancel"
            type="button"
            onClick={handleCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'danger-action' : 'primary-action'}
            data-testid="confirm-dialog-confirm"
            disabled={!confirmationMatches}
            type="submit"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
