import { CreditCard } from "@/domain/entities/creditcard/CreditCard";
import { ICreditCard } from "@/domain/interfaces/creditcard/ICreditCard";
import { CreditCardRepositoryFirestore } from "@/infra/repositories/FirebaseCreditCardRepository";

export class UpdateCreditCardUsecase {
  constructor(private readonly repo: CreditCardRepositoryFirestore) {}

  async execute(
    cardId: string,
    props: Partial<Omit<ICreditCard, "id" | "userId">>
  ): Promise<CreditCard> {
    const existing = await this.repo.findById(cardId);
    if (!existing) throw new Error("Cartão não encontrado");

    const updated = existing.update({ ...props, updatedAt: new Date() });
    await this.repo.update(cardId, updated);
    return updated;
  }
}
