import { TransactionRemovalScope } from "@/domain/enums/transaction/TransactionRemovalScope";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { IRepository } from "@/domain/interfaces/repository/repository";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { Transaction } from "@/domain/entities/transaction/Transaction";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { Account } from "@/domain/entities/account/Account";

export class RemoveTransactionUsecase {
  constructor(
    private readonly transactionRepository: IRepository<ITransaction>,
    private readonly accountRepository: IRepository<IAccount>
  ) {}

  async execute(
    transactionId: string,
    scopo: TransactionRemovalScope,
    year?: number,
    month?: number
  ) {
    const transactionData = await this.transactionRepository.findById(
      transactionId
    );

    if (!transactionData) {
      throw new Error("Transaction not found");
    }

    const transaction = Transaction.fromData(transactionData);

    const accountData = await this.accountRepository.findById(
      transaction.accountId
    );

    if (!accountData) {
      throw new Error("Account not found");
    }

    const account = Account.fromData(accountData);

    let message = "";

    switch (scopo) {
      case TransactionRemovalScope.ALL:
        await this.removeAll(transaction, account);
        message = `Transaction ${transaction.id} and all its occurrences were removed successfully.`;
        break;
      case TransactionRemovalScope.CURRENT_MONTH:
        if (!year || !month) {
          throw new Error("Year and Month required");
        }
        await this.removeCurrentMonth(transaction, account, year, month);
        message = `Occurrence for ${month}/${year} of transaction ${transaction.id} was removed successfully.`;
        break;
      case TransactionRemovalScope.FROM_MONTH_ONWARD:
        if (!year || !month) {
          throw new Error("Year and Month required");
        }
        await this.removeFromMonthOnward(transaction, account, year, month);
        message = `Occurrences from ${month}/${year} onward for transaction ${transaction.id} were removed successfully.`;
        break;
    }

    await this.accountRepository.update(account.id, account);

    return message;
  }

  private async removeAll(transaction: Transaction, account: Account) {
    const isPaymentPaid = this.hasPaymentIsPaid(transaction);

    if (isPaymentPaid) {
      const valuesRemoved = this.totalValuesIsPaidDeleted(transaction);
      this.adjustBalance(transaction, account, valuesRemoved);
    }

    const updatedTransactionsIds = account.transactionsIds.filter(
      (id) => id !== transaction.id
    );
    account.update({ transactionsIds: updatedTransactionsIds });

    await this.transactionRepository.delete(transaction.id);
  }

  private async removeCurrentMonth(
    transaction: Transaction,
    account: Account,
    year: number,
    month: number
  ) {
    const { kind, amount, paymentHistory, id, recurrence, dueDate } =
      transaction;

    if (kind === TransactionKind.INSTALLMENT) {
      let paymentIndex = paymentHistory.findIndex(
        (payment) =>
          payment.dueDate.getUTCFullYear() === year &&
          payment.dueDate.getUTCMonth() + 1 === month
      );

      if (paymentIndex === -1) {
        throw new Error(`No occurrence found for ${month}/${year}.`);
      }

      const paymentEntry = paymentHistory[paymentIndex];
      if (paymentEntry.isPaid) {
        this.adjustBalance(transaction, account, amount);
      }

      const excludedInstallments = recurrence.excludedInstallments || [];
      const updatedExcluded = [...excludedInstallments, paymentIndex + 1];

      const newTransaction = transaction.update({
        recurrence: {
          ...recurrence,
          excludedInstallments: updatedExcluded,
        },
      });

      await this.transactionRepository.update(id, newTransaction);
    } else if (kind === TransactionKind.FIXED) {
      let excludes = [];

      if (!recurrence.excludedFixeds) {
        excludes = recurrence.excludedFixeds = [{ year, month }];
      } else {
        excludes = recurrence.excludedFixeds = [
          ...recurrence.excludedFixeds,
          { year, month },
        ];
      }

      const hasPayment = paymentHistory
        .filter(
          (payment) =>
            payment.dueDate.getFullYear() === year &&
            payment.dueDate.getMonth() + 1 === month
        )
        .some((payment) => payment.isPaid);

      if (hasPayment) {
        this.adjustBalance(transaction, account, transaction.amount);
      }

      const newTransaction = transaction.update({
        ...transaction,
        recurrence: {
          ...recurrence,
          excludedFixeds: excludes,
        },
      });

      await this.transactionRepository.update(id, newTransaction);
    }
  }

  private async removeFromMonthOnward(
    transaction: Transaction,
    account: Account,
    year: number,
    month: number
  ) {
    const { recurrence, dueDate, id } = transaction;
    const valuesRemoved = this.totalValuesIsPaidDeleted(
      transaction,
      year,
      month
    );

    if (valuesRemoved > 0) {
      this.adjustBalance(transaction, account, valuesRemoved);
    }

    const newEndDate = new Date(
      Date.UTC(year, month - 1, dueDate.getUTCDate())
    );
    newEndDate.setUTCDate(newEndDate.getUTCDate() - 1);

    if (newEndDate < dueDate) {
      await this.transactionRepository.delete(id);
      const updatedTransactionsIds = account.transactionsIds.filter(
        (tId) => tId !== id
      );
      account.update({ transactionsIds: updatedTransactionsIds });
      return;
    }

    const newTransaction = transaction.update({
      recurrence: {
        ...recurrence,
        endDate: newEndDate,
      },
    });

    await this.transactionRepository.update(id, newTransaction);
  }

  private totalValuesIsPaidDeleted(
    transaction: Transaction,
    year?: number,
    month?: number
  ): number {
    if (!year || !month) {
      return transaction.paymentHistory
        .filter((payment) => payment.isPaid)
        .reduce((acc, payment) => acc + payment.amount, 0);
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));

    return transaction.paymentHistory
      .filter((payment) => payment.isPaid && payment.dueDate >= startDate)
      .reduce((acc, payment) => acc + payment.amount, 0);
  }

  private hasPaymentIsPaid(transaction: Transaction) {
    return transaction.paymentHistory.some((payment) => payment.isPaid);
  }

  private adjustBalance(
    transaction: Transaction,
    account: Account,
    valuesRemoved: number
  ) {
    if (transaction.type === TransactionTypes.DEPOSIT) {
      account.update({
        ...account,
        balance: account.balance - valuesRemoved,
      });
    }
    if (transaction.type === TransactionTypes.WITHDRAW) {
      account.update({
        ...account,
        balance: account.balance + valuesRemoved,
      });
    }
  }
}
