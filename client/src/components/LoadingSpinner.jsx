// Used for in-place busy states such as a submitting button. Whole pages use skeletons
// instead so the layout does not jump once the data lands.
export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <>
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );
}
