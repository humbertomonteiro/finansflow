import { InvalidEmailError } from "../../../errors/user/UserErrors";
import { IRepository } from "../../interfaces/repository/repository";
import { IUser } from "../../interfaces/user/IUser";
import { User } from "../../entities/user/User";

export class CreateUserUseCase {
  constructor(private readonly userRepository: IRepository<IUser>) {}

  async execute(user: Omit<IUser, "id"> & { password: string }): Promise<User> {
    try {
      const newUser = User.create({ ...user });

      const users = await this.userRepository.findAll();

      const emails = users.map((email) => email.email);
      if (emails.includes(user.email)) {
        throw new InvalidEmailError("Email already exists");
      }

      await this.userRepository.save(newUser);

      console.log("User created successfully");

      return newUser;
    } catch (error) {
      throw new Error("Error creating user" + error);
    }
  }
}
