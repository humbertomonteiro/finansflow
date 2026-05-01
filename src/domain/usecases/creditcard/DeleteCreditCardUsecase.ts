import { CreditCardRepositoryFirestore } from "@/infra/repositories/FirebaseCreditCardRepository";

export class DeleteCreditCardUsecase {
  constructor(private readonly repo: CreditCardRepositoryFirestore) {}

  async execute(cardId: string): Promise<void> {
    await this.repo.delete(cardId);
  }
}
