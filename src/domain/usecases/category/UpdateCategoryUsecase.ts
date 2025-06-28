import { IRepository } from "../../interfaces/repository/repository";
import { Category } from "../../entities/category/Category";
import { User } from "../../entities/user/User";

export class UpdateCategoryUsecase {
  constructor(
    private readonly categoryRepository: IRepository<Category>,
    private readonly userRepository: IRepository<User>
  ) {}

  async execute(
    categoryId: string,
    userId: string,
    category: Category
  ): Promise<Category> {
    try {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) throw new Error("Category not found");

      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error("User not found");

      const updatedCategory = category.update(category);
      await this.categoryRepository.update(categoryId, updatedCategory);

      return updatedCategory;
    } catch (error) {
      throw new Error("Category not found" + error);
    }
  }
}
