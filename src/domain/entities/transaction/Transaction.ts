import { IPaymentHistory } from "../../interfaces/transaction/IPaymentHistory";
import { IRecurrence } from "../../interfaces/transaction/IRecurrence";
import { ITransaction } from "../../interfaces/transaction/ITransaction";
import { generateUID } from "../../../utils/GenerateUid";
import { TransactionTypes } from "../../enums/transaction/TransactionTypes";
import {
  InvalidAmountError,
  InvalidTransactionKindError,
  InvalidTransactionTypeError,
  //   MissingRecurrenceError,
} from "../../../errors/transaction/TransactionErrors";
import { TransactionKind } from "../../enums/transaction/TransactionKind";

export class Transaction implements ITransaction {
  public readonly id: string;
  public readonly amount: number;
  public readonly type: TransactionTypes;
  public readonly dueDate: Date;
  public readonly description?: string;
  public readonly categoryId: string;
  public readonly accountId: string;
  public readonly kind: TransactionKind;
  public readonly recurrence: IRecurrence;
  public readonly paymentHistory: IPaymentHistory[];

  private constructor(props: ITransaction) {
    this.id = props.id;
    this.amount = props.amount;
    this.type = props.type;
    this.dueDate = props.dueDate;
    this.description = props.description;
    this.categoryId = props.categoryId;
    this.accountId = props.accountId;
    this.kind = props.kind;
    this.recurrence = props.recurrence;
    this.paymentHistory = props.paymentHistory;
  }

  static create(
    props: Omit<ITransaction, "id" | "paymentHistory">
  ): Transaction {
    this.validate(props);

    const paymentHistory = this.generatePaymentHistory(
      props.kind,
      props.recurrence,
      props.dueDate,
      props.amount
    );

    return new Transaction({
      id: generateUID(),
      ...props,
      paymentHistory,
    });
  }

  static fromData(data: ITransaction): Transaction {
    return new Transaction({ ...data });
  }

  update(props: Partial<Omit<ITransaction, "id">>): Transaction {
    const mergedProps = {
      amount: props.amount ?? this.amount,
      type: props.type ?? this.type,
      dueDate: props.dueDate ?? this.dueDate,
      description: props.description ?? this.description,
      categoryId: props.categoryId ?? this.categoryId,
      accountId: props.accountId ?? this.accountId,
      kind: props.kind ?? this.kind,
      recurrence: props.recurrence ?? this.recurrence,
      paymentHistory: props.paymentHistory ?? this.paymentHistory,
    };

    Transaction.validate(mergedProps);

    return new Transaction({
      id: this.id,
      ...mergedProps,
    });
  }

  private static validate(
    props: Omit<ITransaction, "id" | "paymentHistory">
  ): void {
    if (props.amount <= 0) throw new InvalidAmountError();
    if (!Object.values(TransactionTypes).includes(props.type))
      throw new InvalidTransactionTypeError();

    // if (!props.recurrence) throw new MissingRecurrenceError();

    if (!Object.values(TransactionKind).includes(props.kind))
      throw new InvalidTransactionKindError();
  }

  addPaymentRecord(payment: IPaymentHistory): Transaction {
    return new Transaction({
      ...this,
      paymentHistory: [...this.paymentHistory, payment],
    });
  }

  generateNextPayment(): Transaction {
    if (this.kind !== TransactionKind.FIXED) {
      return this;
    }

    // Verifica se há data final e se já passou
    if (this.recurrence.endDate && this.recurrence.endDate < new Date()) {
      return this;
    }

    const lastPayment = this.paymentHistory.reduce(
      (latest, current) =>
        current.dueDate > (latest?.dueDate || new Date(0)) ? current : latest,
      null as IPaymentHistory | null
    );

    const lastDueDate = lastPayment?.dueDate || this.dueDate;
    const nextDueDate = Transaction.addMonths(lastDueDate, 1);

    // Verifica se excede a data final
    if (this.recurrence.endDate && nextDueDate > this.recurrence.endDate) {
      return this;
    }

    return this.addPaymentRecord({
      isPaid: false,
      dueDate: nextDueDate,
      paidAt: null,
      amount: this.amount,
    });
  }

  private static generatePaymentHistory(
    kind: TransactionKind,
    recurrence: IRecurrence,
    dueDate: Date,
    amount: number
  ): IPaymentHistory[] {
    switch (kind) {
      case TransactionKind.SIMPLE:
        return [this.createPaymentRecord(dueDate, amount)];

      case TransactionKind.INSTALLMENT:
        return this.generateInstallmentHistory(recurrence, dueDate, amount);

      case TransactionKind.FIXED:
        return this.generateFixedRecurrenceHistory(recurrence, dueDate, amount);

      default:
        throw new InvalidTransactionKindError();
    }
  }

  private static createPaymentRecord(
    dueDate: Date,
    amount: number
  ): IPaymentHistory {
    return {
      isPaid: false,
      dueDate,
      paidAt: null,
      amount,
    };
  }

  private static generateInstallmentHistory(
    recurrence: IRecurrence,
    startDate: Date,
    amount: number
  ): IPaymentHistory[] {
    if (!recurrence.installmentsCount || recurrence.installmentsCount <= 0) {
      throw new Error(
        "Installment interval is required for installment transactions"
      );
    }

    const history: IPaymentHistory[] = [];
    for (let i = 0; i < recurrence.installmentsCount; i++) {
      const installmentDate = this.addMonths(startDate, i);
      history.push(
        this.createPaymentRecord(
          installmentDate,
          amount / recurrence.installmentsCount
        )
      );
    }
    return history;
  }

  private static generateFixedRecurrenceHistory(
    recurrence: IRecurrence,
    startDate: Date,
    amount: number
  ): IPaymentHistory[] {
    if (recurrence.endDate) {
      const monthsCount =
        this.monthsBetweenDates(startDate, recurrence.endDate) + 1;
      const history: IPaymentHistory[] = [];

      for (let i = 0; i < monthsCount; i++) {
        const paymentDate = this.addMonths(startDate, i);
        history.push(this.createPaymentRecord(paymentDate, amount));
      }
      return history;
    }

    // Para transações fixas sem data final
    return [this.createPaymentRecord(startDate, amount)];
  }

  markAsPaid(paymentIndex: number, paidAt: Date = new Date()): Transaction {
    if (paymentIndex < 0 || paymentIndex >= this.paymentHistory.length) {
      return this;
    }

    const updatedHistory = [...this.paymentHistory];
    updatedHistory[paymentIndex] = {
      ...updatedHistory[paymentIndex],
      isPaid: true,
      paidAt,
    };

    return new Transaction({
      ...this,
      paymentHistory: updatedHistory,
    });
  }

  toJSON(): ITransaction {
    return { ...this };
  }

  // Métodos utilitários para manipulação de datas
  private static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);

    // Ajuste para casos onde o dia do mês não existe no novo mês
    const originalDay = date.getDate();
    const newDay = result.getDate();

    if (originalDay !== newDay) {
      result.setDate(0); // Vai para o último dia do mês anterior
    }

    return result;
  }

  private static monthsBetweenDates(startDate: Date, endDate: Date): number {
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months += endDate.getMonth() - startDate.getMonth();

    // Ajusta se o dia do final for menor que o dia inicial
    if (endDate.getDate() < startDate.getDate()) {
      months--;
    }

    return months;
  }
}
