import { TransactionRemovalScope } from "@/domain/enums/transaction/TransactionRemovalScope";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { IRepository } from "@/domain/interfaces/repository/repository";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { Transaction } from "@/domain/entities/transaction/Transaction";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { Account } from "@/domain/entities/account/Account";

export interface BalanceUpdate {
  message: string;
  balanceUpdate: number;
  removeCurrentMonth?: RemoveCurrentMonth;
}

interface RemoveCurrentMonth {
  account: Account;
  index?: number[];
  date?: { year: number; month: number }[];
}

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
  ): Promise<BalanceUpdate> {
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
    let updatedAccount: Account = account;
    let removedObject: RemoveCurrentMonth = { account };

    switch (scopo) {
      case TransactionRemovalScope.ALL:
        updatedAccount = await this.removeAll(transaction, account);
        message = `Transaction ${transaction.id} and all its occurrences were removed successfully.`;
        break;
      case TransactionRemovalScope.CURRENT_MONTH:
        if (!year || !month) {
          throw new Error("Year and Month required");
        }
        removedObject = await this.removeCurrentMonth(
          transaction,
          account,
          year,
          month
        );

        updatedAccount = removedObject.account;

        message = `Occurrence for ${month}/${year} of transaction ${transaction.id} was removed successfully.`;
        break;
      case TransactionRemovalScope.FROM_MONTH_ONWARD:
        if (!year || !month) {
          throw new Error("Year and Month required");
        }
        updatedAccount = await this.removeFromMonthOnward(
          transaction,
          account,
          year,
          month
        );
        message = `Occurrences from ${month}/${year} onward for transaction ${transaction.id} were removed successfully.`;
        break;
    }

    await this.accountRepository.update(account.id, updatedAccount);

    return {
      message,
      balanceUpdate: updatedAccount.balance,
      removeCurrentMonth: removedObject,
    };
  }

  private async removeAll(
    transaction: Transaction,
    account: Account
  ): Promise<Account> {
    try {
      const isPaymentPaid = this.hasPaymentIsPaid(transaction);
      let currentAccountState = account;

      if (isPaymentPaid) {
        const valuesRemoved = this.totalValuesIsPaidDeleted(transaction);

        currentAccountState = this.adjustBalance(
          transaction,
          currentAccountState,
          valuesRemoved
        );
      }

      const updatedTransactionsIds = currentAccountState.transactionsIds.filter(
        (id) => id !== transaction.id
      );

      currentAccountState = currentAccountState.update({
        transactionsIds: updatedTransactionsIds,
      });

      await this.transactionRepository.delete(transaction.id);

      return currentAccountState;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async removeCurrentMonth(
    transaction: Transaction,
    account: Account,
    year: number,
    month: number
  ): Promise<RemoveCurrentMonth> {
    const { kind, amount, paymentHistory, id, recurrence } = transaction;
    let updateAccount: Account = account;

    try {
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
          updateAccount = this.adjustBalance(transaction, account, amount);
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
        return { account: updateAccount, index: updatedExcluded };
      } else {
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
          updateAccount = this.adjustBalance(
            transaction,
            account,
            transaction.amount
          );
        }

        const newTransaction = transaction.update({
          ...transaction,
          recurrence: {
            ...recurrence,
            excludedFixeds: excludes,
          },
        });

        await this.transactionRepository.update(id, newTransaction);
        return { account: updateAccount, date: excludes };
      }
    } catch (error) {
      throw error;
    }
  }

  private async removeFromMonthOnward(
    transaction: Transaction,
    account: Account,
    year: number,
    month: number
  ): Promise<Account> {
    const { recurrence, dueDate, id } = transaction;
    const valuesRemoved = this.totalValuesIsPaidDeleted(
      transaction,
      year,
      month
    );
    let updateAccount: Account = account;

    if (valuesRemoved > 0) {
      updateAccount = this.adjustBalance(transaction, account, valuesRemoved);
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
      updateAccount = account.update({
        transactionsIds: updatedTransactionsIds,
      });
      return updateAccount;
    }

    const newTransaction = transaction.update({
      recurrence: {
        ...recurrence,
        endDate: newEndDate,
      },
    });

    await this.transactionRepository.update(id, newTransaction);

    return updateAccount;
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
  ): Account {
    let updatedAccount;

    if (transaction.type === TransactionTypes.DEPOSIT) {
      updatedAccount = account.update({
        balance: account.balance - valuesRemoved,
      });
    } else if (transaction.type === TransactionTypes.WITHDRAW) {
      updatedAccount = account.update({
        balance: account.balance + valuesRemoved,
      });
    } else {
      return account;
    }

    return updatedAccount;
  }
}
