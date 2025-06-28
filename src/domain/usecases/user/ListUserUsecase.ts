import { IRepository } from "../../interfaces/repository/repository";
import { IUser } from "../../interfaces/user/IUser";

export class ListUserUsecase {
  constructor(private readonly userRepository: IRepository<IUser>) {}

  async execute(): Promise<IUser[]> {
    return this.userRepository.findAll();
  }
}
