import apiClient from './api';
import { SettlementRequest, SettlementResponse } from '../types/settlement';

export const createSettlement = async (settlementData: SettlementRequest): Promise<SettlementResponse> => {
  try {
    const response = await apiClient.post<SettlementResponse>('/api/settlements', settlementData);
    return response.data;
  } catch (error) {
    console.error('Failed to create settlement:', error);
    throw error;
  }
};
