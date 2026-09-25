import { Link } from 'react-router-dom';

export default function TagList({ tags }) {
  if (!tags?.length) return null;

  return (
    <ul className="tag-list" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag._id}>
          <Link to={`/tags/${tag.slug}`} className="tag-link">
            #{tag.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
