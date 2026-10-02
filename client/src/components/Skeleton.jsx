export function SkeletonLine({ width = '100%' }) {
  return <span className="skeleton skeleton--line" style={{ width, display: 'block' }} />;
}

export function PostCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span className="skeleton skeleton--title" />
      <div className="skeleton-card__lines">
        <SkeletonLine />
        <SkeletonLine width="88%" />
        <SkeletonLine width="40%" />
      </div>
    </div>
  );
}

export function PostListSkeleton({ count = 4 }) {
  return (
    <div className="post-list" role="status" aria-label="Loading posts">
      {Array.from({ length: count }, (unused, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="article" role="status" aria-label="Loading post">
      <span className="skeleton skeleton--thumb" />
      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '2rem' }} aria-hidden="true">
        <span className="skeleton skeleton--title" />
        <SkeletonLine width="35%" />
        <SkeletonLine />
        <SkeletonLine width="94%" />
        <SkeletonLine width="97%" />
        <SkeletonLine width="60%" />
      </div>
    </div>
  );
}
