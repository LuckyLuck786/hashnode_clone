import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import PostList from '../components/post/PostList.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { PostListSkeleton } from '../components/Skeleton.jsx';
import useRequest from '../hooks/useRequest.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useAuth from '../hooks/useAuth.js';

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page')) || 1;
  // "feed" shows everyone, "following" narrows the feed to authors the reader follows.
  const scope = searchParams.get('scope') === 'following' ? 'following' : 'feed';
  const { isAuthenticated } = useAuth();

  // Kept separate from the URL so typing does not fire a request per keystroke.
  const [draftSearch, setDraftSearch] = useState(search);
  useEffect(() => setDraftSearch(search), [search]);

  useDocumentTitle(search ? `Search: ${search}` : null);

  const { data, loading, error, reload } = useRequest(
    (signal) =>
      api
        .get(scope === 'following' ? '/posts/following' : '/posts', {
          params: { search, page },
          signal,
        })
        .then((res) => res.data),
    [search, page, scope],
  );

  function applySearch(event) {
    event.preventDefault();
    const next = {};
    if (draftSearch.trim()) next.search = draftSearch.trim();
    setSearchParams(next);
  }

  function goToPage(nextPage) {
    const next = { page: String(nextPage) };
    if (search) next.search = search;
    if (scope === 'following') next.scope = 'following';
    setSearchParams(next);
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="app-main" id="main">
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <h1 className="page-head__title">
              {scope === 'following' ? 'From authors you follow' : 'Latest from the community'}
            </h1>
            <p className="page-head__meta">
              {scope === 'following'
                ? 'Published posts by the authors you follow.'
                : 'Technical writing from developers. Markdown in, highlighted code out.'}
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <nav className="feed-tabs" aria-label="Feed scope">
            <button
              type="button"
              className={`feed-tab${scope === 'feed' ? ' feed-tab--on' : ''}`}
              onClick={() => setSearchParams({})}
            >
              Everyone
            </button>
            <button
              type="button"
              className={`feed-tab${scope === 'following' ? ' feed-tab--on' : ''}`}
              onClick={() => setSearchParams({ scope: 'following' })}
            >
              Following
            </button>
          </nav>
        ) : null}
      </div>

      <form className="search-bar" onSubmit={applySearch} role="search">
        <label className="sr-only" htmlFor="feed-search">
          Search post titles
        </label>
        <input
          id="feed-search"
          className="input"
          type="search"
          placeholder="Search post titles"
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
        />
        <button type="submit" className="button">
          Search
        </button>
        {search ? (
          <button type="button" className="button button--quiet" onClick={() => setSearchParams({})}>
            Clear
          </button>
        ) : null}
      </form>

      {loading ? <PostListSkeleton /> : null}
      {!loading && error ? <ErrorMessage onRetry={reload}>{error}</ErrorMessage> : null}

      {!loading && !error && data ? (
        data.posts.length ? (
          <>
            <PostList posts={data.posts} />
            <Pagination page={data.page} totalPages={data.totalPages} onChange={goToPage} />
          </>
        ) : (
          <EmptyState
            title={
              search
                ? 'No posts match that search'
                : scope === 'following'
                  ? 'Nothing from your follows yet'
                  : 'No posts published yet'
            }
          >
            {search
              ? 'Try a shorter phrase, or clear the search to see everything.'
              : scope === 'following'
                ? 'Follow a few authors and their new posts collect here.'
                : 'Once someone publishes an article it shows up here, newest first.'}
          </EmptyState>
        )
      ) : null}
    </main>
  );
}
