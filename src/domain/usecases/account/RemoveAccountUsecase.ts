import { IRepository } from "../../interfaces/repository/repository";
import { Account } from "../../entities/account/Account";
import { User } from "../../entities/user/User";

export class RemoveAccountUsecase {
  constructor(
    private readonly accountRepository: IRepository<Account>,
    private readonly userRepository: IRepository<User>
  ) {}

  async execute(accountId: string): Promise<string> {
    try {
      const account = await this.accountRepository.findById(accountId);
      if (!account) throw new Error("Account not found");

      const users = await this.userRepository.findAll();
      const user = users.find((u) => u.accountsIds.includes(accountId));

      if (user) {
        const updatedUser = user.removeAccount(accountId);
        await this.userRepository.update(user.id, updatedUser);
      }

      await this.accountRepository.delete(accountId);

      return `Account ${accountId} removed successfully`;
    } catch (error) {
      throw new Error("Account not found" + error);
    }
  }
}
