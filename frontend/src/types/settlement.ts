// 백엔드의 SettlementCreateRequest와 매칭
export interface SettlementRequest {
    expenseId: number;
    method: "N_BUN_1" | "DIRECT" | "PERCENT" | "ITEM";
    participantUserIds: number[];
    directEntries?: DirectEntry[];
    percentEntries?: PercentEntry[];
}

export interface DirectEntry {
    userId: number;
    amount: number;
}

export interface PercentEntry {
    userId: number;
    ratio: number;
}

// 백엔드의 SettlementResponse와 매칭
export interface SettlementResponse {
    settlementId: number;
    expenseId: number;
    method: string;
    status: string;
    totalAmount: number;
    details: SettlementDetail[];
}

export interface SettlementDetail {
    debtorId: number;
    debtorName: string;
    creditorId: number;
    creditorName: string;
    amount: number;
    isSent: boolean;
    transferUrl?: string; // 토스 딥링크
}