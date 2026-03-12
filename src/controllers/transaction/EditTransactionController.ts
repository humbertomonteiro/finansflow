import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";
import {
  EditTransactionUseCase,
  EditScope,
  EditPayload,
} from "@/domain/usecases/transaction/EditTransactionUseCase";

export const editTransactionController = async (
  transactionId: string,
  payload: EditPayload,
  scope: EditScope,
  year?: number,
  month?: number
) => {
  const transactionRepository = new TransactionRepositoryFirestore();
  const useCase = new EditTransactionUseCase(transactionRepository);
  return useCase.execute(transactionId, payload, scope, year, month);
};

export { EditScope };
