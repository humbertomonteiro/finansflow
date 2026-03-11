import { IRepository } from "../../interfaces/repository/repository";
import { Account } from "../../entities/account/Account";
import { User } from "../../entities/user/User";
import { IAccount } from "../../interfaces/account/IAccount";

export class UpdateAccountUsecase {
  constructor(
    private readonly accountRepository: IRepository<Account>,
    private readonly userRepository: IRepository<User>,
  ) {}

  async execute(
    accountId: string,
    userId: string,
    props: Partial<Omit<IAccount, "id">>,
  ): Promise<Account> {
    // BUG FIX: o original nomeava o parâmetro "account" igual ao resultado do
    // findById, então os dados novos eram silenciosamente ignorados.
    const existing = await this.accountRepository.findById(accountId);
    if (!existing) throw new Error("Account not found");

    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const updatedAccount = existing.update({
      ...props,
      updatedAt: new Date(),
    });

    await this.accountRepository.update(accountId, updatedAccount);

    return updatedAccount;
  }
}
