"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/app/hooks/useUser";
import { Title } from "@/app/components/shared/Title";
import { CategoryExpensesSummary } from "@/app/components/shared/CategoryExpensesSummary";
import { CategoryExpensesChart } from "@/app/components/shared/CategoryExpensesChart";
import { LineChart } from "@/app/components/shared/LineChart";
import { AnnualProjectionSection } from "@/app/components/shared/AnnualProjectionSection";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Performance() {
  const { loading, dataCategoryExpenses, monthlyMetrics, metrics, user } =
    useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const expenseRatio =
    metrics && metrics.revenues > 0
      ? (metrics.expenses / metrics.revenues) * 100
      : null;

  const getRatioColor = (pct: number | null) => {
    if (pct === null) return "var(--text-muted)";
    if (pct < 50) return "var(--green)";
    if (pct <= 80) return "var(--yellow)";
    return "var(--red)";
  };

  const getRatioLabel = (pct: number | null) => {
    if (pct === null) return "Sem receitas cadastradas";
    if (pct < 50) return "Ótimo controle financeiro";
    if (pct <= 80) return "Atenção: gastos moderados";
    return "Alerta: gastos elevados";
  };

  const highestCategory = dataCategoryExpenses?.expenses.reduce(
    (max, e) => (e.percentage > max.percentage ? e : max),
    { categoryName: "", amount: 0, percentage: 0, categoryId: "" },
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Title navigateMonth>Performance</Title>

      {/* ── Resumo narrativo ──────────────────────── */}
      <div
        className="p-5 rounded-xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Visão geral do mês
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Receitas */}
          <div className="flex flex-col gap-1">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Receitas
            </p>
            <p
              className="money text-xl font-medium"
              style={{ color: "var(--green)" }}
            >
              {fmt(metrics?.revenues ?? 0)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Recebido: {fmt(metrics?.revenuesPaid ?? 0)}
            </p>
          </div>

          {/* Despesas */}
          <div className="flex flex-col gap-1">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Despesas
            </p>
            <p
              className="money text-xl font-medium"
              style={{ color: "var(--red)" }}
            >
              {fmt(metrics?.expenses ?? 0)}
            </p>
            {highestCategory && highestCategory.percentage > 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Maior:{" "}
                <span style={{ color: "var(--text-secondary)" }}>
                  {highestCategory.categoryName}
                </span>{" "}
                ({highestCategory.percentage.toFixed(0)}%)
              </p>
            )}
          </div>

          {/* Balanço */}
          <div className="flex flex-col gap-1">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Balanço
            </p>
            <p
              className="money text-xl font-medium"
              style={{
                color:
                  (metrics?.futureBalance ?? 0) >= 0
                    ? "var(--green)"
                    : "var(--red)",
              }}
            >
              {fmt(metrics?.futureBalance ?? 0)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {(metrics?.futureBalance ?? 0) >= 0
                ? "Sobra para poupar"
                : "Déficit no mês"}
            </p>
          </div>
        </div>

        {/* Barra de despesas / receitas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Comprometimento da renda
            </p>
            <p
              className="text-xs font-semibold"
              style={{ color: getRatioColor(expenseRatio) }}
            >
              {expenseRatio !== null ? `${expenseRatio.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--bg-overlay)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(expenseRatio ?? 0, 100)}%`,
                background: getRatioColor(expenseRatio),
                boxShadow: `0 0 8px ${getRatioColor(expenseRatio)}60`,
              }}
            />
          </div>
          <p
            className="text-xs mt-1.5"
            style={{ color: getRatioColor(expenseRatio) }}
          >
            {getRatioLabel(expenseRatio)}
          </p>
        </div>
      </div>

      {/* ── Gastos por categoria ───────────────────── */}
      {dataCategoryExpenses && dataCategoryExpenses.expenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Gastos por categoria
            </p>
            <CategoryExpensesSummary
              dataCategoryExpenses={dataCategoryExpenses}
            />
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Distribuição
            </p>
            <CategoryExpensesChart
              dataCategoryExpenses={dataCategoryExpenses}
            />
          </div>
        </div>
      ) : (
        <div
          className="p-8 rounded-xl text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma despesa registrada para este mês
          </p>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-sm mt-3 font-medium"
            style={{ color: "var(--accent-light)" }}
          >
            Adicionar transação →
          </Link>
        </div>
      )}

      {/* Regra 50-30-20 */}
      <div
        className="p-5 rounded-xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Dicas — Regra 50-30-20
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              pct: "50%",
              label: "Necessidades",
              desc: "Moradia, alimentação, transporte e saúde.",
              color: "var(--accent)",
            },
            {
              pct: "30%",
              label: "Desejos",
              desc: "Lazer, assinaturas, compras e restaurantes.",
              color: "var(--yellow)",
            },
            {
              pct: "20%",
              label: "Poupança",
              desc: "Investimentos, reserva de emergência e metas.",
              color: "var(--green)",
            },
          ].map(({ pct, label, desc, color }) => (
            <div
              key={label}
              className="flex flex-col gap-2 p-4 rounded-xl"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="money text-2xl font-medium" style={{ color }}>
                {pct}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {label}
              </p>
              <p
                className="text-xs leading-5"
                style={{ color: "var(--text-muted)" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico histórico */}
      {monthlyMetrics && monthlyMetrics.labels.length > 0 && (
        <div
          className="rounded-xl p-4 h-[320px]"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Histórico mensal
          </p>
          <LineChart data={monthlyMetrics} />
        </div>
      )}

      {/* Projeção anual & simulador de rendimento */}
      <AnnualProjectionSection />
    </div>
  );
}
