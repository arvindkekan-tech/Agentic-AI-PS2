import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('proofpath_token');
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch {
          api.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener('proofpath:auth_expired', handleExpired);
    return () => window.removeEventListener('proofpath:auth_expired', handleExpired);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name?: string) => {
    const res = await api.register({ email, password: pass, full_name: name });
    setUser(res.user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
