import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/axios.js';

// Loads a single resource. `load` should be wrapped in useCallback by the caller.
export default function useResource(load) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    load()
      .then((result) => {
        if (ignore) return;
        setData(result);
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
  }, [load, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { data, setData, status, error, retry };
}
