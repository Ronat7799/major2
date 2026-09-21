import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('reabjom_token'));
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem('reabjom_token')));

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
      } catch {
        sessionStorage.removeItem('reabjom_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      setSession(nextToken, nextUser) {
        sessionStorage.setItem('reabjom_token', nextToken);
        setToken(nextToken);
        setUser(nextUser);
      },
      updateUser(nextUser) {
        setUser(nextUser);
      },
      logout() {
        sessionStorage.removeItem('reabjom_token');
        setToken(null);
        setUser(null);
        disconnectSocket();
      },
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
