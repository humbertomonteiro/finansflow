"use client";

import { useEffect, useMemo, useState } from "react";
import { useAmountInput } from "@/app/hooks/useAmountInput";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { AnnualMetrics } from "@/domain/usecases/transaction/AnnualMetricsUsecase";
import { CategoryExpensesSummary } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
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
          {type === "projection" && <ProjectionModal onClose={onClose} />}
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
// 5. PROJEÇÃO ANUAL — balanço projetado jan-dez + simulador
// ══════════════════════════════════════════════════════════════
function ProjectionModal({ onClose }: { onClose: () => void }) {
  const {
    allTransactions,
    transactions,
    currentBalance,
    accumulatedFutureBalance,
    year,
    month,
  } = useUser();
  const router = useRouter();

  const [investPct, setInvestPct] = useState(100);
  const [annualRate, setAnnualRate] = useState(12);

  const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  // Net (receitas − despesas) de TODAS as transações para cada mês
  const monthlyNets = useMemo(() => {
    if (!allTransactions) return new Array(12).fill(0) as number[];
    const nets = new Array(12).fill(0) as number[];
    for (const t of allTransactions) {
      const sign = t.type === TransactionTypes.DEPOSIT ? 1 : -1;
      if (t.kind === TransactionKind.SIMPLE) {
        const d = new Date(t.dueDate);
        if (d.getFullYear() === year) nets[d.getMonth()] += sign * t.amount;
      } else if (t.kind === TransactionKind.INSTALLMENT) {
        const excl = t.recurrence?.excludedInstallments ?? [];
        const end = t.recurrence?.endDate ? new Date(t.recurrence.endDate) : null;
        t.paymentHistory.forEach((p, idx) => {
          if (excl.includes(idx + 1)) return;
          const d = new Date(p.dueDate);
          if (d.getFullYear() !== year) return;
          if (end && d > end) return;
          nets[d.getMonth()] += sign * p.amount;
        });
      } else if (t.kind === TransactionKind.FIXED) {
        const start = new Date(t.dueDate);
        const end = t.recurrence?.endDate ? new Date(t.recurrence.endDate) : null;
        const excl = (t.recurrence?.excludedFixeds ?? []) as Array<{ year: number; month: number }>;
        for (let m = 1; m <= 12; m++) {
          const occ = new Date(year, m - 1, start.getDate());
          if (occ < start) continue;
          if (end && occ > end) continue;
          if (excl.some((ef) => ef.year === year && ef.month === m)) continue;
          const pay = t.paymentHistory.find((p) => {
            const d = new Date(p.dueDate);
            return d.getFullYear() === year && d.getMonth() + 1 === m;
          });
          nets[m - 1] += sign * (pay?.amount ?? t.amount);
        }
      }
    }
    return nets;
  }, [allTransactions, year]);

  // Saldo no início do mês atual (remove pagamentos já feitos neste mês)
  const anchor = useMemo(() => {
    const paid = (transactions ?? []).reduce((sum, t) => {
      if (!(t.paymentHistory[0]?.isPaid ?? false)) return sum;
      return sum + (t.type === TransactionTypes.DEPOSIT ? t.amount : -t.amount);
    }, 0);
    return currentBalance - paid;
  }, [transactions, currentBalance]);

  // Projeção base (sem investimento)
  const projectedBalances = useMemo(() => {
    const r = new Array(12).fill(0) as number[];
    r[month - 1] = anchor + monthlyNets[month - 1];
    for (let i = month; i < 12; i++) r[i] = r[i - 1] + monthlyNets[i];
    for (let i = month - 2; i >= 0; i--) r[i] = r[i + 1] - monthlyNets[i + 1];
    return r;
  }, [anchor, monthlyNets, month]);

  // Projeção com juros compostos
  const investedBalances = useMemo(() => {
    if (investPct <= 0 || annualRate <= 0) return projectedBalances;
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const r = [...projectedBalances];
    let free = anchor;
    let invested = 0;
    for (let i = month - 1; i < 12; i++) {
      invested *= 1 + monthlyRate;
      const delta = monthlyNets[i];
      if (delta > 0) {
        const toInvest = delta * (investPct / 100);
        free += delta - toInvest;
        invested += toInvest;
      } else {
        free += delta;
        if (free < 0) {
          invested += free; // resgata o que falta
          free = 0;
          if (invested < 0) invested = 0;
        }
      }
      r[i] = free + invested;
    }
    return r;
  }, [anchor, monthlyNets, month, projectedBalances, investPct, annualRate]);

  const hasInvestment = investPct > 0 && annualRate > 0;
  const labelSeries = hasInvestment ? investedBalances : projectedBalances;

  const decBal = projectedBalances[11];
  const decInvested = investedBalances[11];
  const gain = decInvested - decBal;

  // ── SVG ──────────────────────────────────────────────────────
  const W = 340, H = 158;
  const pL = 4, pR = 4, pT = 22, pB = 20;
  const cW = W - pL - pR;
  const cH = H - pT - pB;

  const allVals = [...projectedBalances, ...investedBalances];
  const minVal = Math.min(...allVals, 0);
  const maxVal = Math.max(...allVals, 0);
  const range = maxVal - minVal || 1;

  const gx = (i: number) => pL + (i / 11) * cW;
  const gy = (v: number) => pT + cH - ((v - minVal) / range) * cH;

  const basePts = projectedBalances.map((v, i) => `${gx(i).toFixed(1)},${gy(v).toFixed(1)}`).join(" ");
  const invPts  = investedBalances.map((v, i) => `${gx(i).toFixed(1)},${gy(v).toFixed(1)}`).join(" ");
  const area    = `${gx(0).toFixed(1)},${H - pB} ${basePts} ${gx(11).toFixed(1)},${H - pB}`;

  const fmtShort = (v: number) => {
    const abs = Math.abs(v), s = v < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${s}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `${s}${(abs / 1_000).toFixed(1)}k`;
    return `${s}${abs.toFixed(0)}`;
  };

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Acumulado total */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)" }}
      >
        <div>
          <p className="text-xs mb-1" style={{ color: "rgba(186,230,253,0.6)" }}>
            Acumulado total
          </p>
          <p className="money text-2xl font-semibold" style={{ color: "#38bdf8" }}>
            {fmt(accumulatedFutureBalance)}
          </p>
        </div>
        <TbTrendingUp className="h-8 w-8" style={{ color: "rgba(56,189,248,0.4)" }} />
      </div>

      {/* Gráfico Jan–Dez com rótulos de valor */}
      <div>
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Balanço projetado {year}
        </p>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="proj-grad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {minVal < 0 && maxVal > 0 && (
            <line x1={pL} y1={gy(0)} x2={pL + cW} y2={gy(0)}
              stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" strokeWidth="1" />
          )}

          <polygon points={area} fill="url(#proj-grad2)" />

          {month > 1 && (
            <rect x={pL} y={pT} width={gx(month - 1) - pL} height={cH}
              fill="rgba(7,11,20,0.28)" />
          )}

          <line x1={gx(month - 1)} y1={pT} x2={gx(month - 1)} y2={H - pB}
            stroke="rgba(99,102,241,0.45)" strokeDasharray="3,2" strokeWidth="1" />

          {/* Linha base (tracejada e mais fraca quando há investimento) */}
          <polyline points={basePts} fill="none"
            stroke={hasInvestment ? "rgba(56,189,248,0.35)" : "#38bdf8"}
            strokeWidth={hasInvestment ? 1.5 : 2}
            strokeDasharray={hasInvestment ? "5,2" : undefined}
            strokeLinejoin="round" strokeLinecap="round" />

          {/* Linha investida */}
          {hasInvestment && (
            <polyline points={invPts} fill="none"
              stroke="var(--green)" strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Rótulos de valor em cada ponto */}
          {labelSeries.map((v, i) => (
            <text key={i}
              x={gx(i)} y={Math.max(8, gy(v) - 5)}
              textAnchor="middle" fontSize="7.5"
              fontWeight={i === month - 1 || i === 11 ? "700" : "400"}
              fill={v >= 0
                ? (i === month - 1 || i === 11 ? "#94a3b8" : "#4b5563")
                : "var(--red)"}
            >
              {fmtShort(v)}
            </text>
          ))}

          {/* Ponto do mês atual */}
          <circle cx={gx(month - 1)} cy={gy(labelSeries[month - 1])}
            r="3.5" fill="#6366f1" stroke="white" strokeWidth="1.5" />

          {/* Ponto de dezembro */}
          <circle cx={gx(11)} cy={gy(labelSeries[11])}
            r="3.5"
            fill={labelSeries[11] >= 0 ? (hasInvestment ? "var(--green)" : "#38bdf8") : "var(--red)"}
            stroke="white" strokeWidth="1.5" />

          {/* Rótulos dos meses */}
          {MONTHS.map((label, i) => (
            <text key={i} x={gx(i)} y={H - 4}
              textAnchor="middle" fontSize="8.5"
              fill={i === month - 1 ? "#c7d2fe" : i === 11 ? "#94a3b8" : "#374151"}
            >
              {label}
            </text>
          ))}
        </svg>

        {/* Legenda das linhas */}
        <div className="flex items-center gap-4 mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
            Mês atual
          </div>
          {hasInvestment ? (
            <>
              <div className="flex items-center gap-1.5">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,2"/></svg>
                Sem investir
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="var(--green)" strokeWidth="2"/></svg>
                Investindo
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#38bdf8" strokeWidth="2"/></svg>
              Projeção
            </div>
          )}
        </div>
      </div>

      {/* Simulador de rendimento */}
      <div
        className="flex flex-col gap-3 p-3 rounded-xl"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Simulador de rendimento
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
              % do saldo positivo
            </p>
            <div className="relative">
              <input
                type="number" min="0" max="100"
                value={investPct}
                onChange={(e) =>
                  setInvestPct(Math.min(100, Math.max(0, Number(e.target.value))))
                }
                className="input text-sm w-full pr-7"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              >%</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
              Taxa anual
            </p>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.1"
                value={annualRate}
                onChange={(e) =>
                  setAnnualRate(Math.min(100, Math.max(0, Number(e.target.value))))
                }
                className="input text-sm w-full pr-14"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              >% a.a.</span>
            </div>
          </div>
        </div>

        {/* Comparativo (só aparece quando há simulação ativa) */}
        {hasInvestment && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div
              className="p-2.5 rounded-lg flex flex-col gap-0.5"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>Sem investir</p>
              <p className="money text-xs font-semibold"
                style={{ color: decBal >= 0 ? "var(--text-primary)" : "var(--red)" }}>
                {fmt(decBal)}
              </p>
            </div>
            <div
              className="p-2.5 rounded-lg flex flex-col gap-0.5"
              style={{ background: "var(--bg-elevated)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
                Investindo {investPct}%
              </p>
              <p className="money text-xs font-semibold" style={{ color: "var(--green)" }}>
                {fmt(decInvested)}
              </p>
            </div>
            <div
              className="p-2.5 rounded-lg flex flex-col gap-0.5"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
            >
              <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>Rendimento</p>
              <p className="money text-xs font-semibold"
                style={{ color: gain >= 0 ? "var(--green)" : "var(--red)" }}>
                {gain >= 0 ? "+" : ""}{fmt(gain)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Saber mais → /performance */}
      <button
        onClick={() => { router.push("/performance"); onClose(); }}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all cursor-pointer"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      >
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ver análise completa em Performance
        </span>
        <FiArrowRight className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
      </button>
    </div>
  );
}
