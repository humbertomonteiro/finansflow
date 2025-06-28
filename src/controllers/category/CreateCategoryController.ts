import { Category } from "@/domain/entities/category/Category";
import { CreateCategoryUsecase } from "@/domain/usecases/category/CreateCategoryUsecase";
import { CategoryRepositoryFirestore } from "@/infra/repositories/FirebaseCategoryRepository";

export const CreateCategoryController = async (
  category: Omit<Category, "id">
) => {
  try {
    const categoryRepository = new CategoryRepositoryFirestore();
    const createCategoryUsecase = new CreateCategoryUsecase(categoryRepository);
    const newCategory = await createCategoryUsecase.execute(category);

    return newCategory;
  } catch (error) {
    console.log(error);
  }
};
