import { Link } from 'react-router-dom';

export default function TagPill({ tag, count }) {
  return (
    <Link className="tag-pill" to={`/tag/${tag.slug}`}>
      {tag.name}
      {typeof count === 'number' ? <span className="tag-pill__count"> {count}</span> : null}
    </Link>
  );
}
