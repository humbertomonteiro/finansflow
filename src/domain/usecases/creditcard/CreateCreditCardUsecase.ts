import { CreditCard } from "@/domain/entities/creditcard/CreditCard";
import { ICreditCard } from "@/domain/interfaces/creditcard/ICreditCard";
import { CreditCardRepositoryFirestore } from "@/infra/repositories/FirebaseCreditCardRepository";

export class CreateCreditCardUsecase {
  constructor(private readonly repo: CreditCardRepositoryFirestore) {}

  async execute(
    userId: string,
    props: Omit<ICreditCard, "id" | "userId">
  ): Promise<CreditCard> {
    const existing = await this.repo.findByUserId(userId);
    if (existing.length >= 2) throw new Error("Limite de 2 cartões atingido");

    const card = CreditCard.create({ userId, ...props });
    await this.repo.save(card);
    return card;
  }
}
