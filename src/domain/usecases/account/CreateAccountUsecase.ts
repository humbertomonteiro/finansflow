import { IRepository } from "../../interfaces/repository/repository";
import { Account } from "../../entities/account/Account";
import { IAccount } from "../../interfaces/account/IAccount";

export class CreateAccountUsecase {
  constructor(private readonly accountMemory: IRepository<Account>) {}

  async execute(account: Omit<IAccount, "id">): Promise<Account> {
    try {
      const newAccount = Account.create(account);

      await this.accountMemory.save(newAccount);

      console.log("Account created successfully");
      return newAccount;
    } catch (error) {
      throw new Error("Error creating account" + error);
    }
  }
}
