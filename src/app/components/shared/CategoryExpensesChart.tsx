"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const usecase = new GenerateCategoryChartDataUsecase();
  const chartData = usecase.execute(dataCategoryExpenses);

  const tooltipBg = isLight ? "#ffffff" : "#0d1220";
  const tooltipBorder = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const titleColor = isLight ? "#0f172a" : "#f0f4ff";
  const bodyColor = isLight ? "#475569" : "#94a3b8";
  const legendColor = isLight ? "#475569" : "#94a3b8";

  const options = {
    responsive: true,
    // true aqui garante que o chart respeita a proporção do wrapper,
    // sem crescer além do que o container permite
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: legendColor,
          font: { size: 12, family: "'DM Sans', sans-serif" },
          padding: 16,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleColor: titleColor,
        bodyColor: bodyColor,
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
      className="rounded-sm p-4 flex justify-center items-center"
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
        boxShadow: "var(--shadow-card)",
      }}
    >
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
