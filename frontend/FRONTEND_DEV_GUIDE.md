# 정총무(JeongChongMu) Frontend Development Guide

## 1. Project Overview
- **Platform**: React Native (Expo)
- **Language**: TypeScript
- **Networking**: Axios
- **Navigation**: React Navigation (Native Stack)
- **Goal**: Implement User Authentication, Group Management, Expense Tracking, Voting, and Settlement features based on the provided Spring Boot Backend.

---

## 2. Data Types (TypeScript Interfaces)
Based on the Backend DTOs, use these interfaces for type safety.

### 2.1. Auth & User
```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
}

export interface LoginResponse {
  bearerToken: string;
}