import { Goal } from "../../entities/goal/Goal";
import { GoalRepositoryFirestore } from "@/infra/repositories/FirebaseGoalRepository";

export class CreateGoalUsecase {
  constructor(private readonly goalRepository: GoalRepositoryFirestore) {}

  async execute(
    userId: string,
    categoryId: string,
    monthlyLimit: number
  ): Promise<Goal> {
    const goal = Goal.create({ userId, categoryId, monthlyLimit });
    return await this.goalRepository.save(goal);
  }
}
