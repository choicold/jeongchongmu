import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';
import { LoginResponse, RegisterCredentials } from '../types/auth';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
    const { bearerToken } = response.data;
    await AsyncStorage.setItem('bearerToken', bearerToken);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const register = async (email: string, password: string): Promise<void> => {
  try {
    await apiClient.post('/api/auth/register', { email, password });
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem('bearerToken');
};
