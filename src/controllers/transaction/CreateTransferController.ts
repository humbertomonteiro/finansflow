import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { createTransactionController } from "./CreateTransactionController";

interface CreateTransferInput {
  amount: number;
  fromAccountId: string;
  toAccountId: string;
  dueDate: Date;
  description?: string;
}

export const createTransferController = async ({
  amount,
  fromAccountId,
  toAccountId,
  dueDate,
  description,
}: CreateTransferInput) => {
  return createTransactionController({
    type: TransactionTypes.TRANSFER,
    kind: TransactionKind.SIMPLE,
    amount,
    accountId: fromAccountId,
    targetAccountId: toAccountId,
    dueDate,
    description: description ?? "Transferência",
    categoryId: "",
    recurrence: {},
  });
};
