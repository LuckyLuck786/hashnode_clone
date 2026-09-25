import { useId } from 'react';

// Label, control and hint wired together with ids for screen readers.
// `children` is a render function that receives the props for the control.
export default function Field({ label, hint, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children({ id, 'aria-describedby': hintId })}
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
