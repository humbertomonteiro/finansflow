import { CategoryExpensesSummary as CategoryExpensesSummaryType } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";
import { CategoryExpenseItem } from "./CategoryExpenseItem";

interface CategoryExpensesSummaryProps {
  dataCategoryExpenses: CategoryExpensesSummaryType | null;
}

export const CategoryExpensesSummary = ({
  dataCategoryExpenses,
}: CategoryExpensesSummaryProps) => {
  if (!dataCategoryExpenses || dataCategoryExpenses.expenses.length === 0) {
    return <p className="text-gray-400">Nenhuma despesa registrada</p>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-xl">
      <table className="w-full">
        <thead className="text-gray-400 text-sm">
          <tr className="border-b border-gray-700">
            <th className="text-left p-2">Categoria</th>
            <th className="text-right p-2">Valor</th>
            <th className="text-right p-2">Porcentagem</th>
          </tr>
        </thead>
        <tbody className="text-gray-400 text-sm">
          {dataCategoryExpenses.expenses.map((expense) => (
            <CategoryExpenseItem key={expense.categoryId} expense={expense} />
          ))}
        </tbody>
        <tfoot className="text-gray-300 text-sm">
          <tr className="border-t border-gray-600 font-semibold">
            <td className="p-2">Total</td>
            <td className="text-right py-2 px-4">
              {dataCategoryExpenses.totalExpenses.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </td>
            <td className="text-right py-2 px-4">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
