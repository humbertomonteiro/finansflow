import { CategoryRepositoryFirestore } from "@/infra/repositories/FirebaseCategoryRepository";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import { RemoveCategoryUsecase } from "@/domain/usecases/category/RemoveCategoryUsecase";

export const removeCategoryController = async (
  categoryId: string
): Promise<string> => {
  const categoryRepository = new CategoryRepositoryFirestore();
  const userRepository = new UserRepositoryFirestore();

  const removeCategoryUsecase = new RemoveCategoryUsecase(
    categoryRepository,
    userRepository
  );

  return await removeCategoryUsecase.execute(categoryId);
};
