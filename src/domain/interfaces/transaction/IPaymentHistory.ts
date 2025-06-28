export interface IPaymentHistory {
  isPaid: boolean;
  dueDate: Date;
  paidAt: Date | null;
  amount: number;
}
