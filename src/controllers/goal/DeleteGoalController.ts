import { DeleteGoalUsecase } from "@/domain/usecases/goal/DeleteGoalUsecase";
import { GoalRepositoryFirestore } from "@/infra/repositories/FirebaseGoalRepository";

export const DeleteGoalController = async (goalId: string): Promise<void> => {
  if (!goalId) throw new Error("goalId é obrigatório");

  const goalRepository = new GoalRepositoryFirestore();
  const usecase = new DeleteGoalUsecase(goalRepository);
  return await usecase.execute(goalId);
};
