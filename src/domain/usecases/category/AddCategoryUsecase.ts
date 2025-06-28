import { IRepository } from "../../interfaces/repository/repository";
import { User } from "../../entities/user/User";
import { IUser } from "../../interfaces/user/IUser";

export class AddCategoryUsecase {
  constructor(private readonly userRepository: IRepository<User>) {}

  async execute(userId: string, categoryId: string): Promise<User> {
    try {
      const MAX_CATEGORIES = 20;

      const userData = await this.userRepository.findById(userId);

      if (!userData) {
        throw new Error("User not found");
      }

      const user = User.fromData(
        userData as unknown as IUser & { password: string }
      );

      const userCategories = user.categoriesIds;

      if (userCategories.length >= MAX_CATEGORIES) {
        throw new Error(`User already has ${MAX_CATEGORIES} categories`);
      }

      const newUser = user.addCategory(categoryId);

      await this.userRepository.update(userId, newUser);

      console.log("Category added successfully");

      return newUser;
    } catch (error) {
      throw new Error("Error adding category" + error);
    }
  }
}
