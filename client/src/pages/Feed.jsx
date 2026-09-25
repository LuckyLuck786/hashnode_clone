import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchPosts } from '../api/posts.js';
import usePaginatedPosts from '../hooks/usePaginatedPosts.js';
import useTags from '../hooks/useTags.js';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PostList from '../components/post/PostList.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { SITE_NAME, SITE_TAGLINE } from '../config.js';

const SIDEBAR_TAG_COUNT = 10;

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search')?.trim() ?? '';
  useDocumentTitle(search ? `Search: ${search}` : '');

  const fetchPage = useCallback(
    (page) => fetchPosts({ page, ...(search && { search }) }),
    [search],
  );
  const list = usePaginatedPosts(fetchPage);

  function handleSearch(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('search').trim();
    setSearchParams(query ? { search: query } : {});
  }

  return (
    <div className="with-sidebar">
      <section aria-labelledby="feed-heading">
        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label htmlFor="search" className="visually-hidden">
            Search posts by title
          </label>
          <input
            id="search"
            name="search"
            type="search"
            className="input"
            placeholder="Search posts by title"
            defaultValue={search}
            key={search}
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>

        {search ? (
          <div className="search-summary">
            <h1 id="feed-heading" className="page-title">
              Results for &ldquo;{search}&rdquo;
            </h1>
            <button type="button" className="link-button" onClick={() => setSearchParams({})}>
              Clear search
            </button>
          </div>
        ) : (
          <h1 id="feed-heading" className="visually-hidden">
            Latest posts
          </h1>
        )}

        <PostList
          list={list}
          emptyTitle={search ? 'No posts match your search' : 'Nothing published yet'}
          emptyMessage={
            search
              ? 'Try a shorter search, or browse by tag instead.'
              : 'The first published post will show up here.'
          }
        />
      </section>

      <FeedSidebar />
    </div>
  );
}

function FeedSidebar() {
  const { user } = useAuth();
  const { tags, status } = useTags();
  const popularTags = tags.filter((tag) => tag.postCount > 0).slice(0, SIDEBAR_TAG_COUNT);

  return (
    <aside>
      <section className="sidebar-section">
        <h2 className="sidebar-heading">About {SITE_NAME}</h2>
        <p>{SITE_TAGLINE}</p>
        {!user && (
          <p style={{ marginTop: 12 }}>
            <Link to="/register" className="text-link">
              Create an account
            </Link>{' '}
            to start writing.
          </p>
        )}
      </section>

      <section className="sidebar-section">
        <h2 className="sidebar-heading">Popular tags</h2>
        {status === 'loading' && (
          <div aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} width="70%" height={14} style={{ marginBottom: 10 }} />
            ))}
          </div>
        )}
        {status === 'error' && <p className="field__hint">Tags are unavailable right now.</p>}
        {status === 'ready' && (
          <ul className="sidebar-tags">
            {popularTags.map((tag) => (
              <li key={tag._id}>
                <Link to={`/tags/${tag.slug}`}>#{tag.name}</Link>
                <span className="count">{tag.postCount}</span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginTop: 14 }}>
          <Link to="/tags" className="text-link">
            All tags
          </Link>
        </p>
      </section>
    </aside>
  );
}
