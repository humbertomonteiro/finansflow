import { CategoryExpensesSummary as CategoryExpensesSummaryType } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

interface CategoryExpensesSummaryProps {
  dataCategoryExpenses: CategoryExpensesSummaryType | null;
}

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#f97316",
  "#ec4899",
];

export const CategoryExpensesSummary = ({
  dataCategoryExpenses,
}: CategoryExpensesSummaryProps) => {
  if (!dataCategoryExpenses || dataCategoryExpenses.expenses.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Nenhuma despesa registrada
      </p>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div style={{ borderColor: "var(--border-subtle)" }}>
        {dataCategoryExpenses.expenses.map((expense, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={expense.categoryId} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {expense.categoryName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="money text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {expense.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <span
                    className="text-xs font-semibold w-10 text-right"
                    style={{ color }}
                  >
                    {expense.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* Barra de progresso */}
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-overlay)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${expense.percentage}%`,
                    background: color,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Total
          </p>
          <p
            className="money text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {dataCategoryExpenses.totalExpenses.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
