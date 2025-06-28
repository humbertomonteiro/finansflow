import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { IRepository } from "@/domain/interfaces/repository/repository";

export class TransactionsListByUserUsecase {
  constructor(
    private readonly transactionRepository: IRepository<ITransaction>
  ) {}

  async execute(accountId: string): Promise<ITransaction[] | null> {
    try {
      if (this.transactionRepository.getTransactionsForAccount) {
        const getTransactions =
          await this.transactionRepository.getTransactionsForAccount(accountId);
        return getTransactions;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
    return null;
  }
}
