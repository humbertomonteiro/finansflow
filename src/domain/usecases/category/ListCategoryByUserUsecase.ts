import { Category } from "../../entities/category/Category";
import { CategoryRepositoryFirestore } from "../../../infra/repositories/FirebaseCategoryRepository";

export class ListCategoryByUserUsecase {
  constructor(
    private readonly categoryRepository: CategoryRepositoryFirestore,
  ) {}

  async execute(userId: string): Promise<Category[]> {
    return await this.categoryRepository.findByUserId(userId);
  }
}
