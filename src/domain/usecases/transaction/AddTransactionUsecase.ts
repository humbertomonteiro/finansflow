import { IRepository } from "../../interfaces/repository/repository";
import { Account } from "../../entities/account/Account";
import { Transaction } from "../../entities/transaction/Transaction";

export class AddTransactionUsecase {
  constructor(
    private readonly accountRepository: IRepository<Account>,
    private readonly transactionRepository: IRepository<Transaction>
  ) {}

  async execute(accountId: string, transaction: Transaction): Promise<Account> {
    try {
      const accountData = await this.accountRepository.findById(accountId);
      if (!accountData) throw new Error("Account not found");

      const account = Account.fromData(accountData);

      const newAccount = account.addTransaction(transaction.id);

      await this.accountRepository.update(accountId, newAccount);
      await this.transactionRepository.save(transaction);

      console.log("Transaction added successfully");
      return newAccount;
    } catch (error) {
      throw new Error("Transaction not added: " + error);
    }
  }
}
