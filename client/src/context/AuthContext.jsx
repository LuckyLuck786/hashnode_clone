import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api, { getAuthToken, setAuthToken } from '../api/axios.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" until the stored token has been checked against the API, so protected
  // routes never redirect a signed-in user away during a page refresh.
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!getAuthToken()) {
      setStatus('guest');
      return;
    }

    let active = true;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        setAuthToken(null);
        setStatus('guest');
      });

    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(async (path, payload) => {
    const { data } = await api.post(path, payload);
    setAuthToken(data.token);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const login = useCallback(
    (credentials) => authenticate('/auth/login', credentials),
    [authenticate],
  );

  const register = useCallback((details) => authenticate('/auth/register', details), [
    authenticate,
  ]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: status === 'authenticated', login, register, logout, setUser }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
