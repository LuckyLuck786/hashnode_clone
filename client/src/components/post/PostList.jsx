import PostCard from './PostCard.jsx';
import { PostListSkeleton } from './PostCardSkeleton.jsx';
import StateMessage, { ErrorMessage } from '../ui/StateMessage.jsx';

// Renders every state of a paginated list from usePaginatedPosts.
export default function PostList({ list, emptyTitle, emptyMessage, emptyAction, showAuthor }) {
  const { posts, status, error, retry, hasMore, loadMore, isLoadingMore, loadMoreError } = list;

  if (status === 'loading') return <PostListSkeleton />;
  if (status === 'error') return <ErrorMessage message={error.message} onRetry={retry} />;
  if (!posts.length) {
    return (
      <StateMessage title={emptyTitle} action={emptyAction}>
        {emptyMessage}
      </StateMessage>
    );
  }

  return (
    <>
      <ul className="post-list">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} showAuthor={showAuthor} />
        ))}
      </ul>
      {hasMore && (
        <div className="load-more">
          <button type="button" className="btn" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Load more posts'}
          </button>
          {loadMoreError && <p className="form-error">{loadMoreError}</p>}
        </div>
      )}
    </>
  );
}
