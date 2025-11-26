import apiClient from './api';
import { Group } from '../types/group';

// Mock function until the backend is ready
export const getMyGroups = async (): Promise<Group[]> => {
  console.log('Fetching my groups...');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  // Return mock data
  return [
    { id: 1, name: '🚀 Goa Trip', memberCount: 5 },
    { id: 2, name: '🍜 Noodle Lovers', memberCount: 3 },
    { id: 3, name: '🎬 Movie Club', memberCount: 8 },
  ];
  
  /*
  // Real implementation
  try {
    const response = await apiClient.get<Group[]>('/api/groups/my');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    throw error;
  }
  */
};
