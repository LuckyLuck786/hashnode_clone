export default function ErrorMessage({ children, onRetry }) {
  if (!children) return null;
  return (
    <p className="notice notice--error" role="alert">
      {children}
      {onRetry ? (
        <>
          {' '}
          <button type="button" className="button button--quiet" onClick={onRetry}>
            Try again
          </button>
        </>
      ) : null}
    </p>
  );
}
