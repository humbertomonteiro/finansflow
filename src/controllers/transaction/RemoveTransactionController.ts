import { RemoveTransactionUsecase } from "@/domain/usecases/transaction/RemoveTransactionUsecase";
import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { TransactionRemovalScope } from "@/domain/enums/transaction/TransactionRemovalScope";

export const RemoveTransactionController = async (
  transactionId: string,
  scope: TransactionRemovalScope = TransactionRemovalScope.ALL,
  year?: number,
  month?: number
): Promise<string> => {
  try {
    console.log(
      `RemoveTransactionController: Starting removal for ID ${transactionId} with scope ${scope}`
    );

    const transactionRepository = new TransactionRepositoryFirestore();
    const accountRepository = new AccountRepositoryFirestore();

    const removeTransactionUsecase = new RemoveTransactionUsecase(
      transactionRepository,
      accountRepository
    );

    const message = await removeTransactionUsecase.execute(
      transactionId,
      scope,
      year,
      month
    );

    console.log("RemoveTransactionController: Removal executed successfully");

    return message;
  } catch (error) {
    console.error("RemoveTransactionController error:", error);
    throw new Error("Erro ao apagar a transação. Tente novamente.");
  }
};
