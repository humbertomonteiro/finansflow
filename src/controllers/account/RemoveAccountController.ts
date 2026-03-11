import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import { RemoveAccountUsecase } from "@/domain/usecases/account/RemoveAccountUsecase";

export const removeAccountController = async (
  accountId: string
): Promise<string> => {
  const accountRepository = new AccountRepositoryFirestore();
  const userRepository = new UserRepositoryFirestore();

  const removeAccountUsecase = new RemoveAccountUsecase(
    accountRepository,
    userRepository
  );

  return await removeAccountUsecase.execute(accountId);
};
