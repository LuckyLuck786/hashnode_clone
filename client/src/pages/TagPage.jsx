import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchTagPosts } from '../api/tags.js';
import usePaginatedPosts from '../hooks/usePaginatedPosts.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PostList from '../components/post/PostList.jsx';
import StateMessage from '../components/ui/StateMessage.jsx';

export default function TagPage() {
  const { slug } = useParams();
  const fetchPage = useCallback((page) => fetchTagPosts(slug, { page }), [slug]);
  const list = usePaginatedPosts(fetchPage);
  const tagName = list.meta?.tag?.name ?? slug;
  useDocumentTitle(`#${tagName}`);

  if (list.status === 'error' && list.error.status === 404) {
    return (
      <StateMessage
        title="Tag not found"
        action={
          <Link to="/tags" className="btn">
            Browse all tags
          </Link>
        }
      >
        No posts have been tagged #{slug} yet.
      </StateMessage>
    );
  }

  return (
    <>
      <header className="page-header">
        <p className="sidebar-heading">Tag</p>
        <h1 className="page-title">#{tagName}</h1>
      </header>
      <PostList
        list={list}
        emptyTitle="No published posts yet"
        emptyMessage={`Posts tagged #${tagName} will appear here once they are published.`}
      />
    </>
  );
}
