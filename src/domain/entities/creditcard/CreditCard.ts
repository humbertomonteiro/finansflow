import { ICreditCard } from "../../interfaces/creditcard/ICreditCard";
import { generateUID } from "../../../utils/GenerateUid";

export class CreditCard implements ICreditCard {
  public readonly id: string;
  public readonly userId: string;
  public readonly name: string;
  public readonly creditLimit: number;
  public readonly closingDay: number;
  public readonly dueDay: number;
  public readonly color: string;
  public readonly updatedAt: Date;

  private constructor(props: ICreditCard) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.creditLimit = props.creditLimit;
    this.closingDay = props.closingDay;
    this.dueDay = props.dueDay;
    this.color = props.color;
    this.updatedAt = props.updatedAt;
  }

  static create(props: Omit<ICreditCard, "id">): CreditCard {
    if (props.name.length < 3)
      throw new Error("Nome deve ter ao menos 3 caracteres");
    if (props.creditLimit <= 0)
      throw new Error("Limite deve ser maior que zero");
    if (props.closingDay < 1 || props.closingDay > 28)
      throw new Error("Dia de fechamento deve ser entre 1 e 28");
    if (props.dueDay < 1 || props.dueDay > 28)
      throw new Error("Dia de vencimento deve ser entre 1 e 28");

    return new CreditCard({ id: generateUID(), ...props });
  }

  static fromData(data: ICreditCard): CreditCard {
    return new CreditCard({
      id: data.id,
      userId: data.userId,
      name: data.name,
      creditLimit: data.creditLimit || 0,
      closingDay: data.closingDay || 1,
      dueDay: data.dueDay || 10,
      color: data.color || "#7c3aed",
      updatedAt:
        data.updatedAt instanceof Date
          ? data.updatedAt
          : new Date(data.updatedAt),
    });
  }

  update(props: Partial<Omit<ICreditCard, "id" | "userId">>): CreditCard {
    if (props.name !== undefined && props.name.length < 3)
      throw new Error("Nome deve ter ao menos 3 caracteres");
    if (props.creditLimit !== undefined && props.creditLimit <= 0)
      throw new Error("Limite deve ser maior que zero");
    if (
      props.closingDay !== undefined &&
      (props.closingDay < 1 || props.closingDay > 28)
    )
      throw new Error("Dia de fechamento deve ser entre 1 e 28");
    if (
      props.dueDay !== undefined &&
      (props.dueDay < 1 || props.dueDay > 28)
    )
      throw new Error("Dia de vencimento deve ser entre 1 e 28");

    return new CreditCard({
      id: this.id,
      userId: this.userId,
      name: props.name ?? this.name,
      creditLimit: props.creditLimit ?? this.creditLimit,
      closingDay: props.closingDay ?? this.closingDay,
      dueDay: props.dueDay ?? this.dueDay,
      color: props.color ?? this.color,
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  toJSON(): ICreditCard {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      creditLimit: this.creditLimit,
      closingDay: this.closingDay,
      dueDay: this.dueDay,
      color: this.color,
      updatedAt: this.updatedAt,
    };
  }
}
