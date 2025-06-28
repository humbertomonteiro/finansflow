import { IRepository } from "../../interfaces/repository/repository";
import { User } from "../../entities/user/User";
import { IUser } from "../../interfaces/user/IUser";

export class AddAccountUsecase {
  constructor(private readonly userRepository: IRepository<User>) {}

  async execute(userId: string, accountId: string): Promise<User> {
    try {
      const MAX_ACCOUNTS = 3;
      const userData = await this.userRepository.findById(userId);

      if (!userData) {
        throw new Error("User not found");
      }

      const user = User.fromData(
        userData as unknown as IUser & { password: string }
      );

      const userAccounts = user.accountsIds;

      if (userAccounts.length >= MAX_ACCOUNTS) {
        throw new Error(`User already has ${MAX_ACCOUNTS} accounts`);
      }

      const newUser = user.addAccount(accountId);

      await this.userRepository.update(userId, newUser);

      console.log("Account added successfully");

      return newUser;
    } catch (error) {
      throw new Error("Error adding account" + error);
    }
  }
}
