import { CreditCard } from "@/domain/entities/creditcard/CreditCard";
import { CreditCardRepositoryFirestore } from "@/infra/repositories/FirebaseCreditCardRepository";

export const ListCreditCardsByUserController = async (
  userId: string
): Promise<CreditCard[]> => {
  if (!userId) throw new Error("userId é obrigatório");
  const repo = new CreditCardRepositoryFirestore();
  return await repo.findByUserId(userId);
};
