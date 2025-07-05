import { IRepository } from "../../interfaces/repository/repository";
import { User } from "../../entities/user/User";
import { IUser } from "@/domain/interfaces/user/IUser";

export class UpdateUserUsecase {
  constructor(private readonly userRepository: IRepository<User>) {}

  async execute(userId: string, user: Partial<User>): Promise<User> {
    try {
      const userData = await this.userRepository.findById(userId);

      if (!userData) {
        throw new Error("Usur not found");
      }

      const user = User.fromData(
        userData as unknown as IUser & { password: string }
      );

      const newUser = user.update({ ...user });

      const updatedUser = await this.userRepository.update(userId, newUser);

      return updatedUser;
    } catch (error) {
      throw new Error("User not found" + error);
    }
  }
}
