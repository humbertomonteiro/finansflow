import { ICategory } from "../../interfaces/category/ICategory";
import { generateUID } from "../../../utils/GenerateUid";
import { InvalidCategoryNameError } from "../../../errors/category/CategoryErrors";

export class Category {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;

  private constructor(props: ICategory) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
  }

  static create(props: Omit<ICategory, "id">): Category {
    if (props.name.length < 3) throw new InvalidCategoryNameError();

    return new Category({
      id: generateUID(),
      ...props,
    });
  }

  update(props: Partial<Omit<ICategory, "id">>): Category {
    const mergedProps = {
      name: props.name ?? this.name,
      description: props.description ?? this.description,
    };

    if (props.name && props.name.length < 3)
      throw new InvalidCategoryNameError();

    return new Category({
      id: this.id,
      ...mergedProps,
    });
  }

  toJSON(): ICategory {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
    };
  }
}
