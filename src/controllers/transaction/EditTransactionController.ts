import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { EditTransactionUseCase } from "@/domain/usecases/transaction/EditTransactionUseCase";

export const EditiTransactionController = async (
  transactionId: string,
  newTransaction: Partial<ITransaction>
) => {
  const transactionRepository = new TransactionRepositoryFirestore();
  const editTransactionUsecase = new EditTransactionUseCase(
    transactionRepository
  );

  const edit = editTransactionUsecase.execute(transactionId, newTransaction);

  console.log("Transaction edited successfull!");

  return edit;
};
