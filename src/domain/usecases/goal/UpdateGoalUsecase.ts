import { Goal } from "../../entities/goal/Goal";
import { GoalRepositoryFirestore } from "@/infra/repositories/FirebaseGoalRepository";

export class UpdateGoalUsecase {
  constructor(private readonly goalRepository: GoalRepositoryFirestore) {}

  async execute(goalId: string, monthlyLimit: number): Promise<Goal> {
    const existing = await this.goalRepository.findById(goalId);
    if (!existing) throw new Error("Meta não encontrada.");

    const updated = existing.update({ monthlyLimit });
    return await this.goalRepository.update(goalId, updated);
  }
}
