import { GoalRepositoryFirestore } from "@/infra/repositories/FirebaseGoalRepository";

export class DeleteGoalUsecase {
  constructor(private readonly goalRepository: GoalRepositoryFirestore) {}

  async execute(goalId: string): Promise<void> {
    await this.goalRepository.delete(goalId);
  }
}
