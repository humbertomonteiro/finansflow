import { IAccount } from "@/domain/interfaces/account/IAccount";
import { Account } from "@/domain/entities/account/Account";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import { UpdateAccountUsecase } from "@/domain/usecases/account/UpdateAccountUsecase";

/**
 * Atualiza nome e/ou saldo de uma conta existente.
 *
 * @param accountId  - ID da conta a ser atualizada
 * @param userId     - ID do dono da conta (validação de propriedade)
 * @param props      - Campos a atualizar: { name?, balance? }
 * @returns          - Account atualizada
 */
export const updateAccountController = async (
  accountId: string,
  userId: string,
  props: Pick<Partial<IAccount>, "name" | "balance">
): Promise<Account> => {
  if (!accountId) throw new Error("accountId é obrigatório");
  if (!userId) throw new Error("userId é obrigatório");
  if (props.balance !== undefined && props.balance < 0) {
    throw new Error("Saldo não pode ser negativo");
  }
  if (props.name !== undefined && props.name.trim().length < 3) {
    throw new Error("Nome deve ter ao menos 3 caracteres");
  }

  const accountRepository = new AccountRepositoryFirestore();
  const userRepository = new UserRepositoryFirestore();

  const usecase = new UpdateAccountUsecase(accountRepository, userRepository);

  return await usecase.execute(accountId, userId, props);
};
