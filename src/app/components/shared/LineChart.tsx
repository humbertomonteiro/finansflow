"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "next-themes";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registre os componentes do Chart.js que você vai usar
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: {
    labels: string[];
    revenues: number[];
    expenses: number[];
  };
}

export function LineChart({ data }: LineChartProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const textColor = isLight ? "#475569" : "#d1d5dc";
  const tickColor = isLight ? "#94a3b8" : "#9ca3af";
  const gridColor = isLight ? "#e2e8f0" : "#374151";

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Receitas",
        data: data.revenues,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
      },
      {
        label: "Despesas",
        data: data.expenses,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.5)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      title: {
        display: true,
        text: "Evolução Mensal (Receitas vs. Despesas)",
        color: textColor,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: tickColor },
        grid: { color: gridColor },
      },
      y: {
        ticks: {
          color: tickColor,
          callback: (value: any) => `R$ ${value.toLocaleString("pt-BR")}`,
        },
        grid: { color: gridColor },
      },
    },
  };

  return <Line options={options} data={chartData} />;
}
