import { IRepository } from "../../interfaces/repository/repository";
import { ITransaction } from "../../interfaces/transaction/ITransaction";
import { Transaction } from "../../entities/transaction/Transaction";

export class CreateTransactionUsecase {
  constructor(
    private readonly transactionRepository: IRepository<ITransaction>
  ) {}

  async execute(
    transaction: Omit<ITransaction, "id" | "paymentHistory">
  ): Promise<Transaction> {
    try {
      const newTransaction = Transaction.create(transaction);

      await this.transactionRepository.save(newTransaction);

      console.log("Transaction created successfully");

      return newTransaction;
    } catch (error) {
      throw new Error("Transaction not created" + error);
    }
  }
}
