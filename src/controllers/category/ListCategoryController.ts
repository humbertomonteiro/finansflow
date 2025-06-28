import { CategoryRepositoryFirestore } from "@/infra/repositories/FirebaseCategoryRepository";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import { ListCategoryByUserUsecase } from "@/domain/usecases/category/ListCategoryByUserUsecase";

export const listCategoryController = async (userId: string) => {
  const categoryRepository = new CategoryRepositoryFirestore();
  const userRepository = new UserRepositoryFirestore();
  const listCategoryByUserUseCase = new ListCategoryByUserUsecase(
    categoryRepository,
    userRepository
  );
  const categories = await listCategoryByUserUseCase.execute(userId);

  const categoriesDefault = await categoryRepository.findCategoriesDefault();
  return [...categories, ...categoriesDefault];
};
