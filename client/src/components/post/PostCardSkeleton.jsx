import Skeleton from '../ui/Skeleton.jsx';

export default function PostCardSkeleton() {
  return (
    <li className="post-row post-row--with-cover" aria-hidden="true">
      <div>
        <Skeleton width={140} height={14} style={{ marginBottom: 14 }} />
        <Skeleton width="85%" height={24} style={{ marginBottom: 12 }} />
        <Skeleton height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={14} style={{ marginBottom: 16 }} />
        <Skeleton width={180} height={12} />
      </div>
      <Skeleton className="post-row__cover" height="auto" />
    </li>
  );
}

export function PostListSkeleton({ count = 4 }) {
  return (
    <ul className="post-list" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </ul>
  );
}
