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

export interface RegisterCredentials {
  email: string;
  password: string;
}
