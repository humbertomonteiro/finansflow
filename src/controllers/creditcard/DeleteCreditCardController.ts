import { DeleteCreditCardUsecase } from "@/domain/usecases/creditcard/DeleteCreditCardUsecase";
import { CreditCardRepositoryFirestore } from "@/infra/repositories/FirebaseCreditCardRepository";

export const DeleteCreditCardController = async (
  cardId: string
): Promise<void> => {
  if (!cardId) throw new Error("cardId é obrigatório");
  const repo = new CreditCardRepositoryFirestore();
  const usecase = new DeleteCreditCardUsecase(repo);
  return await usecase.execute(cardId);
};
