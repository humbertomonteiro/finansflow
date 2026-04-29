import { Goal } from "@/domain/entities/goal/Goal";
import { GoalRepositoryFirestore } from "@/infra/repositories/FirebaseGoalRepository";

export const ListGoalsByUserController = async (
  userId: string
): Promise<Goal[]> => {
  if (!userId) throw new Error("userId é obrigatório");

  const goalRepository = new GoalRepositoryFirestore();
  return await goalRepository.findByUserId(userId);
};
