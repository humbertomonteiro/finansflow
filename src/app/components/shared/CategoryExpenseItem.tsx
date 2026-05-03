import { CategoryExpense } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

interface CategoryExpenseItemProps {
  expense: CategoryExpense;
}

export const CategoryExpenseItem = ({ expense }: CategoryExpenseItemProps) => {
  return (
    <tr className="border-b hover:opacity-80 transition-opacity" style={{ borderColor: "var(--border-subtle)" }}>
      <td className="py-4 px-2" style={{ color: "var(--text-primary)" }}>{expense.categoryName}</td>
      <td className="text-right py-4 px-2">
        <span style={{ color: expense.percentage > 30 ? "var(--red)" : "var(--text-primary)" }}>
          {expense.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </td>
      <td className="text-right py-4 px-2">
        <span style={{ color: expense.percentage > 30 ? "var(--red)" : "var(--text-primary)" }}>
          {expense.percentage.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
};
