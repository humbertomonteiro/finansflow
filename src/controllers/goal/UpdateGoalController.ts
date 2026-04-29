import { Goal } from "@/domain/entities/goal/Goal";
import { UpdateGoalUsecase } from "@/domain/usecases/goal/UpdateGoalUsecase";
import { GoalRepositoryFirestore } from "@/infra/repositories/FirebaseGoalRepository";

export const UpdateGoalController = async (
  goalId: string,
  monthlyLimit: number
): Promise<Goal> => {
  if (!goalId) throw new Error("goalId é obrigatório");
  if (!monthlyLimit || monthlyLimit <= 0)
    throw new Error("Limite mensal deve ser maior que zero");

  const goalRepository = new GoalRepositoryFirestore();
  const usecase = new UpdateGoalUsecase(goalRepository);
  return await usecase.execute(goalId, monthlyLimit);
};
