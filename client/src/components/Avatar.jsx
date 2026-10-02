export default function Avatar({ user, size = 'sm' }) {
  const className = `avatar${size === 'lg' ? ' avatar--lg' : ''}`;
  const name = user?.name || 'Unknown';

  if (user?.avatarUrl) {
    return <img className={className} src={user.avatarUrl} alt="" width="28" height="28" />;
  }
  return (
    <span className={className} aria-hidden="true">
      {name.trim().charAt(0)}
    </span>
  );
}
