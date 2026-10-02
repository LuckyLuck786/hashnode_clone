export default function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
