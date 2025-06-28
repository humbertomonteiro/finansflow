import { IRepository } from "../../interfaces/repository/repository";
import { User } from "../../entities/user/User";

export class RemoveUserUsecase {
  constructor(private readonly userRepository: IRepository<User>) {}

  async execute(userId: string): Promise<string> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error("User not found");

      await this.userRepository.delete(userId);

      return `User ${userId} removed successfully`;
    } catch (error) {
      throw new Error("User not found" + error);
    }
  }
}
