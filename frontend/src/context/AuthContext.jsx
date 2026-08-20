import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('school_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.error("Auth token validation failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    const { access_token, role, full_name, user_id } = res.data;
    localStorage.setItem('school_token', access_token);
    setToken(access_token);
    const userData = { id: user_id, username, full_name, role };
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('school_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await authAPI.getMe();
        setUser(res.data);
      } catch (err) {
        console.error("Failed to refresh user data:", err);
      }
    }
  };

  const updateUser = (updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : updatedFields);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, login, logout, refreshUser, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
