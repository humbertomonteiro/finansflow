import { IRepository } from "../../interfaces/repository/repository";
import { Account } from "../../entities/account/Account";
import { User } from "../../entities/user/User";

export class ListAccountByUserUsecase {
  constructor(
    private readonly accountRepository: IRepository<Account>,
    private readonly userRepository: IRepository<User>
  ) {}

  async execute(userId: string): Promise<Account[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const accountIds = user.accountsIds;

    if (accountIds.length === 0) {
      return [];
    }

    const accounts = await Promise.all(
      accountIds.map((accountId) => this.accountRepository.findById(accountId))
    );

    const validAccounts = accounts.filter(
      (account): account is Account => account !== null
    );

    if (validAccounts.length === 0) {
      console.warn(`No valid accounts found for user ${userId}`);
    }

    return validAccounts;
  }
}
