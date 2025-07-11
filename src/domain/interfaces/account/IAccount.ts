export interface IAccount {
  id: string;
  name: string;
  balance: number;
  updatedAt: Date;
  transactionsIds: string[];
}
