export interface Expense {
  id: number;
  title: string;
  amount: number;
  payer: string; // Name of the user who paid
  date: string; // ISO 8601 date string
}
