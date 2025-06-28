import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { IRepository } from "../../interfaces/repository/repository";
import { ITransaction } from "../../interfaces/transaction/ITransaction";
import { Account } from "@/domain/entities/account/Account";

export class PayerTransactionUseCase {
  constructor(
    private readonly transactionRepository: IRepository<ITransaction>,
    private readonly accountRepository: IRepository<Account>
  ) {}

  async execute(
    transactionId: string,
    year: number,
    month: number
  ): Promise<ITransaction> {
    console.log(
      `PayerTransactionUseCase: Processing payment for ID ${transactionId}, ${month}/${year}`
    );

    // Extrair ID original para transações parceladas ou fixas
    const originalTransactionId = transactionId.split("-")[0];

    const transaction = await this.transactionRepository.findById(
      originalTransactionId
    );
    if (!transaction) {
      console.warn(`Transaction ${originalTransactionId} not found`);
      throw new Error("Transaction not found");
    }

    const paymentIndex = transaction.paymentHistory.findIndex(
      (payment) =>
        payment.dueDate.getFullYear() === year &&
        payment.dueDate.getMonth() + 1 === month
    );

    if (paymentIndex !== -1) {
      // Alternar status de pagamento
      const wasPaid = transaction.paymentHistory[paymentIndex].isPaid;
      transaction.paymentHistory[paymentIndex].isPaid = !wasPaid;
      transaction.paymentHistory[paymentIndex].paidAt = !wasPaid
        ? new Date()
        : null;

      // Atualizar saldo da conta
      const paymentAmount = transaction.paymentHistory[paymentIndex].amount;
      await this.attBalance(
        paymentAmount,
        transaction.type,
        transaction.accountId,
        !wasPaid // Invertemos o status para a atualização do saldo
      );
    } else if (
      transaction.kind === TransactionKind.FIXED ||
      transaction.kind === TransactionKind.INSTALLMENT
    ) {
      // Criar nova entrada para transações fixas ou parceladas
      const dueDate = new Date(
        Date.UTC(year, month - 1, transaction.dueDate.getDate())
      );
      let paymentAmount = transaction.amount;

      // Para transações parceladas, calcular o valor da parcela
      if (transaction.kind === TransactionKind.INSTALLMENT) {
        const installmentsCount =
          transaction.recurrence?.installmentsCount || 1;
        paymentAmount = transaction.amount / installmentsCount;
      }

      transaction.paymentHistory.push({
        isPaid: true,
        dueDate,
        paidAt: new Date(),
        amount: paymentAmount,
      });

      // Atualizar saldo da conta
      await this.attBalance(
        paymentAmount,
        transaction.type,
        transaction.accountId,
        true
      );
    } else {
      console.warn(
        `No payment record found for ${month}/${year} and transaction is not FIXED or INSTALLMENT`
      );
      throw new Error("Cannot pay transaction without payment record");
    }

    const savedTransaction = await this.transactionRepository.update(
      originalTransactionId,
      transaction
    );
    console.log(`Transaction ${originalTransactionId} updated`);
    return savedTransaction;
  }

  async attBalance(
    amount: number,
    type: TransactionTypes,
    accountId: string,
    isPaying: boolean
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const accountData = await this.accountRepository.findById(accountId);
    if (!accountData) {
      throw new Error("Account does not exist");
    }

    const account = Account.fromData(accountData);
    let newBalance = account.balance || 0;

    if (type === TransactionTypes.DEPOSIT) {
      newBalance = isPaying ? newBalance + amount : newBalance - amount;
    } else if (type === TransactionTypes.WITHDRAW) {
      newBalance = isPaying ? newBalance - amount : newBalance + amount;
    } else {
      throw new Error("Invalid transaction type");
    }

    const updatedAccount = account.update({
      ...account,
      balance: newBalance,
    });

    await this.accountRepository.update(accountId, updatedAccount);
    console.log(`Account ${accountId} balance updated to ${newBalance}`);
  }
}
