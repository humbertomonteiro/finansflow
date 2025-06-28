import { IRepository } from "@/domain/interfaces/repository/repository";
import { Transaction } from "@/domain/entities/transaction/Transaction";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

export class EditTransactionUseCase {
  constructor(
    private readonly transactionRepository: IRepository<Transaction>
  ) {}

  async execute(
    transactionId: string,
    newTransaction: Partial<Transaction>
  ): Promise<Transaction> {
    const transactionData = await this.transactionRepository.findById(
      transactionId
    );

    if (!transactionData) {
      throw new Error("Transaction not found");
    }

    const transaction = Transaction.fromData(transactionData);

    if (
      newTransaction.amount !== undefined &&
      newTransaction.amount !== transaction.amount
    ) {
      console.log(
        `Amount changed from ${transaction.amount} to ${newTransaction.amount}. Updating payment history...`
      );

      let newInstallmentAmount = newTransaction.amount;
      if (
        (transaction.kind === TransactionKind.INSTALLMENT ||
          transaction.kind === TransactionKind.FIXED) &&
        transaction.recurrence?.installmentsCount
      ) {
        newInstallmentAmount =
          newTransaction.amount / transaction.recurrence.installmentsCount;
      }

      const updatedPaymentHistory = transaction.paymentHistory.map(
        (payment) => {
          if (!payment.isPaid) {
            return {
              ...payment,
              amount: newInstallmentAmount,
            };
          }
          return payment;
        }
      );

      newTransaction = {
        ...newTransaction,
        paymentHistory: updatedPaymentHistory,
      };
    }

    const transactionUpdate = transaction.update(newTransaction);

    const updatedTransaction = await this.transactionRepository.update(
      transactionId,
      transactionUpdate
    );

    return updatedTransaction;
  }
}
