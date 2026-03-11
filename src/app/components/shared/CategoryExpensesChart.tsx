"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { GenerateCategoryChartDataUsecase } from "@/domain/usecases/transaction/GenerateCategoryChartDataUsecase";
import { CategoryExpensesSummary } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

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
    // true aqui garante que o chart respeita a proporção do wrapper,
    // sem crescer além do que o container permite
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#94a3b8",
          font: { size: 12, family: "'DM Sans', sans-serif" },
          padding: 16,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "#0d1220",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#f0f4ff",
        bodyColor: "#94a3b8",
        padding: 12,
        callbacks: {
          label: function (context: any) {
            let label = context.label || "";
            if (label) label += ": ";
            if (context.parsed !== null) {
              label += new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(context.parsed);
              const percentage =
                dataCategoryExpenses?.expenses[context.dataIndex]?.percentage;
              if (percentage) label += ` (${percentage.toFixed(1)}%)`;
            }
            return label;
          },
        },
      },
    },
  };

  if (!dataCategoryExpenses || dataCategoryExpenses.expenses.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Nenhuma despesa registrada
      </p>
    );
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        // Altura fixa é OBRIGATÓRIA com Chart.js responsive.
        // Sem isso, o canvas usa a altura anterior como base e cresce
        // infinitamente a cada re-render ou evento de scroll.
        height: "320px",
        // Largura máxima centrada para o gráfico não ficar imenso em telas grandes
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
