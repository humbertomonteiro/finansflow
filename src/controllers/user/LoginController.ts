import { IUser } from "@/domain/interfaces/user/IUser";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
import bcrypt from "bcryptjs";
import { auth } from "../../infra/services/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export const loginController = async (
  email: string,
  password: string
): Promise<IUser> => {
  try {
    const repository = new UserRepositoryFirestore();
    const user = await repository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      (user as any).password
    );

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    await signInWithEmailAndPassword(auth, email, password);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accountsIds: user.accountsIds,
      categoriesIds: user.categoriesIds,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
