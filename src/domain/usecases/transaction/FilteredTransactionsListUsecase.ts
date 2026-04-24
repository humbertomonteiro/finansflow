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
      if (year && month) {
        if (month < 1 || month > 12) throw new Error("Invalid month");
        if (year < 2000) throw new Error("Invalid year");

        if (filter === "overdue") {
          const filterDate = new Date(year, month - 1, 1);
          if (filterDate > new Date()) return [];
        }

        const transactions = this.getTransactionsForMonth(allTransactions, year, month);
        return this.applyFilter(transactions, filter);
      }

      // Para overdue sem mês selecionado, expande corretamente todas as ocorrências passadas
      if (filter === "overdue") {
        return this.applyFilter(this.getTransactionsUpToToday(allTransactions), filter);
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

    const occurrenceDate = new Date(year, month - 1, dueDate.getDate());

    const isAfterStartDate = occurrenceDate >= dueDate;
    const isBeforeEndDate = !endDate || occurrenceDate <= endDate;

    const isExcluded = excludedFixeds.some(
      (excludedDate: { year: number; month: number }) =>
        excludedDate.year === year && excludedDate.month === month
    );

    if (isAfterStartDate && isBeforeEndDate && !isExcluded) {
      // Busca o payment gravado para este mês/ano específico.
      // Para FIXED, o paymentHistory só cresce quando o mês é pago —
      // meses futuros ainda não têm entrada no array.
      const paymentForMonth = transaction.paymentHistory.find((p) => {
        const d = new Date(p.dueDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      // Se não existe payment para este mês, cria um registro virtual
      // com isPaid: false apenas para a UI — não é gravado no banco.
      const effectivePayment = paymentForMonth ?? {
        isPaid: false,
        dueDate: occurrenceDate,
        paidAt: null,
        amount: transaction.amount,
      };

      result.push({
        ...transaction,
        dueDate: occurrenceDate,
        description: transaction.description || "",
        // Passa SOMENTE o payment deste mês, igual ao que INSTALLMENT já faz.
        // Garante que paymentHistory[0] seja sempre o mês em exibição,
        // não o primeiro pagamento histórico (que estaria isPaid: true).
        paymentHistory: [effectivePayment],
      });
    }

    return result;
  }

  // Após getTransactionsForMonth ou getTransactionsUpToToday, paymentHistory
  // tem sempre um único entry por transação — usa isPaid direto sem comparar datas,
  // evitando falsos negativos causados por diferença de fuso UTC vs local.
  private applyFilter(
    transactions: ITransaction[],
    filter: "all" | "paid" | "unpaid" | "nearby" | "overdue"
  ): ITransaction[] {
    const today = new Date();

    return transactions
      .filter((transaction) => {
        const dueDate = new Date(transaction.dueDate);
        const isPaid = transaction.paymentHistory[0]?.isPaid ?? false;

        const isNearby =
          dueDate >= today &&
          dueDate.getTime() - today.getTime() <= this.nearbyDaysThreshold &&
          !isPaid;

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

  // Expande FIXED e INSTALLMENT para todas as ocorrências até hoje,
  // respeitando exclusões e datas de fim. Usado pelo filtro overdue.
  private getTransactionsUpToToday(transactions: ITransaction[]): ITransaction[] {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const result: ITransaction[] = [];

    for (const transaction of transactions) {
      if (transaction.kind === TransactionKind.SIMPLE) {
        result.push(transaction);
      } else if (transaction.kind === TransactionKind.INSTALLMENT) {
        const excludedInstallments = transaction.recurrence?.excludedInstallments || [];
        transaction.paymentHistory.forEach((payment, index) => {
          if (excludedInstallments.includes(index + 1)) return;
          const paymentDate = new Date(payment.dueDate);
          if (paymentDate <= today) {
            result.push({ ...transaction, dueDate: paymentDate, paymentHistory: [payment] });
          }
        });
      } else if (transaction.kind === TransactionKind.FIXED) {
        const startDate = new Date(transaction.dueDate);
        let y = startDate.getFullYear();
        let m = startDate.getMonth() + 1;
        const day = startDate.getDate();
        const excludedFixeds = transaction.recurrence?.excludedFixeds || [];
        const endDate = transaction.recurrence?.endDate
          ? new Date(transaction.recurrence.endDate)
          : null;

        while (y < currentYear || (y === currentYear && m <= currentMonth)) {
          const isExcluded = excludedFixeds.some(
            (ef: { year: number; month: number }) => ef.year === y && ef.month === m
          );
          const occurrenceDate = new Date(y, m - 1, day);
          const isBeforeEndDate = !endDate || occurrenceDate <= endDate;

          if (!isExcluded && isBeforeEndDate) {
            const paymentForMonth = transaction.paymentHistory.find((p) => {
              const d = new Date(p.dueDate);
              return d.getFullYear() === y && d.getMonth() + 1 === m;
            });
            const effectivePayment = paymentForMonth ?? {
              isPaid: false,
              dueDate: occurrenceDate,
              paidAt: null,
              amount: transaction.amount,
            };
            result.push({ ...transaction, dueDate: occurrenceDate, paymentHistory: [effectivePayment] });
          }

          m++;
          if (m > 12) { m = 1; y++; }
        }
      }
    }

    return result;
  }
}
