import { IRepository } from "../../interfaces/repository/repository";
import { User } from "../../entities/user/User";

export class UpdateUserUsecase {
  constructor(private readonly userRepository: IRepository<User>) {}

  async execute(userId: string, user: User): Promise<User> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error("User not found");

      const updatedUser = user.update({
        name: user.name,
        email: user.email,
        password: user.getPassword(),
        accountsIds: user.accountsIds,
        categoriesIds: user.categoriesIds,
      });
      await this.userRepository.update(userId, updatedUser);

      return updatedUser;
    } catch (error) {
      throw new Error("User not found" + error);
    }
  }
}
