import { Goal } from "@/domain/entities/goal/Goal";
import { CreateGoalUsecase } from "@/domain/usecases/goal/CreateGoalUsecase";
import { GoalRepositoryFirestore } from "@/infra/repositories/FirebaseGoalRepository";

export const CreateGoalController = async (
  userId: string,
  categoryId: string,
  monthlyLimit: number
): Promise<Goal> => {
  if (!userId) throw new Error("userId é obrigatório");
  if (!categoryId) throw new Error("categoryId é obrigatório");
  if (!monthlyLimit || monthlyLimit <= 0)
    throw new Error("Limite mensal deve ser maior que zero");

  const goalRepository = new GoalRepositoryFirestore();
  const usecase = new CreateGoalUsecase(goalRepository);
  return await usecase.execute(userId, categoryId, monthlyLimit);
};
