import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  quickLogin: (role: Role) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ru_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const storedToken = localStorage.getItem('ru_auth_token');
      if (storedToken) {
        const { user } = await api.getMe();
        setUser(user);
      } else {
        // Automatically default to Student quick-login for instant reviewability
        const res = await api.quickLogin('STUDENT');
        localStorage.setItem('ru_auth_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Initial session restore failed, bootstrapping demo student:', err);
      try {
        const res = await api.quickLogin('STUDENT');
        localStorage.setItem('ru_auth_token', res.token);
        setToken(res.token);
        setUser(res.user);
      } catch (e) {
        console.error('Demo bootstrap failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      localStorage.setItem('ru_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('ru_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (targetRole: Role) => {
    setLoading(true);
    try {
      const res = await api.quickLogin(targetRole);
      localStorage.setItem('ru_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ru_auth_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user } = await api.getMe();
      setUser(user);
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'STUDENT',
        token,
        loading,
        login,
        register,
        quickLogin,
        logout,
        refreshUser,
      }}
    >
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

