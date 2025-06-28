import { IRepository } from "../../interfaces/repository/repository";
import { Category } from "../../entities/category/Category";
import { User } from "../../entities/user/User";

export class RemoveCategoryUsecase {
  constructor(
    private readonly categoryRepository: IRepository<Category>,
    private readonly userRepository: IRepository<User>
  ) {}

  async execute(categoryId: string): Promise<string> {
    try {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) throw new Error("Category not found");

      const users = await this.userRepository.findAll();
      const user = users.find((u) => u.categoriesIds.includes(categoryId));

      if (user) {
        const updatedUser = user.removeCategory(categoryId);
        await this.userRepository.update(user.id, updatedUser);
      }

      await this.categoryRepository.delete(categoryId);

      return `Category ${categoryId} removed successfully`;
    } catch (error) {
      throw new Error("Category not found" + error);
    }
  }
}
