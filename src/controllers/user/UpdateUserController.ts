import { User } from "@/domain/entities/user/User";
import { UpdateUserUsecase } from "@/domain/usecases/user/UpdateUserUsecase";
import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";

export const UpdateUserController = async (
  userId: string,
  user: Partial<User>
) => {
  try {
    const userRepository = new UserRepositoryFirestore();
    const updateUser = new UpdateUserUsecase(userRepository);

    const newUser = updateUser.execute(userId, user);

    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error("Error: " + error);
  }
};
