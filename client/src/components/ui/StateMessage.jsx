// Used for empty lists, failed requests and missing pages so they all read the same way.
export default function StateMessage({ title, children, action }) {
  return (
    <div className="state" role="status">
      <h2 className="state__title">{title}</h2>
      {children && <p className="state__body">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <StateMessage
      title="Could not load this page"
      action={
        onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            Try again
          </button>
        )
      }
    >
      {message}
    </StateMessage>
  );
}
