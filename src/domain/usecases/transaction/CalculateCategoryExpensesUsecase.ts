import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { ICategory } from "@/domain/interfaces/category/ICategory";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface CategoryExpensesSummary {
  expenses: CategoryExpense[];
  totalExpenses: number;
}

export class CalculateCategoryExpensesUsecase {
  execute(
    transactions: ITransaction[],
    categories: ICategory[]
  ): CategoryExpensesSummary {
    // Agrupa gastos por categoryId
    const expensesByCategory = transactions
      .filter((transaction) => transaction.type === TransactionTypes.WITHDRAW)
      .reduce((acc, transaction) => {
        const categoryId = transaction.categoryId || "uncategorized";
        acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    // Calcula o total de despesas
    const totalExpenses = Object.values(expensesByCategory).reduce(
      (sum, amount) => sum + amount,
      0
    );

    // Mapeia para o formato de saída com nomes e porcentagens
    const expenses: CategoryExpense[] = Object.entries(expensesByCategory).map(
      ([categoryId, amount]) => {
        const category = categories.find((cat) => cat.id === categoryId);
        return {
          categoryId,
          categoryName: category ? category.name : "Sem categoria",
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        };
      }
    );

    return {
      expenses,
      totalExpenses,
    };
  }
}
