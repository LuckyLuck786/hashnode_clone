import { formatDate, formatReadingTime } from '../../utils/format.js';

// "Mar 4, 2026 · 5 min read"
export default function PostMeta({ post }) {
  const date = post.publishedAt ?? post.updatedAt;

  return (
    <p className="meta">
      <time dateTime={date}>{formatDate(date)}</time>
      <span className="meta__separator" aria-hidden="true">
        ·
      </span>
      <span>{formatReadingTime(post.readingTime)}</span>
    </p>
  );
}
