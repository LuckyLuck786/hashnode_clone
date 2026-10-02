import { useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner.jsx';

// Confirmation step required before a destructive action. Escape and the backdrop cancel.
export default function ConfirmDialog({ title, body, confirmLabel, busy, onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <p className="dialog__title">{title}</p>
        <p className="dialog__body">{body}</p>
        <div className="dialog__actions">
          <button type="button" className="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={onConfirm}
            disabled={busy}
            ref={confirmRef}
          >
            {busy ? <LoadingSpinner label="Working" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
