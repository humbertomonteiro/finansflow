"use client";

import { useEffect, useState } from "react";
import { useAmountInput } from "@/app/hooks/useAmountInput";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { AnnualMetrics } from "@/domain/usecases/transaction/AnnualMetricsUsecase";
import { CategoryExpensesSummary } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";
import {
  FiX,
  FiEdit2,
  FiCheck,
  FiArrowRight,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import {
  RiMoneyDollarCircleLine,
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
} from "react-icons/ri";
import { TbScale, TbTrendingUp } from "react-icons/tb";

// ── Tipo de modal ───────────────────────────────────────────────
export type DashboardModalType =
  | "balance" // Saldo atual → lista de contas com edição
  | "revenues" // Receitas → progresso pago/pendente + lista
  | "expenses" // Despesas → top categorias
  | "monthly" // Balanço do mês → comparativo com mês anterior
  | "projection"; // Projeção acumulada → mini histórico

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── Prop do componente principal ────────────────────────────────
interface DashboardCardModalProps {
  type: DashboardModalType | null;
  onClose: () => void;
}

// ── Modal raiz ──────────────────────────────────────────────────
export function DashboardCardModal({ type, onClose }: DashboardCardModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (type) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [type]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!type || !mounted) return null;

  const titles: Record<
    DashboardModalType,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    balance: {
      label: "Saldo atual",
      icon: <RiMoneyDollarCircleLine className="h-4 w-4" />,
      color: "var(--accent)",
    },
    revenues: {
      label: "Receitas do mês",
      icon: <RiArrowUpCircleLine className="h-4 w-4" />,
      color: "var(--green)",
    },
    expenses: {
      label: "Despesas do mês",
      icon: <RiArrowDownCircleLine className="h-4 w-4" />,
      color: "var(--red)",
    },
    monthly: {
      label: "Balanço do mês",
      icon: <TbScale className="h-4 w-4" />,
      color: "var(--accent-light)",
    },
    projection: {
      label: "Projeção acumulada",
      icon: <TbTrendingUp className="h-4 w-4" />,
      color: "#38bdf8",
    },
  };

  const { label, icon, color } = titles[type];

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(7,11,20,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl animate-fade-in-scale overflow-hidden"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 0 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5">
            <span style={{ color }}>{icon}</span>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo — scrollável */}
        <div className="overflow-y-auto flex-1">
          {type === "balance" && <BalanceModal onClose={onClose} />}
          {type === "revenues" && <RevenuesModal onClose={onClose} />}
          {type === "expenses" && <ExpensesModal />}
          {type === "monthly" && <MonthlyModal />}
          {type === "projection" && <ProjectionModal />}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ══════════════════════════════════════════════════════════════
// 1. SALDO ATUAL — lista de contas com edição inline
// ══════════════════════════════════════════════════════════════
function BalanceModal({ onClose }: { onClose: () => void }) {
  const { accounts, updateAccount, currentBalance } = useUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const balInput = useAmountInput();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (acc: IAccount) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    balInput.reset(acc.balance);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveEdit = async (acc: IAccount) => {
    setError(null);
    const balance = balInput.parseAmount();
    if (isNaN(balance) || balance < 0) {
      setError("Saldo inválido");
      return;
    }
    if (editName.trim().length < 3) {
      setError("Nome muito curto");
      return;
    }
    setSaving(true);
    try {
      await updateAccount(acc.id, { name: editName.trim(), balance });
      setEditingId(null);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Total */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 100%)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <div>
          <p
            className="text-xs mb-1"
            style={{ color: "rgba(199,210,254,0.6)" }}
          >
            Total consolidado
          </p>
          <p className="money text-2xl font-semibold" style={{ color: "#fff" }}>
            {fmt(currentBalance)}
          </p>
        </div>
        <p className="text-xs" style={{ color: "rgba(199,210,254,0.5)" }}>
          {accounts?.length ?? 0} conta
          {(accounts?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Lista de contas */}
      <div className="flex flex-col gap-2">
        {accounts?.map((acc) =>
          editingId === acc.id ? (
            // ── Modo edição ──────────────────────────────────
            <div
              key={acc.id}
              className="flex flex-col gap-2 p-3 rounded-xl"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-accent)",
              }}
            >
              <input
                className="input text-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome da conta"
                autoFocus
              />
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  R$
                </span>
                <input
                  className="input money text-sm"
                  style={{ paddingLeft: "2.25rem" }}
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 1.500,00"
                  value={balInput.raw}
                  onChange={balInput.handleChange}
                />
              </div>
              {error && (
                <p className="text-xs" style={{ color: "var(--red)" }}>
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(acc)}
                  disabled={saving}
                  className="button button-primary h-8 px-3 text-xs flex-1"
                >
                  <FiCheck className="h-3 w-3" />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="button button-ghost h-8 px-3 text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            // ── Modo visualização ─────────────────────────────
            <div
              key={acc.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {acc.name}
                </p>
                <p
                  className="money text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {fmt(acc.balance)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Barra proporcional ao saldo */}
                <div
                  className="w-16 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(
                        4,
                        (acc.balance /
                          Math.max(
                            ...(accounts?.map((a) => a.balance) ?? [1])
                          )) *
                          100
                      )}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <button
                  onClick={() => startEdit(acc)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <p
        className="text-xs text-center pb-1"
        style={{ color: "var(--text-muted)" }}
      >
        Para criar ou remover contas, acesse{" "}
        <button
          onClick={onClose}
          className="underline underline-offset-2 cursor-pointer"
        >
          Configurações
        </button>
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. RECEITAS — barra de progresso pago/pendente
// ══════════════════════════════════════════════════════════════
function RevenuesModal({ onClose }: { onClose: () => void }) {
  const { metrics, transactions } = useUser();
  const router = useRouter();

  const paid = metrics?.revenuesPaid ?? 0;
  const total = metrics?.revenues ?? 0;
  const pending = total - paid;
  const pct = total > 0 ? (paid / total) * 100 : 0;

  // Top receitas do mês (não pagas primeiro)
  const revenueList = (transactions ?? [])
    .filter((t) => t.type === "deposit")
    .slice(0, 5);

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Barra de progresso */}
      <div
        className="p-4 rounded-xl flex flex-col gap-3"
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Recebido</span>
          <span className="money font-medium" style={{ color: "var(--green)" }}>
            {fmt(paid)}
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "var(--green)" }}
          />
        </div>
        <div
          className="flex justify-between text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{pct.toFixed(0)}% recebido</span>
          <span>
            Pendente: <span className="money">{fmt(pending)}</span>
          </span>
        </div>
      </div>

      {/* Total em destaque */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Total previsto
        </p>
        <p
          className="money text-xl font-semibold"
          style={{ color: "var(--green)" }}
        >
          {fmt(total)}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border-subtle)" }} />

      {/* Atalho para transactions */}
      <button
        onClick={() => {
          router.push("/transactions");
          onClose();
        }}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all cursor-pointer"
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "var(--border-strong)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border-subtle)")
        }
      >
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ver todas as transações
        </span>
        <FiArrowRight
          className="h-4 w-4"
          style={{ color: "var(--text-muted)" }}
        />
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. DESPESAS — top categorias com barras proporcionais
// ══════════════════════════════════════════════════════════════
function ExpensesModal() {
  const { dataCategoryExpenses, metrics } = useUser();

  const paid = metrics?.expensesPaid ?? 0;
  const total = metrics?.expenses ?? 0;
  const pending = total - paid;
  const pct = total > 0 ? (paid / total) * 100 : 0;

  const top5 = (dataCategoryExpenses?.expenses ?? [])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const COLORS = [
    "var(--red)",
    "#f97316",
    "#eab308",
    "var(--accent-light)",
    "var(--text-muted)",
  ];

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Barra de progresso pago */}
      <div
        className="p-4 rounded-xl flex flex-col gap-3"
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Pago</span>
          <span className="money font-medium" style={{ color: "var(--red)" }}>
            {fmt(paid)}
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "var(--red)" }}
          />
        </div>
        <div
          className="flex justify-between text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{pct.toFixed(0)}% pago</span>
          <span>
            Pendente: <span className="money">{fmt(pending)}</span>
          </span>
        </div>
      </div>

      {/* Top categorias */}
      {top5.length > 0 && (
        <div className="flex flex-col gap-1">
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Top categorias
          </p>
          {top5.map((cat, i) => (
            <div
              key={cat.categoryId}
              className="flex flex-col gap-1.5 py-2"
              style={{
                borderBottom:
                  i < top5.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {cat.categoryName}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {cat.percentage.toFixed(1)}%
                  </span>
                  <span
                    className="money text-sm font-medium"
                    style={{ color: COLORS[i] }}
                  >
                    {fmt(cat.amount)}
                  </span>
                </div>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "var(--bg-overlay)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percentage}%`, background: COLORS[i] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {top5.length === 0 && (
        <p
          className="text-sm text-center py-4"
          style={{ color: "var(--text-muted)" }}
        >
          Nenhuma despesa registrada neste mês.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. BALANÇO DO MÊS — comparativo com mês anterior
// ══════════════════════════════════════════════════════════════
function MonthlyModal() {
  const { metrics, monthlyMetrics, month } = useUser();

  const currentBalance = metrics?.futureBalance ?? 0;

  // Pega o balanço do mês anterior do monthlyMetrics
  const prevBalance = (() => {
    if (!monthlyMetrics || monthlyMetrics.labels.length < 2) return null;
    const idx = month - 1; // mês atual é o último, anterior é idx-1
    const prevRevenue = monthlyMetrics.revenues[idx - 1] ?? 0;
    const prevExpense = monthlyMetrics.expenses[idx - 1] ?? 0;
    return prevRevenue - prevExpense;
  })();

  const delta = prevBalance !== null ? currentBalance - prevBalance : null;
  const deltaPercent =
    prevBalance !== null && prevBalance !== 0
      ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100
      : null;

  const isImproving = delta !== null && delta >= 0;

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Balanço atual em destaque */}
      <div
        className="p-4 rounded-xl"
        style={{
          background:
            currentBalance >= 0
              ? "rgba(34,197,94,0.08)"
              : "rgba(239,68,68,0.08)",
          border: `1px solid ${
            currentBalance >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"
          }`,
        }}
      >
        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
          Balanço deste mês
        </p>
        <p
          className="money text-3xl font-semibold"
          style={{ color: currentBalance >= 0 ? "var(--green)" : "var(--red)" }}
        >
          {currentBalance >= 0 ? "+" : ""}
          {fmt(currentBalance)}
        </p>
      </div>

      {/* Comparativo */}
      {prevBalance !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-3 rounded-xl flex flex-col gap-1"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Mês anterior
            </p>
            <p
              className="money text-base font-medium"
              style={{
                color: prevBalance >= 0 ? "var(--green)" : "var(--red)",
              }}
            >
              {prevBalance >= 0 ? "+" : ""}
              {fmt(prevBalance)}
            </p>
          </div>

          <div
            className="p-3 rounded-xl flex flex-col gap-1"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Variação
            </p>
            <div className="flex items-center gap-1.5">
              {isImproving ? (
                <FiTrendingUp
                  className="h-4 w-4"
                  style={{ color: "var(--green)" }}
                />
              ) : (
                <FiTrendingDown
                  className="h-4 w-4"
                  style={{ color: "var(--red)" }}
                />
              )}
              <p
                className="text-base font-medium"
                style={{ color: isImproving ? "var(--green)" : "var(--red)" }}
              >
                {deltaPercent !== null
                  ? `${deltaPercent > 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Receitas vs Despesas do mês */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "12px",
        }}
      >
        <p
          className="text-xs uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Composição
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Receitas</span>
            <span className="money" style={{ color: "var(--green)" }}>
              +{fmt(metrics?.revenues ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Despesas</span>
            <span className="money" style={{ color: "var(--red)" }}>
              -{fmt(metrics?.expenses ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {prevBalance === null && (
        <p
          className="text-xs text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Sem dados suficientes para comparativo. Registre transações em meses
          anteriores.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. PROJEÇÃO ACUMULADA — mini histórico de balanços
// ══════════════════════════════════════════════════════════════
function ProjectionModal() {
  const { monthlyMetrics, accumulatedFutureBalance } = useUser();

  // Calcula balanço mensal e acumulado de cada mês
  const monthData = (() => {
    if (!monthlyMetrics) return [];
    return monthlyMetrics.labels.map((label, i) => {
      const bal =
        (monthlyMetrics.revenues[i] ?? 0) - (monthlyMetrics.expenses[i] ?? 0);
      return { label, bal };
    });
  })().slice(-6); // últimos 6 meses

  const maxAbs = Math.max(...monthData.map((m) => Math.abs(m.bal)), 1);

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Total acumulado */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{
          background: "rgba(14,165,233,0.08)",
          border: "1px solid rgba(14,165,233,0.2)",
        }}
      >
        <div>
          <p
            className="text-xs mb-1"
            style={{ color: "rgba(186,230,253,0.6)" }}
          >
            Acumulado total
          </p>
          <p
            className="money text-2xl font-semibold"
            style={{ color: "#38bdf8" }}
          >
            {fmt(accumulatedFutureBalance)}
          </p>
        </div>
        <TbTrendingUp
          className="h-8 w-8"
          style={{ color: "rgba(56,189,248,0.4)" }}
        />
      </div>

      {/* Mini gráfico de barras */}
      {monthData.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Balanço por mês
          </p>
          <div className="flex items-end gap-1.5" style={{ height: "100px" }}>
            {monthData.map(({ label, bal }, i) => {
              const isLast = i === monthData.length - 1;
              const heightPct = (Math.abs(bal) / maxAbs) * 100;
              const isPos = bal >= 0;
              return (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${Math.max(4, heightPct)}px`,
                      background: isPos ? "var(--green)" : "var(--red)",
                      opacity: isLast ? 1 : 0.5,
                    }}
                    title={`${label}: ${fmt(bal)}`}
                  />
                  <span
                    className="text-[10px] text-center leading-none"
                    style={{
                      color: isLast
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                    }}
                  >
                    {label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p
          className="text-sm text-center py-4"
          style={{ color: "var(--text-muted)" }}
        >
          Registre transações em mais de um mês para ver o histórico.
        </p>
      )}

      {/* Legenda */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: "var(--green)" }}
          />
          Superávit
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: "var(--red)" }}
          />
          Déficit
        </div>
        <span className="ml-auto">Últimos 6 meses</span>
      </div>
    </div>
  );
}
