export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages < 2) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Newer
      </button>
      <span aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Older
      </button>
    </nav>
  );
}
