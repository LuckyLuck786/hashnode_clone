import { useEffect, useRef } from 'react';

// A native <dialog> so focus trapping, Escape to close and the backdrop come for free.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  confirmingLabel = 'Working...',
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="confirm-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isConfirming) onCancel();
      }}
    >
      <h2 id="confirm-dialog-title" className="dialog__title">
        {title}
      </h2>
      <p className="dialog__body">{children}</p>
      <div className="dialog__actions">
        <button type="button" className="btn" onClick={onCancel} disabled={isConfirming}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--danger-solid"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? confirmingLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
