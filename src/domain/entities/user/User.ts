import { IUser } from "../../interfaces/user/IUser";
import { generateUID } from "../../../utils/GenerateUid";

import {
  InvalidNameError,
  InvalidEmailError,
  // InvalidPasswordError,
} from "../../../errors/user/UserErrors";

export class User implements IUser {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly accountsIds: string[];
  public readonly categoriesIds: string[];
  private password: string;

  private constructor(props: IUser & { password: string }) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.accountsIds = props.accountsIds;
    this.categoriesIds = props.categoriesIds;
  }

  getPassword(): string {
    return this.password;
  }

  static create(props: Omit<IUser, "id"> & { password: string }): User {
    User.validate(props);

    return new User({
      id: generateUID(),
      ...props,
    });
  }

  static fromData(data: IUser & { password: string }): User {
    User.validate({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    return new User({
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      accountsIds: data.accountsIds || [],
      categoriesIds: data.categoriesIds || [],
    });
  }

  update(props: Partial<Omit<IUser, "id"> & { password: string }>): User {
    const mergedProps = {
      name: props.name ?? this.name,
      email: props.email ?? this.email,
      password: props.password ?? this.password,
      accountsIds: props.accountsIds ?? this.accountsIds,
      categoriesIds: props.categoriesIds ?? this.categoriesIds,
    };

    User.validate(mergedProps);

    return new User({
      id: this.id,
      ...mergedProps,
    });
  }

  private static validate(props: {
    name: string;
    email: string;
    password: string;
  }): void {
    if (!props.name.trim()) throw new InvalidNameError("Name is required");
    if (props.name.length < 3)
      throw new InvalidNameError("Name must be at least 3 characters long");
    if (!props.email.trim()) throw new InvalidEmailError("Email is required");
    if (!props.email.includes("@"))
      throw new InvalidEmailError("Invalid email format, must contain @");
    // if (props.password.trim().length === 0) throw new InvalidPasswordError('Password is required');
    // if (props.password.length < 8) throw new InvalidPasswordError('Password must be at least 8 characters long');
    // if (props.password.length > 20) throw new InvalidPasswordError('Password must be less than 20 characters long');
  }

  addAccount(accountId: string): User {
    if (this.accountsIds.includes(accountId)) return this;
    return new User({
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      accountsIds: [...this.accountsIds, accountId],
      categoriesIds: this.categoriesIds,
    });
  }

  removeAccount(accountId: string): User {
    if (!this.accountsIds.includes(accountId)) return this;
    return new User({
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      accountsIds: this.accountsIds.filter((id) => id !== accountId),
      categoriesIds: this.categoriesIds,
    });
  }

  addCategory(categoryId: string): User {
    if (this.categoriesIds.includes(categoryId)) return this;
    return new User({
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      accountsIds: this.accountsIds,
      categoriesIds: [...this.categoriesIds, categoryId],
    });
  }

  removeCategory(categoryId: string): User {
    if (!this.categoriesIds.includes(categoryId)) return this;
    return new User({
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      accountsIds: this.accountsIds,
      categoriesIds: this.categoriesIds.filter((id) => id !== categoryId),
    });
  }

  toJSON(): IUser {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      accountsIds: this.accountsIds,
      categoriesIds: this.categoriesIds,
    };
  }
}
