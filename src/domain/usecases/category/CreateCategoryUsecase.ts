import { ICategory } from "../../interfaces/category/ICategory";
import { IRepository } from "../../interfaces/repository/repository";
import { Category } from "../../entities/category/Category";

export class CreateCategoryUsecase {
  constructor(private readonly categoryRepository: IRepository<Category>) {}

  async execute(category: Omit<ICategory, "id">): Promise<Category> {
    try {
      const newCategory = Category.create(category);

      await this.categoryRepository.save(newCategory);

      console.log("Category created successfully");

      return newCategory;
    } catch (error) {
      throw new Error("Error creating category" + error);
    }
  }
}
