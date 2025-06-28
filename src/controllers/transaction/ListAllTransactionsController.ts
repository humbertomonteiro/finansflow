import { TransactionsListByUserUsecase } from "@/domain/usecases/transaction/TransactionsListByUserUsecase";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";

export const ListAllTransactionsController = async (
  accountId: string
): Promise<ITransaction[] | null> => {
  try {
    const listTransactionsByUserUsecase = new TransactionsListByUserUsecase(
      new TransactionRepositoryFirestore()
    );

    const transactions = await listTransactionsByUserUsecase.execute(accountId);
    return transactions;
  } catch (error) {
    console.error(error);
    return null;
  }
};
