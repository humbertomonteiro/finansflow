import { IRepository } from "@/domain/interfaces/repository/repository";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { Transaction } from "@/domain/entities/transaction/Transaction";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { Account } from "@/domain/entities/account/Account";

export interface SettleResult {
  updatedTx: ITransaction;
  settlementTx: ITransaction;
}

export class SettleInstallmentsUseCase {
  constructor(
    private readonly transactionRepository: IRepository<ITransaction>,
    private readonly accountRepository: IRepository<Account>
  ) {}

  async execute(
    transactionId: string,
    settlementAmount: number,
    payingAccountId: string
  ): Promise<SettleResult> {
    const data = await this.transactionRepository.findById(transactionId);
    if (!data) throw new Error("Transação não encontrada");

    if (data.kind !== TransactionKind.INSTALLMENT) {
      throw new Error("Somente transações parceladas podem ser quitadas");
    }

    const excluded = new Set<number>(data.recurrence?.excludedInstallments ?? []);

    // Find remaining unpaid, non-excluded installments
    const remainingIndices: number[] = [];
    data.paymentHistory.forEach((p, i) => {
      const oneBasedIdx = i + 1;
      if (!p.isPaid && !excluded.has(oneBasedIdx)) {
        remainingIndices.push(oneBasedIdx);
      }
    });

    if (remainingIndices.length === 0) {
      throw new Error("Não há parcelas pendentes para quitar");
    }

    // Add remaining indices to excludedInstallments and set endDate to yesterday
    const newExcluded = [...excluded, ...remainingIndices];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const updatedTx = await this.transactionRepository.update(transactionId, {
      ...data,
      recurrence: {
        ...data.recurrence,
        excludedInstallments: newExcluded,
        endDate: yesterday,
      },
    });

    // Create settlement SIMPLE WITHDRAW transaction
    const today = new Date();
    const settlementData: Omit<ITransaction, "id" | "paymentHistory"> = {
      type: TransactionTypes.WITHDRAW,
      kind: TransactionKind.SIMPLE,
      description: `Quitação: ${data.description || "Parcelamento"}`,
      amount: settlementAmount,
      categoryId: data.categoryId,
      accountId: payingAccountId,
      dueDate: today,
      recurrence: {},
    };

    const newTx = Transaction.create(settlementData);
    await this.transactionRepository.save(newTx);

    // Mark settlement transaction as paid immediately
    newTx.paymentHistory[0].isPaid = true;
    newTx.paymentHistory[0].paidAt = today;
    newTx.paymentHistory[0].paidAccountId = payingAccountId;

    const settlementTx = await this.transactionRepository.update(newTx.id, newTx);

    // Debit account balance
    await this.debitAccount(payingAccountId, settlementAmount);

    return { updatedTx, settlementTx };
  }

  private async debitAccount(accountId: string, amount: number): Promise<void> {
    const accountData = await this.accountRepository.findById(accountId);
    if (!accountData) throw new Error("Conta não encontrada");
    const account = Account.fromData(accountData);
    const updatedAccount = account.update({
      ...account,
      balance: account.balance - amount,
    });
    await this.accountRepository.update(accountId, updatedAccount);
  }
}
