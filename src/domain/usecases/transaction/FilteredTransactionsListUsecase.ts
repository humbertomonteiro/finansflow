import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

export class FilteredTransactionsListUsecase {
  private readonly nearbyDaysThreshold = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

  async execute(
    allTransactions: ITransaction[],
    filter: "all" | "paid" | "unpaid" | "nearby" | "overdue" = "all",
    year?: number,
    month?: number
  ): Promise<ITransaction[]> {
    try {
      // Validate year and month if provided
      if (year && month) {
        if (month < 1 || month > 12) throw new Error("Invalid month");
        if (year < 2000) throw new Error("Invalid year");

        // Early return for future overdue transactions
        if (filter === "overdue") {
          const filterDate = new Date(Date.UTC(year, month - 1, 1));
          if (filterDate > new Date()) return [];
        }

        const transactions = this.getTransactionsForMonth(
          allTransactions,
          year,
          month
        );
        return this.applyFilter(transactions, filter);
      }

      return this.applyFilter(allTransactions, filter);
    } catch (error) {
      console.error("Error filtering transactions:", error);
      return [];
    }
  }

  private getTransactionsForMonth(
    transactions: ITransaction[],
    year: number,
    month: number
  ): ITransaction[] {
    const result: ITransaction[] = [];

    for (const transaction of transactions) {
      switch (transaction.kind) {
        case TransactionKind.SIMPLE:
          result.push(
            ...this.processSimpleTransaction(transaction, year, month)
          );
          break;
        case TransactionKind.INSTALLMENT:
          result.push(
            ...this.processInstallmentTransaction(transaction, year, month)
          );
          break;
        case TransactionKind.FIXED:
          result.push(
            ...this.processFixedTransaction(transaction, year, month)
          );
          break;
      }
    }

    return result;
  }

  private processSimpleTransaction(
    transaction: ITransaction,
    year: number,
    month: number
  ): ITransaction[] {
    const dueDate = new Date(transaction.dueDate);
    if (dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month) {
      return [
        {
          ...transaction,
          dueDate: new Date(dueDate),
        },
      ];
    }
    return [];
  }

  private processInstallmentTransaction(
    transaction: ITransaction,
    year: number,
    month: number
  ): ITransaction[] {
    const result: (ITransaction & { installmentsNumber: number })[] = [];
    const recurrence = transaction.recurrence || {};
    const excludedInstallments = recurrence.excludedInstallments || [];

    transaction.paymentHistory.forEach((payment, index) => {
      const installmentNumber = index + 1;

      // Skip excluded installments
      if (excludedInstallments.includes(installmentNumber)) return;

      const paymentDate = new Date(payment.dueDate);
      if (
        paymentDate.getFullYear() === year &&
        paymentDate.getMonth() + 1 === month
      ) {
        result.push({
          ...transaction,
          id: transaction.id,
          amount: payment.amount,
          dueDate: new Date(paymentDate),
          description: transaction.description,
          paymentHistory: [payment],
          recurrence: transaction.recurrence,
          categoryId: transaction.categoryId,
          accountId: transaction.accountId,
          kind: transaction.kind,
          installmentsNumber: installmentNumber,
        });
      }
    });

    return result;
  }

  private processFixedTransaction(
    transaction: ITransaction,
    year: number,
    month: number
  ): ITransaction[] {
    const result: ITransaction[] = [];
    const dueDate = new Date(transaction.dueDate);
    const recurrence = transaction.recurrence || {};
    const endDate =
      recurrence.endDate ||
      new Date(Date.UTC(year + 10, month - 1, dueDate.getUTCDate()));

    let currentDate = new Date(dueDate);
    let occurrenceIndex = 0;

    function getSafeUTCDate(year: number, month: number, day: number): Date {
      const tentative = new Date(Date.UTC(year, month, day));
      if (tentative.getUTCMonth() !== month) {
        // overflow: mês pulou, então usar o último dia do mês
        return new Date(Date.UTC(year, month + 1, 0));
      }
      return tentative;
    }

    const originalDay = dueDate.getUTCDate();

    while (currentDate <= endDate && currentDate.getUTCFullYear() <= year) {
      if (
        currentDate.getUTCFullYear() === year &&
        currentDate.getUTCMonth() + 1 === month
      ) {
        result.push({
          ...transaction,
          id: `${transaction.id}-fixed-${occurrenceIndex}`,
          dueDate: new Date(currentDate),
          description: transaction.description || "",
        });
        break;
      }

      const nextMonth = currentDate.getUTCMonth() + 1;
      const nextYear =
        nextMonth > 11
          ? currentDate.getUTCFullYear() + 1
          : currentDate.getUTCFullYear();
      const normalizedMonth = nextMonth % 12;

      currentDate = getSafeUTCDate(nextYear, normalizedMonth, originalDay + 1);
      occurrenceIndex++;
    }

    return result;
  }

  private applyFilter(
    transactions: ITransaction[],
    filter: "all" | "paid" | "unpaid" | "nearby" | "overdue"
  ): ITransaction[] {
    const today = new Date();

    return transactions
      .filter((transaction) => {
        const dueDate = new Date(transaction.dueDate);
        const isPaid = transaction.paymentHistory.some(
          (payment) =>
            payment.dueDate.getFullYear() === dueDate.getFullYear() &&
            payment.dueDate.getMonth() === dueDate.getMonth() &&
            payment.dueDate.getDate() === dueDate.getDate() &&
            payment.isPaid
        );

        const isNearby =
          Math.abs(dueDate.getTime() - today.getTime()) <=
            this.nearbyDaysThreshold && dueDate >= today;

        switch (filter) {
          case "paid":
            return isPaid;
          case "unpaid":
            return !isPaid;
          case "nearby":
            return isNearby;
          case "overdue":
            return !isPaid && dueDate < today;
          default:
            return true;
        }
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
}
