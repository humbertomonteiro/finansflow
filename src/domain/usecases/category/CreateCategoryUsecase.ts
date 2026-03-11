import { ICategory } from "../../interfaces/category/ICategory";
import { IRepository } from "../../interfaces/repository/repository";
import { Category } from "../../entities/category/Category";
import { User } from "../../entities/user/User";
import { IUser } from "../../interfaces/user/IUser";

export class CreateCategoryUsecase {
  constructor(
    private readonly categoryRepository: IRepository<Category>,
    private readonly userRepository: IRepository<User>,
  ) {}

  async execute(
    userId: string,
    categoryData: Pick<ICategory, "name" | "description">,
  ): Promise<Category> {
    const MAX_CATEGORIES = 20;

    // 1. Valida que o usuário existe
    const userData = await this.userRepository.findById(userId);
    if (!userData) throw new Error("User not found");

    const user = User.fromData(
      userData as unknown as IUser & { password: string },
    );

    // 2. Verifica limite
    if (user.categoriesIds.length >= MAX_CATEGORIES) {
      throw new Error(`User already has ${MAX_CATEGORIES} categories`);
    }

    // 3. Cria a categoria com userId embutido
    const newCategory = Category.create({
      ...categoryData,
      userId,
    });

    // 4. Salva a categoria no Firestore
    await this.categoryRepository.save(newCategory);

    // 5. Adiciona o ID da categoria ao documento do usuário
    const updatedUser = user.addCategory(newCategory.id);
    await this.userRepository.update(userId, updatedUser);

    return newCategory;
  }
}
