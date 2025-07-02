import { CategoryExpensesSummary } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

export class GenerateCategoryChartDataUsecase {
  execute(dataCategoryExpenses: CategoryExpensesSummary | null): ChartData {
    if (!dataCategoryExpenses || dataCategoryExpenses.expenses.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderColor: [] }],
      };
    }

    // Paleta de cores compatível com o tema escuro
    const colors = [
      "rgba(34, 197, 94, 0.6)", // Verde (similar ao LineChart)
      "rgba(239, 68, 68, 0.6)", // Vermelho (similar ao LineChart)
      "rgba(59, 130, 246, 0.6)", // Azul
      "rgba(245, 158, 11, 0.6)", // Amarelo
      "rgba(139, 92, 246, 0.6)", // Roxo
      "rgba(236, 72, 153, 0.6)", // Rosa
    ];
    const borderColor = "#1F2937"; // Cor da borda (bg-gray-800)

    const labels = dataCategoryExpenses.expenses.map(
      (expense) => expense.categoryName
    );
    const data = dataCategoryExpenses.expenses.map((expense) => expense.amount);
    const backgroundColors = dataCategoryExpenses.expenses.map(
      (_, index) => colors[index % colors.length]
    );
    const borderColors = Array(data.length).fill(borderColor);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
        },
      ],
    };
  }
}
