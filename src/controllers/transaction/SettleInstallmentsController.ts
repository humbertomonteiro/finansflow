import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { SettleInstallmentsUseCase } from "@/domain/usecases/transaction/SettleInstallmentsUseCase";

export const settleInstallmentsController = async (
  transactionId: string,
  settlementAmount: number,
  payingAccountId: string
) => {
  const transactionRepository = new TransactionRepositoryFirestore();
  const accountRepository = new AccountRepositoryFirestore();
  const useCase = new SettleInstallmentsUseCase(transactionRepository, accountRepository);
  return useCase.execute(transactionId, settlementAmount, payingAccountId);
};
