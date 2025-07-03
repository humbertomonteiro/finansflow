import { CategoryExpense } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

interface CategoryExpenseItemProps {
  expense: CategoryExpense;
}

export const CategoryExpenseItem = ({ expense }: CategoryExpenseItemProps) => {
  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800">
      <td className=" py-4 px-2">{expense.categoryName}</td>
      <td className="text-right  py-4 px-2">
        <span
          className={expense.percentage > 30 ? "text-red-400" : "text-gray-100"}
        >
          {expense.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </td>
      <td className="text-right  py-4 px-2">
        <span
          className={expense.percentage > 30 ? "text-red-400" : "text-gray-100"}
        >
          {expense.percentage.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
};
