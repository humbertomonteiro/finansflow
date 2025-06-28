import { IRepository } from "../../interfaces/repository/repository";
import { User } from "../../entities/user/User";
import { Category } from "../../entities/category/Category";

export class ListCategoryByUserUsecase {
  constructor(
    private readonly categoryRepository: IRepository<Category>,
    private readonly userRepository: IRepository<User>
  ) {}

  async execute(userId: string): Promise<Category[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const categoryIds = user.categoriesIds;

    if (categoryIds.length === 0) {
      return [];
    }

    const categories = await Promise.all(
      categoryIds.map((categoryId) =>
        this.categoryRepository.findById(categoryId)
      )
    );

    const validCategories = categories.filter(
      (category): category is Category => category !== null
    );

    if (validCategories.length === 0) {
      console.warn(`No valid categories found for user ${userId}`);
    }

    return validCategories;
  }
}
