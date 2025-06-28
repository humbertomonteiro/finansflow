import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";

export interface AnnualMetrics {
  labels: string[];
  revenues: number[];
  expenses: number[];
}

export class AnnualMetricsUsecase {
  async execute(
    transactions: ITransaction[] | null,
    year: number
  ): Promise<AnnualMetrics> {
    if (!transactions) {
      return {
        labels: [],
        revenues: [],
        expenses: [],
      };
    }

    // Inicializa arrays para 12 meses
    const monthlyRevenues = new Array(12).fill(0);
    const monthlyExpenses = new Array(12).fill(0);

    // Mapeamento de números do mês para nomes (para os rótulos do gráfico)
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    // Itera sobre todas as transações para calcular os totais mensais
    for (const transaction of transactions) {
      // Itera sobre o histórico de pagamentos de cada transação
      for (const payment of transaction.paymentHistory) {
        // Verifica se a data do pagamento pertence ao ano especificado
        if (payment.dueDate.getFullYear() === year) {
          const monthIndex = payment.dueDate.getMonth(); // 0 para Janeiro, 11 para Dezembro
          const amount = payment.amount;

          // Adiciona o valor à categoria correta (receita ou despesa)
          if (transaction.type === TransactionTypes.DEPOSIT) {
            monthlyRevenues[monthIndex] += amount;
          } else if (transaction.type === TransactionTypes.WITHDRAW) {
            monthlyExpenses[monthIndex] += amount;
          }
        }
      }
    }

    return {
      labels: monthNames,
      revenues: monthlyRevenues,
      expenses: monthlyExpenses,
    };
  }
}
