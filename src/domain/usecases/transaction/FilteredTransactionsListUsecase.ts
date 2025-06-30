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
    const endDate = recurrence.endDate || null;

    let currentDate = new Date(year, month - 1, transaction.dueDate.getDate());

    transaction.paymentHistory.forEach((payment, index) => {
      const installmentNumber = index + 1;

      if (excludedInstallments.includes(installmentNumber)) {
        console.log(
          `[ProcessInstallmentTransaction] Skipping installment ${installmentNumber} for transaction ${transaction.id} as it is excluded`
        );
        return;
      }

      const paymentDate = new Date(payment.dueDate);

      if (
        paymentDate.getFullYear() === year &&
        paymentDate.getMonth() + 1 === month &&
        (!endDate || currentDate <= endDate)
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
    const endDate = recurrence.endDate || null;

    const excludedFixeds = recurrence.excludedFixeds || [];

    const occurrenceDate = new Date(
      Date.UTC(year, month, dueDate.getUTCDate())
    );

    const isAfterStartDate = occurrenceDate >= dueDate;
    const isBeforeEndDate = !endDate || occurrenceDate <= endDate;

    const isExcluded = excludedFixeds.some(
      (excludedDate: { year: number; month: number }) =>
        excludedDate.year === year && excludedDate.month === month
    );

    if (isAfterStartDate && isBeforeEndDate && !isExcluded) {
      result.push({
        ...transaction,
        id: transaction.id,
        dueDate: occurrenceDate,
        description: transaction.description || "",
      });
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
