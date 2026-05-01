export interface ICreditCard {
  id: string;
  userId: string;
  name: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  updatedAt: Date;
}
