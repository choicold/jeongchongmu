import apiClient from './api';
import { Expense } from '../types/expense';

// Mock function until the backend is ready
export const getExpensesByGroup = async (groupId: number): Promise<Expense[]> => {
  console.log(`Fetching expenses for group ${groupId}...`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data based on groupId
  const mockExpenses: { [key: number]: Expense[] } = {
    1: [
      { id: 101, title: 'Flight Tickets', amount: 1250000, payer: 'Alice', date: '2025-11-20' },
      { id: 102, title: 'Hotel Booking', amount: 800000, payer: 'Bob', date: '2025-11-21' },
    ],
    2: [
      { id: 201, title: 'Ramen Night', amount: 45000, payer: 'Charlie', date: '2025-11-22' },
    ],
    3: [],
  };

  return mockExpenses[groupId] || [];

  /*
  // Real implementation
  try {
    const response = await apiClient.get<Expense[]>(`/api/groups/${groupId}/expenses`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch expenses for group ${groupId}:`, error);
    throw error;
  }
  */
};
