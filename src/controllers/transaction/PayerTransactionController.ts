import { PayerTransactionUseCase } from "@/domain/usecases/transaction/PayerTransactionUseCase";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";

export const payerTransactionController = async (
  transactionId: string,
  year: number,
  month: number
) => {
  try {
    console.log(
      `PayerTransactionController: ID ${transactionId}, Year: ${year}, Month: ${month}`
    );
    const accountRepository = new AccountRepositoryFirestore();
    const transactionRepository = new TransactionRepositoryFirestore();

    const payerTransactionUseCase = new PayerTransactionUseCase(
      transactionRepository,
      accountRepository
    );

    const updatedTransaction = await payerTransactionUseCase.execute(
      transactionId,
      year,
      month
    );

    console.log("PayerTransactionController: Payment executed successfully");

    return updatedTransaction;
  } catch (error) {
    console.error("PayerTransactionController error:", error);
    throw new Error("Erro ao pagar transação");
  }
};
