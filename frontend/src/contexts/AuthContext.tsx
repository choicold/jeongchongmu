import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';
import * as authService from '../services/authService';

interface AuthContextData {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      const token = await AsyncStorage.getItem('bearerToken');
      if (token) {
        // Here you might want to fetch the user profile from the backend
        // For now, we'll just assume the user is logged in if a token exists.
        // A proper implementation would decode the token or fetch user data.
        setUser({} as User); // This is a placeholder
      }
      setLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      // After login, you might want to fetch user data and set it
      setUser({} as User); // Placeholder, you should fetch real user data
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

