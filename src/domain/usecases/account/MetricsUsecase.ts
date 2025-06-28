import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";

export interface MetricsType {
  balance: number;
  revenues: number;
  expenses: number;
  futureBalance: number;
}

export class MetricsUsecase {
  async execute(
    transactions: ITransaction[] | null,
    accounts: IAccount[] | null,
    month: number,
    year: number
  ): Promise<MetricsType> {
    if (!accounts || accounts.length === 0) {
      console.log("Nenhuma conta fornecida");
      return {
        balance: 0,
        revenues: 0,
        expenses: 0,
        futureBalance: 0,
      };
    }

    if (!transactions) {
      console.log("Nenhuma transação fornecida");
      const baseBalance = accounts.reduce(
        (sum, account) => sum + (account.balance || 0),
        0
      );
      return {
        balance: baseBalance,
        revenues: 0,
        expenses: 0,
        futureBalance: 0,
      };
    }

    // Validar mês e ano
    if (month < 1 || month > 12) throw new Error("Mês inválido");
    if (year < 2000) throw new Error("Ano inválido");

    // Calcular saldo base (soma dos saldos das contas)
    const balance = accounts.reduce(
      (sum, account) => sum + (account.balance || 0),
      0
    );

    // Inicializar métricas
    const metrics: MetricsType = {
      balance,
      revenues: 0,
      expenses: 0,
      futureBalance: 0,
    };

    // Processar transações
    for (const transaction of transactions) {
      if (transaction.type === TransactionTypes.DEPOSIT) {
        metrics.revenues += transaction.amount;
      } else if (transaction.type === TransactionTypes.WITHDRAW) {
        metrics.expenses += transaction.amount;
      }
    }

    metrics.futureBalance = metrics.revenues - metrics.expenses;

    return metrics;
  }
}
