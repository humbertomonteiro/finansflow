import { CategoryRepositoryFirestore } from "@/infra/repositories/FirebaseCategoryRepository";
import { ListCategoryByUserUsecase } from "@/domain/usecases/category/ListCategoryByUserUsecase";
import { Category } from "@/domain/entities/category/Category";

export const listCategoryController = async (
  userId: string,
): Promise<Category[]> => {
  const categoryRepository = new CategoryRepositoryFirestore();

  const [userCategories, defaultCategories] = await Promise.all([
    new ListCategoryByUserUsecase(categoryRepository).execute(userId),
    categoryRepository.findCategoriesDefault(),
  ]);

  return [...defaultCategories, ...userCategories];
};
