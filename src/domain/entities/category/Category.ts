import { ICategory } from "../../interfaces/category/ICategory";
import { generateUID } from "../../../utils/GenerateUid";
import { InvalidCategoryNameError } from "../../../errors/category/CategoryErrors";

export class Category {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly userId?: string;

  private constructor(props: ICategory) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.userId = props.userId;
  }

  static create(props: Omit<ICategory, "id">): Category {
    if (props.name.trim().length < 2) throw new InvalidCategoryNameError();

    return new Category({
      id: generateUID(),
      ...props,
      name: props.name.trim(),
    });
  }

  static fromData(data: ICategory): Category {
    return new Category(data);
  }

  update(props: Partial<Omit<ICategory, "id">>): Category {
    if (props.name !== undefined && props.name.trim().length < 2)
      throw new InvalidCategoryNameError();

    return new Category({
      id: this.id,
      name: props.name?.trim() ?? this.name,
      description: props.description ?? this.description,
      userId: props.userId ?? this.userId,
    });
  }

  toJSON(): ICategory {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      ...(this.userId ? { userId: this.userId } : {}),
    };
  }
}
