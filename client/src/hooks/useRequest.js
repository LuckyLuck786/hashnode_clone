import { useCallback, useEffect, useRef, useState } from 'react';
import { readErrorMessage } from '../api/axios.js';

// Runs an async request and exposes the loading / error / data states every page needs.
// `request` receives an AbortSignal so a navigation mid-flight cannot set state twice.
export default function useRequest(request, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);
  const requestRef = useRef(request);
  requestRef.current = request;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    requestRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setLoading(false);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        const message = readErrorMessage(requestError);
        if (message === null) return;
        setError(message);
        setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, loading, error, reload, setData };
}
