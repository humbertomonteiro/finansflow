import { CreditCard } from "@/domain/entities/creditcard/CreditCard";
import { CreateCreditCardUsecase } from "@/domain/usecases/creditcard/CreateCreditCardUsecase";
import { CreditCardRepositoryFirestore } from "@/infra/repositories/FirebaseCreditCardRepository";

export const CreateCreditCardController = async (
  userId: string,
  props: {
    name: string;
    creditLimit: number;
    closingDay: number;
    dueDay: number;
    color: string;
  }
): Promise<CreditCard> => {
  if (!userId) throw new Error("userId é obrigatório");
  const repo = new CreditCardRepositoryFirestore();
  const usecase = new CreateCreditCardUsecase(repo);
  return await usecase.execute(userId, { ...props, updatedAt: new Date() });
};
