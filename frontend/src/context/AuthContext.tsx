'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '@/lib/types';
import { authAPI, quizAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  setAuthTokens: (accessToken: string, refreshToken: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const data: AuthResponse = response.data;
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);

    // Transfer quiz results if any
    const sessionId = localStorage.getItem('quiz_session_id');
    if (sessionId) {
      try {
        await quizAPI.transferSessionResults(sessionId);
        localStorage.removeItem('quiz_session_id');
        localStorage.removeItem('pending_quiz_result');
      } catch (error) {
        console.error('Failed to transfer quiz results:', error);
      }
    }
  };

  const register = async (email: string, username: string, password: string, fullName: string) => {
    const response = await authAPI.register({
      email,
      username,
      password,
      full_name: fullName,
    });
    const data: AuthResponse = response.data;
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);

    // Transfer quiz results if any
    const sessionId = localStorage.getItem('quiz_session_id');
    if (sessionId) {
      try {
        await quizAPI.transferSessionResults(sessionId);
        localStorage.removeItem('quiz_session_id');
        localStorage.removeItem('pending_quiz_result');
      } catch (error) {
        console.error('Failed to transfer quiz results:', error);
      }
    }
  };

  const googleLogin = async (token: string) => {
    const response = await authAPI.googleAuth(token);
    const data: AuthResponse = response.data;
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);

    // Transfer quiz results if any
    const sessionId = localStorage.getItem('quiz_session_id');
    if (sessionId) {
      try {
        await quizAPI.transferSessionResults(sessionId);
        localStorage.removeItem('quiz_session_id');
        localStorage.removeItem('pending_quiz_result');
      } catch (error) {
        console.error('Failed to transfer quiz results:', error);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const setAuthTokens = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateUser, setAuthTokens }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

