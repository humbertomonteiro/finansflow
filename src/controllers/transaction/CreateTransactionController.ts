import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { CreateTransactionUsecase } from "@/domain/usecases/transaction/CreateTransactionUsecase";
import { AddTransactionUsecase } from "@/domain/usecases/transaction/AddTransactionUsecase";

export const createTransactionController = async (
  transaction: Omit<ITransaction, "id" | "paymentHistory">
) => {
  try {
    const transactionRepository = new TransactionRepositoryFirestore();
    const accountRepository = new AccountRepositoryFirestore();

    const createTransactionUseCase = new CreateTransactionUsecase(
      transactionRepository
    );
    const addTransactionUseCase = new AddTransactionUsecase(
      accountRepository,
      transactionRepository
    );

    const transactionCreated = await createTransactionUseCase.execute(
      transaction
    );

    await addTransactionUseCase.execute(
      transactionCreated.accountId,
      transactionCreated
    );

    return transactionCreated;
  } catch (error) {
    throw new Error("Error creating transaction" + error);
  }
};
