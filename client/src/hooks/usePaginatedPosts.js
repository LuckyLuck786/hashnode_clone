import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/axios.js';

// Loads the first page of a post list and appends later pages on "Load more".
//
// fetchPage(page) must return { posts, page, totalPages, ...extra } and should be wrapped in
// useCallback: a new function starts the list again from page one (for example a new search).
// Anything in `extra` (the tag on a tag page, the user on a profile) is returned as `meta`.
export default function usePaginatedPosts(fetchPage) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null); // { message, status }
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    setError(null);

    fetchPage(1)
      .then(({ posts: firstPage, page: current, totalPages: pages, ...extra }) => {
        if (ignore) return;
        setPosts(firstPage);
        setPage(current);
        setTotalPages(pages);
        setMeta(extra);
        setStatus('ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError({ message: getErrorMessage(err), status: err.response?.status });
        setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [fetchPage, attempt]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setLoadMoreError('');
    try {
      const next = await fetchPage(page + 1);
      setPosts((current) => [...current, ...next.posts]);
      setPage(next.page);
      setTotalPages(next.totalPages);
    } catch (err) {
      setLoadMoreError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, page]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return {
    posts,
    meta,
    status,
    error,
    retry,
    hasMore: page < totalPages,
    loadMore,
    isLoadingMore,
    loadMoreError,
  };
}
