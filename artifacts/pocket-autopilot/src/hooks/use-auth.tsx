import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { User } from '@workspace/api-client-react';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('po_token'));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('po_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('po_token');
    }
  }, [token]);

  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      setToken(null);
    }
  }, [isError]);

  const login = (newToken: string, user: User) => {
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), user);
  };

  const logout = () => {
    setToken(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.clear();
  };

  const isLoading = isUserLoading && !!token;

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
