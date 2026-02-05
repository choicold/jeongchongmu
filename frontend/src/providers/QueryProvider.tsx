import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * React Query 설정
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 캐시 시간 설정
      staleTime: 2 * 60 * 1000, // 2분: 이 시간 동안은 데이터가 신선하다고 판단
      gcTime: 5 * 60 * 1000, // 5분: 사용하지 않는 캐시 데이터 보관 시간

      // 재시도 설정
      retry: 1, // 실패 시 1번만 재시도
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // 자동 리프레시 설정
      refetchOnWindowFocus: true, // 창 포커스 시 자동 리프레시
      refetchOnReconnect: true, // 네트워크 재연결 시 자동 리프레시
      refetchOnMount: true, // 컴포넌트 마운트 시 리프레시
    },
    mutations: {
      retry: 0, // Mutation은 재시도하지 않음
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider - React Query 제공자 컴포넌트
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
