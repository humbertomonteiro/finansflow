import { CreditCard } from "@/domain/entities/creditcard/CreditCard";
import { ICreditCard } from "@/domain/interfaces/creditcard/ICreditCard";
import { UpdateCreditCardUsecase } from "@/domain/usecases/creditcard/UpdateCreditCardUsecase";
import { CreditCardRepositoryFirestore } from "@/infra/repositories/FirebaseCreditCardRepository";

export const UpdateCreditCardController = async (
  cardId: string,
  props: Partial<Omit<ICreditCard, "id" | "userId">>
): Promise<CreditCard> => {
  if (!cardId) throw new Error("cardId é obrigatório");
  const repo = new CreditCardRepositoryFirestore();
  const usecase = new UpdateCreditCardUsecase(repo);
  return await usecase.execute(cardId, props);
};
