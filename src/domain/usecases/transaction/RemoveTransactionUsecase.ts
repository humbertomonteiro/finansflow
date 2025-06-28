import { IRepository } from "../../interfaces/repository/repository";
import { ITransaction } from "../../interfaces/transaction/ITransaction";
import { IAccount } from "../../interfaces/account/IAccount";
import { TransactionTypes } from "../../enums/transaction/TransactionTypes";
import { TransactionKind } from "../../enums/transaction/TransactionKind";
import { TransactionRemovalScope } from "../../enums/transaction/TransactionRemovalScope";
import { calculateMonthsBetween } from "../../../utils/dateUtils";
import { Transaction } from "@/domain/entities/transaction/Transaction";
import { Account } from "@/domain/entities/account/Account";

export class RemoveTransactionUsecase {
  constructor(
    private readonly transactionRepository: IRepository<ITransaction>,
    private readonly accountRepository: IRepository<IAccount>
  ) {}

  async execute(
    transactionId: string,
    scope: TransactionRemovalScope = TransactionRemovalScope.ALL,
    year?: number,
    month?: number
  ): Promise<string> {
    try {
      const transactionData = await this.transactionRepository.findById(
        transactionId
      );

      if (!transactionData) throw new Error("Transaction not found");

      const transaction = Transaction.fromData(transactionData);

      const accountData = await this.accountRepository.findById(
        transaction.accountId
      );
      if (!accountData) throw new Error("Account not found");

      const account = Account.fromData(accountData);

      if (year && month) {
        if (month < 1 || month > 12 || year < 2000) {
          throw new Error("Invalid month or year");
        }
      }

      let updatedBalance = account.balance;
      let transactionsIds = account.transactionsIds;
      let updatedTransaction: ITransaction | null = null;
      let message = "";

      const recurrence = transaction.recurrence;
      const dueDate = transaction.dueDate;

      if (
        transaction.kind === TransactionKind.SIMPLE ||
        scope === TransactionRemovalScope.ALL
      ) {
        const amount =
          transaction.kind === TransactionKind.INSTALLMENT
            ? transaction.amount * (recurrence.installmentsCount || 1)
            : transaction.amount;

        if (transaction.type === TransactionTypes.DEPOSIT) {
          updatedBalance -= amount;
        } else if (transaction.type === TransactionTypes.WITHDRAW) {
          updatedBalance += amount;
        }

        transactionsIds = transactionsIds.filter((id) => id !== transactionId);
        await this.transactionRepository.delete(transactionId);
        message = `Transaction ${transactionId} removed successfully`;
      } else if (transaction.kind === TransactionKind.INSTALLMENT) {
        if (!year || !month) {
          throw new Error(
            "Year and month are required for INSTALLMENT removal"
          );
        }

        const installmentCount = recurrence.installmentsCount || 1;
        const amountPerInstallment = transaction.amount;
        const endDate =
          recurrence.endDate ||
          new Date(
            Date.UTC(
              dueDate.getUTCFullYear(),
              dueDate.getUTCMonth() + installmentCount,
              dueDate.getUTCDate()
            )
          );

        if (scope === TransactionRemovalScope.CURRENT_MONTH) {
          const installmentIndex =
            (year - dueDate.getUTCFullYear()) * 12 +
            (month - (dueDate.getUTCMonth() + 1));
          if (
            installmentIndex < 0 ||
            installmentIndex >= installmentCount ||
            new Date(Date.UTC(year, month - 1, dueDate.getUTCDate())) > endDate
          ) {
            throw new Error("No installment found for the specified month");
          }

          if (transaction.type === TransactionTypes.DEPOSIT) {
            updatedBalance -= amountPerInstallment;
          } else if (transaction.type === TransactionTypes.WITHDRAW) {
            updatedBalance += amountPerInstallment;
          }

          const excludedInstallments = recurrence.excludedInstallments || [];
          if (!excludedInstallments.includes(installmentIndex + 1)) {
            excludedInstallments.push(installmentIndex + 1);
          }

          updatedTransaction = transaction.update({
            amount: transaction.amount,
            type: transaction.type,
            dueDate: transaction.dueDate,
            description: transaction.description,
            categoryId: transaction.categoryId,
            accountId: transaction.accountId,
            recurrence: { ...recurrence, excludedInstallments },
          });

          await this.transactionRepository.update(
            transactionId,
            updatedTransaction
          );
          message = `Installment ${
            installmentIndex + 1
          } of transaction ${transactionId} for ${year}-${month} removed successfully`;
        } else if (scope === TransactionRemovalScope.FROM_MONTH_ONWARD) {
          const startIndex =
            (year - dueDate.getUTCFullYear()) * 12 +
            (month - (dueDate.getUTCMonth() + 1));
          if (startIndex < 0 || startIndex >= installmentCount) {
            throw new Error(
              "No installments found from the specified month onward"
            );
          }

          const remainingInstallments = installmentCount - startIndex;
          const totalAmount = amountPerInstallment * remainingInstallments;

          if (transaction.type === TransactionTypes.DEPOSIT) {
            updatedBalance -= totalAmount;
          } else if (transaction.type === TransactionTypes.WITHDRAW) {
            updatedBalance += totalAmount;
          }

          const newEndDate = new Date(
            Date.UTC(year, month - 2, dueDate.getUTCDate())
          );
          updatedTransaction = transaction.update({
            amount: transaction.amount,
            type: transaction.type,
            dueDate: transaction.dueDate,
            description: transaction.description,
            categoryId: transaction.categoryId,
            accountId: transaction.accountId,
            recurrence: { ...recurrence, endDate: newEndDate },
          });

          await this.transactionRepository.update(
            transactionId,
            updatedTransaction
          );
          message = `Installments from ${year}-${month} onward of transaction ${transactionId} removed successfully`;
        }
      } else if (transaction.kind === TransactionKind.FIXED) {
        if (!year || !month) {
          throw new Error("Year and month are required for FIXED removal");
        }

        const amount = transaction.amount;
        const endDate =
          recurrence.endDate ||
          new Date(
            Date.UTC(
              dueDate.getUTCFullYear() + 10,
              dueDate.getUTCMonth(),
              dueDate.getUTCDate()
            )
          );

        if (scope === TransactionRemovalScope.CURRENT_MONTH) {
          const occurrenceDate = new Date(
            Date.UTC(year, month - 1, dueDate.getUTCDate())
          );
          if (occurrenceDate < dueDate || occurrenceDate > endDate) {
            throw new Error(
              "No fixed transaction found for the specified month"
            );
          }

          if (transaction.type === TransactionTypes.DEPOSIT) {
            updatedBalance -= amount;
          } else if (transaction.type === TransactionTypes.WITHDRAW) {
            updatedBalance += amount;
          }

          message = `Fixed transaction ${transactionId} for ${year}-${month} removed successfully`;
        } else if (scope === TransactionRemovalScope.FROM_MONTH_ONWARD) {
          const startDate = new Date(
            Date.UTC(year, month - 1, dueDate.getUTCDate())
          );
          if (startDate < dueDate) {
            throw new Error(
              "No fixed transactions found from the specified month onward"
            );
          }

          const currentDate = new Date(Date.UTC(2025, 5, 1)); // Junho de 2025
          const monthsRemaining = calculateMonthsBetween(
            startDate,
            endDate,
            currentDate
          );

          const totalAmount = amount * monthsRemaining;
          if (transaction.type === TransactionTypes.DEPOSIT) {
            updatedBalance -= totalAmount;
          } else if (transaction.type === TransactionTypes.WITHDRAW) {
            updatedBalance += totalAmount;
          }

          const newEndDate = new Date(
            Date.UTC(year, month - 2, dueDate.getUTCDate())
          );
          if (newEndDate < dueDate) {
            throw new Error(
              "New end date cannot be before transaction creation"
            );
          }

          updatedTransaction = transaction.update({
            amount: transaction.amount,
            type: transaction.type,
            dueDate: transaction.dueDate,
            description: transaction.description,
            categoryId: transaction.categoryId,
            accountId: transaction.accountId,
            recurrence: { ...recurrence, endDate: newEndDate },
          });

          await this.transactionRepository.update(
            transactionId,
            updatedTransaction
          );
          message = `Fixed transactions from ${year}-${month} onward of transaction ${transactionId} removed successfully`;
        }
      }

      const updatedAccount = account.update({
        name: account.name,
        balance: updatedBalance,
        updatedAt: new Date(),
        transactionsIds,
      });

      await this.accountRepository.update(account.id, updatedAccount);
      return message;
    } catch (error) {
      throw new Error(`Failed to remove transaction: ${error}`);
    }
  }
}
