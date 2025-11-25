import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('bearerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const testConnection = async () => {
  try {
    const response = await apiClient.get('/actuator/health');
    console.log('✅ Backend Connected:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend Connection Failed:', error);
    return false;
  }
};

export default apiClient;