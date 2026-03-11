import { IAccount } from "@/domain/interfaces/account/IAccount";
import { Account } from "@/domain/entities/account/Account";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import { CreateAccountUsecase } from "@/domain/usecases/account/CreateAccountUsecase";
import { AddAccountUsecase } from "@/domain/usecases/account/AddAccountUsecase";

export const createAccountController = async (
  userId: string,
  accountData: Omit<IAccount, "id" | "transactionsIds" | "updatedAt">
): Promise<Account> => {
  const accountRepository = new AccountRepositoryFirestore();
  const userRepository = new UserRepositoryFirestore();

  const createAccountUsecase = new CreateAccountUsecase(accountRepository);
  const addAccountUsecase = new AddAccountUsecase(userRepository);

  const newAccount = await createAccountUsecase.execute({
    ...accountData,
    transactionsIds: [],
    updatedAt: new Date(),
  });

  await addAccountUsecase.execute(userId, newAccount.id);

  return newAccount;
};
