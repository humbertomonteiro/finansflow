"use client";

import React from "react";
import { Line } from "react-chartjs-2";
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
    labels: string[]; // Ex: ['Jan', 'Fev', 'Mar', ...]
    revenues: number[];
    expenses: number[];
  };
}

export function LineChart({ data }: LineChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Receitas",
        data: data.revenues,
        borderColor: "rgb(34, 197, 94)", // Cor verde
        backgroundColor: "rgba(34, 197, 94, 0.5)",
      },
      {
        label: "Despesas",
        data: data.expenses,
        borderColor: "rgb(239, 68, 68)", // Cor vermelha
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
          color: "#e5e7eb", // Cor das legendas
        },
      },
      title: {
        display: true,
        text: "Evolução Mensal (Receitas vs. Despesas)",
        color: "#e5e7eb", // Cor do título
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
        ticks: { color: "#9ca3af" }, // Cor dos rótulos do eixo X
        grid: { color: "#374151" }, // Cor das linhas do grid
      },
      y: {
        ticks: {
          color: "#9ca3af",
          callback: (value: any) => `R$ ${value.toLocaleString("pt-BR")}`,
        }, // Formata o eixo Y como moeda
        grid: { color: "#374151" }, // Cor das linhas do grid
      },
    },
  };

  return <Line options={options} data={chartData} />;
}
