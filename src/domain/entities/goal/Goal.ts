import { IGoal } from "../../interfaces/goal/IGoal";
import { generateUID } from "../../../utils/GenerateUid";

export class Goal implements IGoal {
  public readonly id: string;
  public readonly userId: string;
  public readonly categoryId: string;
  public readonly monthlyLimit: number;

  private constructor(props: IGoal) {
    this.id = props.id;
    this.userId = props.userId;
    this.categoryId = props.categoryId;
    this.monthlyLimit = props.monthlyLimit;
  }

  static create(props: Omit<IGoal, "id">): Goal {
    if (props.monthlyLimit <= 0) throw new Error("Limite mensal deve ser maior que zero.");
    if (!props.userId) throw new Error("userId é obrigatório.");
    if (!props.categoryId) throw new Error("categoryId é obrigatório.");

    return new Goal({ id: generateUID(), ...props });
  }

  static fromData(data: IGoal): Goal {
    return new Goal(data);
  }

  update(props: Partial<Omit<IGoal, "id" | "userId" | "categoryId">>): Goal {
    const newLimit = props.monthlyLimit ?? this.monthlyLimit;
    if (newLimit <= 0) throw new Error("Limite mensal deve ser maior que zero.");

    return new Goal({
      id: this.id,
      userId: this.userId,
      categoryId: this.categoryId,
      monthlyLimit: newLimit,
    });
  }

  toJSON(): IGoal {
    return {
      id: this.id,
      userId: this.userId,
      categoryId: this.categoryId,
      monthlyLimit: this.monthlyLimit,
    };
  }
}
