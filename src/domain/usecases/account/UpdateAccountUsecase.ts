import { IRepository } from "../../interfaces/repository/repository";
import { Account } from "../../entities/account/Account";
import { User } from "../../entities/user/User";

export class UpdateAccountUsecase {
  constructor(
    private readonly accountRepository: IRepository<Account>,
    private readonly userRepository: IRepository<User>
  ) {}

  async execute(
    accountId: string,
    userId: string,
    account: Account
  ): Promise<Account> {
    try {
      const account = await this.accountRepository.findById(accountId);
      if (!account) throw new Error("Account not found");

      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error("User not found");

      const updatedAccount = account.update(account);
      await this.accountRepository.update(accountId, updatedAccount);

      return updatedAccount;
    } catch (error) {
      throw new Error("Account not found" + error);
    }
  }
}
