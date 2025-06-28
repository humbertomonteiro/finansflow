import { TransactionKind } from "../../enums/transaction/TransactionKind";
import { TransactionTypes } from "../../enums/transaction/TransactionTypes";
import { IPaymentHistory } from "../../interfaces/transaction/IPaymentHistory";
import { IRecurrence } from "./IRecurrence";

export interface ITransaction {
  id: string;
  amount: number;
  type: TransactionTypes;
  dueDate: Date;
  description?: string;
  categoryId: string;
  accountId: string;
  kind: TransactionKind;
  recurrence: IRecurrence;
  paymentHistory: IPaymentHistory[];
}
