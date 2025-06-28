import { IAccount } from "../../interfaces/account/IAccount";
import { generateUID } from "../../../utils/GenerateUid";
import { InvalidAccountNameError } from "../../../errors/account/AccountErrors";

export class Account implements IAccount {
  public readonly id: string;
  public readonly name: string;
  public readonly balance: number;
  public readonly updatedAt: Date;
  public readonly transactionsIds: string[];

  private constructor(props: IAccount) {
    this.id = props.id;
    this.name = props.name;
    this.balance = props.balance;
    this.updatedAt = props.updatedAt;
    this.transactionsIds = props.transactionsIds;
  }

  static create(props: Omit<IAccount, "id">): Account {
    if (props.name.length < 3) throw new InvalidAccountNameError();

    return new Account({
      id: generateUID(),
      ...props,
    });
  }

  static fromData(data: IAccount): Account {
    return new Account({
      id: data.id,
      name: data.name,
      balance: data.balance || 0,
      transactionsIds: data.transactionsIds || [],
      updatedAt:
        data.updatedAt instanceof Date
          ? data.updatedAt
          : new Date(data.updatedAt),
    });
  }

  update(props: Partial<Omit<IAccount, "id">>): Account {
    if (props.name && props.name.length < 3)
      throw new InvalidAccountNameError();

    const mergedProps = {
      name: props.name ?? this.name,
      balance: props.balance ?? this.balance,
      updatedAt: props.updatedAt ?? this.updatedAt,
      transactionsIds: props.transactionsIds ?? this.transactionsIds,
    };

    return new Account({
      id: this.id,
      ...mergedProps,
    });
  }

  addTransaction(transactionId: string): Account {
    if (this.transactionsIds.includes(transactionId)) return this;

    return new Account({
      id: this.id,
      name: this.name,
      balance: this.balance,
      updatedAt: this.updatedAt,
      transactionsIds: [...this.transactionsIds, transactionId],
    });
  }

  removeTransaction(transactionId: string): Account {
    if (!this.transactionsIds.includes(transactionId)) return this;
    return new Account({
      id: this.id,
      name: this.name,
      balance: this.balance,
      updatedAt: this.updatedAt,
      transactionsIds: this.transactionsIds.filter(
        (id) => id !== transactionId
      ),
    });
  }

  toJSON(): IAccount {
    return {
      id: this.id,
      name: this.name,
      balance: this.balance,
      updatedAt: this.updatedAt,
      transactionsIds: this.transactionsIds,
    };
  }
}
