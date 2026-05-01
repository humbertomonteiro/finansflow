import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";

export const ListTransactionsByCreditCardController = async (
  creditCardId: string
): Promise<ITransaction[]> => {
  if (!creditCardId) return [];
  const repo = new TransactionRepositoryFirestore();
  return await repo.getTransactionsByCreditCard(creditCardId);
};
