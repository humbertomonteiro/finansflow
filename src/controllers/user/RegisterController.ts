import { CreateUserUseCase } from "@/domain/usecases/user/CreateUserUseCase";
import { CreateAccountUsecase } from "@/domain/usecases/account/CreateAccountUsecase";
import { CreateCategoryUsecase } from "@/domain/usecases/category/CreateCategoryUsecase";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
import { AddAccountUsecase } from "@/domain/usecases/account/AddAccountUsecase";
import { auth } from "@/infra/services/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

import bcrypt from "bcryptjs";

export const registerController = async (
  name: string,
  email: string,
  password: string
) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userRepository = new UserRepositoryFirestore();
    const createUserUseCase = new CreateUserUseCase(userRepository);

    const accountRepository = new AccountRepositoryFirestore();
    const createAccountUseCase = new CreateAccountUsecase(accountRepository);
    const addAccountUseCase = new AddAccountUsecase(userRepository);

    const user = await createUserUseCase.execute({
      name,
      email,
      password: hashedPassword,
      accountsIds: [],
      categoriesIds: [],
    });

    const account = await createAccountUseCase.execute({
      name: "Conta",
      balance: 0,
      transactionsIds: [],
      updatedAt: new Date(),
    });

    await addAccountUseCase.execute(user.id, account.id);

    await createUserWithEmailAndPassword(auth, email, password);

    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
