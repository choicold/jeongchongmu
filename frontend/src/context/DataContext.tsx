import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ExpenseSimpleDTO, ExpenseDetailDTO } from '../types/expense.types';
import { GroupDto } from '../types/group.types';
import { SettlementResponse } from '../types/settlement.types';
import * as groupApi from '../services/api/groupApi';
import * as expenseApi from '../services/api/expenseApi';
import * as settlementApi from '../services/api/settlementApi';

/**
 * DataContext - 반응형 데이터 스트림 관리
 *
 * 그룹, 지출, 정산 데이터를 중앙에서 관리하고,
 * 데이터 변경 시 자동으로 구독자들에게 알림을 전파합니다.
 */

interface DataContextType {
  // 그룹 관련
  groups: GroupDto[];
  selectedGroup: GroupDto | null;
  refreshGroups: () => Promise<void>;
  selectGroup: (groupId: number) => Promise<void>;

  // 지출 관련
  expenses: ExpenseSimpleDTO[];
  selectedExpense: ExpenseDetailDTO | null;
  refreshExpenses: (groupId: number) => Promise<void>;
  selectExpense: (expenseId: number) => Promise<void>;
  invalidateExpense: (expenseId: number) => void;

  // 정산 관련
  settlements: Map<number, SettlementResponse>; // expenseId -> Settlement
  refreshSettlement: (settlementId: number) => Promise<void>;
  invalidateSettlement: (expenseId: number) => void;

  // 전역 갱신
  invalidateAll: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

/**
 * DataProvider - 데이터 Context Provider
 *
 * @example
 * ```tsx
 * // App.tsx
 * import { DataProvider } from './context/DataContext';
 *
 * export default function App() {
 *   return (
 *     <AuthProvider>
 *       <DataProvider>
 *         <Navigation />
 *       </DataProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // 상태 관리
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null);
  const [expenses, setExpenses] = useState<ExpenseSimpleDTO[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetailDTO | null>(null);
  const [settlements, setSettlements] = useState<Map<number, SettlementResponse>>(new Map());

  /**
   * 그룹 목록 새로고침
   */
  const refreshGroups = useCallback(async () => {
    try {
      const groupList = await groupApi.getMyGroups();
      setGroups(groupList);
    } catch (error) {
      console.error('그룹 목록 조회 실패:', error);
    }
  }, []);

  /**
   * 특정 그룹 선택 및 로드
   */
  const selectGroup = useCallback(async (groupId: number) => {
    try {
      const group = await groupApi.getGroupDetail(groupId);
      setSelectedGroup(group);

      // 해당 그룹의 지출 목록도 자동으로 로드
      await refreshExpenses(groupId);
    } catch (error) {
      console.error('그룹 조회 실패:', error);
    }
  }, []);

  /**
   * 특정 그룹의 지출 목록 새로고침
   */
  const refreshExpenses = useCallback(async (groupId: number) => {
    try {
      const expenseList = await expenseApi.getExpensesByGroup(groupId);
      setExpenses(expenseList);

      // 정산 정보도 함께 캐싱 (병렬 처리로 최적화)
      const settlementPromises = expenseList
        .filter(expense => expense.settlementId)
        .map(expense =>
          settlementApi.getSettlement(expense.settlementId!)
            .then(settlement => ({ expenseId: expense.id, settlement }))
            .catch(error => {
              console.error(`정산 ${expense.settlementId} 조회 실패:`, error);
              return null;
            })
        );

      const results = await Promise.all(settlementPromises);
      const newSettlements = new Map<number, SettlementResponse>();
      results.forEach(result => {
        if (result) {
          newSettlements.set(result.expenseId, result.settlement);
        }
      });
      setSettlements(newSettlements);
    } catch (error) {
      console.error('지출 목록 조회 실패:', error);
    }
  }, []);

  /**
   * 특정 지출 선택 및 로드
   */
  const selectExpense = useCallback(async (expenseId: number) => {
    try {
      const expense = await expenseApi.getExpenseDetail(expenseId);
      setSelectedExpense(expense);

      // 정산 정보가 있으면 함께 로드
      if (expense.settlementId) {
        try {
          const settlement = await settlementApi.getSettlement(expense.settlementId);
          setSettlements(prev => new Map(prev).set(expenseId, settlement));
        } catch (error) {
          console.error('정산 조회 실패:', error);
        }
      }
    } catch (error) {
      console.error('지출 상세 조회 실패:', error);
    }
  }, []);

  /**
   * 특정 지출 무효화 (다시 로드 필요)
   */
  const invalidateExpense = useCallback((expenseId: number) => {
    // 현재 선택된 지출이 무효화되었다면 다시 로드
    if (selectedExpense?.id === expenseId) {
      selectExpense(expenseId);
    }

    // 지출 목록도 갱신 (selectedGroup이 있을 때만)
    if (selectedGroup) {
      refreshExpenses(selectedGroup.id);
    }
  }, [selectedExpense, selectedGroup, selectExpense, refreshExpenses]);

  /**
   * 특정 정산 새로고침
   */
  const refreshSettlement = useCallback(async (settlementId: number) => {
    try {
      const settlement = await settlementApi.getSettlement(settlementId);

      // expenseId를 찾아서 Map에 업데이트
      setSettlements(prev => {
        const newMap = new Map(prev);
        // settlement의 expenseId를 사용하여 저장
        if (settlement.expenseId) {
          newMap.set(settlement.expenseId, settlement);
        }
        return newMap;
      });

      // 지출 목록도 갱신 (정산 상태가 변경되었을 수 있으므로)
      if (selectedGroup) {
        refreshExpenses(selectedGroup.id);
      }
    } catch (error) {
      console.error('정산 조회 실패:', error);
    }
  }, [selectedGroup, refreshExpenses]);

  /**
   * 특정 지출의 정산 무효화
   */
  const invalidateSettlement = useCallback((expenseId: number) => {
    // 지출 목록 갱신 (정산 상태가 변경되었을 수 있으므로)
    if (selectedGroup) {
      refreshExpenses(selectedGroup.id);
    }

    // 선택된 지출도 갱신
    if (selectedExpense?.id === expenseId) {
      selectExpense(expenseId);
    }
  }, [selectedGroup, selectedExpense, refreshExpenses, selectExpense]);

  /**
   * 모든 데이터 무효화
   */
  const invalidateAll = useCallback(() => {
    refreshGroups();
    if (selectedGroup) {
      refreshExpenses(selectedGroup.id);
    }
  }, [refreshGroups, selectedGroup, refreshExpenses]);

  const value: DataContextType = {
    groups,
    selectedGroup,
    refreshGroups,
    selectGroup,
    expenses,
    selectedExpense,
    refreshExpenses,
    selectExpense,
    invalidateExpense,
    settlements,
    refreshSettlement,
    invalidateSettlement,
    invalidateAll,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

/**
 * useData 훅
 * DataContext에 접근하기 위한 커스텀 훅입니다.
 *
 * @example
 * ```tsx
 * import { useData } from '../context/DataContext';
 *
 * function GroupDetailScreen() {
 *   const { selectedGroup, expenses, refreshExpenses } = useData();
 *
 *   useEffect(() => {
 *     if (selectedGroup) {
 *       refreshExpenses(selectedGroup.id);
 *     }
 *   }, [selectedGroup]);
 *
 *   return (
 *     <View>
 *       <Text>{selectedGroup?.name}</Text>
 *       {expenses.map(expense => (
 *         <ExpenseCard key={expense.id} expense={expense} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export const useData = (): DataContextType => {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
};
