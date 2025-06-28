import { IAccount } from "@/domain/interfaces/account/IAccount";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import { ListAccountByUserUsecase } from "@/domain/usecases/account/ListAccountByUserUsecase";

export const listAccountByUserController = async (
  userId: string
): Promise<IAccount[]> => {
  try {
    const accountRepository = new AccountRepositoryFirestore();
    const userRepository = new UserRepositoryFirestore();

    const listAccountByUserUsecase = new ListAccountByUserUsecase(
      accountRepository,
      userRepository
    );
    const accounts = await listAccountByUserUsecase.execute(userId);
    return accounts;
  } catch (error) {
    throw new Error("Error listing accounts");
  }
};
