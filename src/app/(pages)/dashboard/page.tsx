"use client";

import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import Card from "@/app/components/shared/Card";
import { Title } from "@/app/components/shared/Title";
import { TransactionList } from "@/app/components/shared/TransactionList";
import { CategoryExpensesSummary } from "@/app/components/shared/CategoryExpensesSummary";
import {
  DashboardCardModal,
  DashboardModalType,
} from "@/app/components/shared/DashboardCardModal";
import {
  RiMoneyDollarCircleLine,
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
} from "react-icons/ri";
import { TbScale, TbTrendingUp } from "react-icons/tb";
import { FiAlertCircle, FiClock, FiTarget } from "react-icons/fi";
import { CreditCardsWidget } from "@/app/components/shared/CreditCardsWidget";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const {
    metrics,
    projectedBalance,
    currentBalance,
    loading,
    nearbyTransactions,
    overdueTransactions,
    dataCategoryExpenses,
    goals,
  } = useUser();

  // ── Métricas de metas ──────────────────────────────────────────
  const goalsEntries = (goals ?? []).map((g) => {
    const spent =
      dataCategoryExpenses?.expenses.find((e) => e.categoryId === g.categoryId)
        ?.amount ?? 0;
    return { ...g, spent };
  });
  const goalsTotal = goalsEntries.reduce((s, g) => s + g.monthlyLimit, 0);
  const goalsSpent = goalsEntries.reduce((s, g) => s + g.spent, 0);
  const goalsTotalPct =
    goalsTotal > 0 ? Math.min((goalsSpent / goalsTotal) * 100, 100) : 0;
  const goalsOver = goalsEntries.filter((g) => g.spent > g.monthlyLimit).length;
  const goalsWarn = goalsEntries
    .filter((g) => !g.spent || g.spent / g.monthlyLimit >= 0.8)
    .filter((g) => g.spent <= g.monthlyLimit).length;
  const hasGoals = goalsEntries.length > 0;

  const goalsStatusColor =
    goalsOver > 0
      ? "var(--red)"
      : goalsWarn > 0
      ? "var(--yellow)"
      : hasGoals
      ? "var(--green)"
      : "var(--text-muted)";

  const goalsValueText = !hasGoals
    ? "Sem metas"
    : goalsOver > 0
    ? `${goalsOver} excedeu`
    : goalsWarn > 0
    ? `${goalsWarn} em atenção`
    : `${goalsEntries.length}/${goalsEntries.length} ok`;

  const goalsInfoText = hasGoals
    ? `${goalsTotalPct.toFixed(0)}% do orçamento usado`
    : "Defina limites por categoria";

  // Qual modal está aberto (null = nenhum)
  const [activeModal, setActiveModal] = useState<DashboardModalType | null>(
    null
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Title navigateMonth>Dashboard</Title>

      {/* ── Cards de métricas ─────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`skeleton h-28 rounded-xl${
                i === 0 ? " col-span-2 lg:col-span-1" : ""
              }`}
            />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Saldo — destaque → modal de contas */}
          <div className="col-span-2 lg:col-span-1">
            <Card
              value={fmt(currentBalance ?? 0)}
              title="Saldo atual"
              icon={<RiMoneyDollarCircleLine className="h-5 w-5 text-white" />}
              color="bg-indigo-600"
              highligth
              info="Soma de todas as contas"
              onClick={() => setActiveModal("balance")}
            />
          </div>

          {/* Receitas → modal de progresso */}
          <Card
            value={fmt(metrics.revenues ?? 0)}
            title="Receitas"
            icon={<RiArrowUpCircleLine className="h-5 w-5 text-white" />}
            color="bg-emerald-600"
            info={`Recebido: ${fmt(metrics.revenuesPaid ?? 0)}`}
            onClick={() => setActiveModal("revenues")}
          />

          {/* Despesas → modal de categorias */}
          <Card
            value={fmt(metrics.expenses ?? 0)}
            title="Despesas"
            icon={<RiArrowDownCircleLine className="h-5 w-5 text-white" />}
            color="bg-rose-600"
            info={`Pago: ${fmt(metrics.expensesPaid ?? 0)}`}
            onClick={() => setActiveModal("expenses")}
          />

          {/* Balanço → comparativo com mês anterior */}
          <Card
            value={fmt(metrics.futureBalance ?? 0)}
            title="Balanço do mês"
            icon={<TbScale className="h-5 w-5 text-white" />}
            color="bg-violet-600"
            info="Receitas − Despesas"
            onClick={() => setActiveModal("monthly")}
          />

          {/* Projeção → modal de projeção anual */}
          <Card
            value={fmt(projectedBalance)}
            title="Saldo projetado"
            icon={<TbTrendingUp className="h-5 w-5 text-white" />}
            color="bg-sky-600"
            info="Saldo atual + tudo pendente"
            onClick={() => setActiveModal("projection")}
          />

          {/* Metas → modal com progresso por categoria */}
          <div
            onClick={() => setActiveModal("goals")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveModal("goals")}
            className="relative flex flex-col gap-3 rounded-sm p-4 overflow-hidden transition-all duration-200 group cursor-pointer col-span-2 lg:col-span-1"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Hover overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-sm"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm md:text-xs font-medium uppercase tracking-wider">
                Metas
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                >
                  ver detalhes
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-600"
                  style={{ opacity: 0.9 }}
                >
                  <FiTarget className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Valor */}
            <div>
              <p
                className="text-lg md:text-2xl font-medium leading-none"
                style={{ color: goalsStatusColor }}
              >
                {goalsValueText}
              </p>
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                {goalsInfoText}
              </p>
            </div>

            {/* Mini barra de progresso */}
            {hasGoals && (
              <div
                className="h-1.5 rounded-full overflow-hidden mt-auto"
                style={{ background: "var(--bg-overlay)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${goalsTotalPct}%`,
                    background: goalsStatusColor,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Cartões de crédito ───────────────────────── */}
      <CreditCardsWidget />

      {/* ── Modal dos cards ───────────────────────── */}
      <DashboardCardModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />

      {/* ── Listas de atenção ─────────────────────── */}
      {((nearbyTransactions?.length ?? 0) > 0 ||
        (overdueTransactions?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyTransactions && nearbyTransactions.length > 0 && (
            <div
              className="rounded-sm overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <FiClock
                  className="h-4 w-4"
                  style={{ color: "var(--yellow)" }}
                />
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Vencendo em breve
                </p>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--yellow-dim)",
                    color: "var(--yellow)",
                  }}
                >
                  {nearbyTransactions.length}
                </span>
              </div>
              <div className="p-4 max-h-[360px] overflow-y-auto">
                <TransactionList transactions={nearbyTransactions} hideSort />
              </div>
            </div>
          )}

          {overdueTransactions && overdueTransactions.length > 0 && (
            <div
              className="rounded-sm overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <FiAlertCircle
                  className="h-4 w-4"
                  style={{ color: "var(--red)" }}
                />
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Em atraso
                </p>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--red-dim)", color: "var(--red)" }}
                >
                  {overdueTransactions.length}
                </span>
              </div>
              <div className="p-4 max-h-[360px] overflow-y-auto">
                <TransactionList transactions={overdueTransactions} hideSort />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Gastos por categoria ─────────────────────── */}
      {dataCategoryExpenses && dataCategoryExpenses.expenses.length > 0 && (
        <div>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Gastos por categoria
          </p>
          <CategoryExpensesSummary
            dataCategoryExpenses={dataCategoryExpenses}
          />
        </div>
      )}
    </div>
  );
}
