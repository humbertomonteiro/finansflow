"use client";

import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import Card from "@/app/components/shared/Card";
import { Title } from "@/app/components/shared/Title";
import { TransactionList } from "@/app/components/shared/TransactionList";
import { LineChart } from "@/app/components/shared/LineChart";
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
import { FiAlertCircle, FiClock } from "react-icons/fi";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const {
    metrics,
    accumulatedFutureBalance,
    currentBalance,
    loading,
    nearbyTransactions,
    overdueTransactions,
    monthlyMetrics,
  } = useUser();

  // Qual modal está aberto (null = nenhum)
  const [activeModal, setActiveModal] = useState<DashboardModalType | null>(
    null
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-52">
      <Title navigateMonth>Dashboard</Title>

      {/* ── Cards de métricas ─────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
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

          {/* Projeção → mini histórico */}
          <Card
            value={fmt(accumulatedFutureBalance)}
            title="Projeção acumulada"
            icon={<TbTrendingUp className="h-5 w-5 text-white" />}
            color="bg-sky-600"
            info="Soma histórica de balanços"
            onClick={() => setActiveModal("projection")}
          />
        </div>
      ) : null}

      {/* ── Modal dos cards ───────────────────────── */}
      <DashboardCardModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />

      {/* ── Gráfico de linha ──────────────────────── */}
      {/* {monthlyMetrics && monthlyMetrics.labels.length > 0 && (
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
      )} */}

      {/* ── Listas de atenção ─────────────────────── */}
      {((nearbyTransactions?.length ?? 0) > 0 ||
        (overdueTransactions?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyTransactions && nearbyTransactions.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
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
              className="rounded-xl overflow-hidden"
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
    </div>
  );
}
