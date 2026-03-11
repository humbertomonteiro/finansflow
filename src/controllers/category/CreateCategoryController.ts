import { Category } from "@/domain/entities/category/Category";
import { CreateCategoryUsecase } from "@/domain/usecases/category/CreateCategoryUsecase";
import { CategoryRepositoryFirestore } from "@/infra/repositories/FirebaseCategoryRepository";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";

export const CreateCategoryController = async (
  userId: string,
  categoryData: { name: string; description?: string },
): Promise<Category> => {
  if (!userId) throw new Error("userId é obrigatório");
  if (!categoryData.name?.trim()) throw new Error("Nome é obrigatório");

  const categoryRepository = new CategoryRepositoryFirestore();
  const userRepository = new UserRepositoryFirestore();

  const usecase = new CreateCategoryUsecase(categoryRepository, userRepository);
  return await usecase.execute(userId, categoryData);
};
