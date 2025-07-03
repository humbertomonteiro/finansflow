"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { GenerateCategoryChartDataUsecase } from "@/domain/usecases/transaction/GenerateCategoryChartDataUsecase";
import { CategoryExpensesSummary } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

// Registre os componentes necessários para o gráfico de pizza
ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryExpensesChartProps {
  dataCategoryExpenses: CategoryExpensesSummary | null;
}

export function CategoryExpensesChart({
  dataCategoryExpenses,
}: CategoryExpensesChartProps) {
  const usecase = new GenerateCategoryChartDataUsecase();
  const chartData = usecase.execute(dataCategoryExpenses);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#d1d5dc", // Cor do texto da legenda (text-gray-300)
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(context.parsed);
              const percentage =
                dataCategoryExpenses?.expenses[context.dataIndex]?.percentage;
              if (percentage) {
                label += ` (${percentage.toFixed(1)}%)`;
              }
            }
            return label;
          },
        },
      },
    },
  };

  if (!dataCategoryExpenses || dataCategoryExpenses.expenses.length === 0) {
    return <p className="text-gray-400">Nenhuma despesa registrada</p>;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl w-full h-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
