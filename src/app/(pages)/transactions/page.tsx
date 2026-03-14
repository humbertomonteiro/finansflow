"use client";

import { useMemo, useState } from "react";
import { TransactionList } from "@/app/components/shared/TransactionList";
import { Title } from "@/app/components/shared/Title";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

import { CiSearch } from "react-icons/ci";
import { FiX, FiFilter, FiChevronDown } from "react-icons/fi";
import {
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";
import { TbScale } from "react-icons/tb";

// ── Tipos ──────────────────────────────────────────────────────
type StatusFilter = "all" | "paid" | "unpaid";
type TypeFilter = "all" | "deposit" | "withdraw";
type KindFilter = "all" | "simple" | "fixed" | "installment";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── Helpers de pagamento (mesmos do TransactionList) ───────────
function getPaymentIndex(
  tx: ITransaction,
  year: number,
  month: number
): number {
  const idx = tx.paymentHistory.findIndex(
    (p) =>
      new Date(p.dueDate).getFullYear() === year &&
      new Date(p.dueDate).getMonth() + 1 === month
  );
  if (idx === -1 && tx.kind === TransactionKind.FIXED) return 0;
  return idx;
}

function isTxPaid(tx: ITransaction, year: number, month: number): boolean {
  const idx = getPaymentIndex(tx, year, month);
  return tx.paymentHistory[idx]?.isPaid ?? false;
}

// ── Componente ─────────────────────────────────────────────────
export default function Transactions() {
  const {
    transactions,
    categories,
    metrics,
    currentBalance,
    accumulatedFutureBalance,
    year,
    month,
  } = useUser();

  // ── Estado dos filtros ──────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // ── Filtragem com useMemo (sem useEffect — evita closure stale) ──
  const filtered = useMemo<ITransaction[]>(() => {
    if (!transactions) return [];

    return transactions.filter((tx) => {
      // Busca por descrição
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!tx.description?.toLowerCase().includes(q)) return false;
      }

      // Tipo: receita / despesa
      if (typeFilter === "deposit" && tx.type !== TransactionTypes.DEPOSIT)
        return false;
      if (typeFilter === "withdraw" && tx.type !== TransactionTypes.WITHDRAW)
        return false;

      // Kind: simples / fixo / parcelado
      if (kindFilter !== "all" && tx.kind !== kindFilter) return false;

      // Categoria
      if (categoryFilter !== "all" && tx.categoryId !== categoryFilter)
        return false;

      // Status: pago / não pago
      if (statusFilter !== "all") {
        const paid = isTxPaid(tx, year, month);
        if (statusFilter === "paid" && !paid) return false;
        if (statusFilter === "unpaid" && paid) return false;
      }

      return true;
    });
  }, [
    transactions,
    search,
    statusFilter,
    typeFilter,
    kindFilter,
    categoryFilter,
    year,
    month,
  ]);

  // ── Métricas do resultado filtrado ─────────────────────────
  const filteredMetrics = useMemo(() => {
    let revenues = 0,
      expenses = 0,
      pendingCount = 0,
      paidCount = 0;
    for (const tx of filtered) {
      const idx = getPaymentIndex(tx, year, month);
      const amt = tx.paymentHistory[idx]?.amount ?? tx.amount;
      const paid = tx.paymentHistory[idx]?.isPaid ?? false;
      if (tx.type === TransactionTypes.DEPOSIT) revenues += amt;
      else expenses += amt;
      if (paid) paidCount++;
      else pendingCount++;
    }
    return {
      revenues,
      expenses,
      balance: revenues - expenses,
      pendingCount,
      paidCount,
    };
  }, [filtered, year, month]);

  // ── Filtros ativos (para badge de "N filtros ativos") ───────
  const activeFilterCount = [
    statusFilter !== "all",
    typeFilter !== "all",
    kindFilter !== "all",
    categoryFilter !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setKindFilter("all");
    setCategoryFilter("all");
  };

  // ── Categorias disponíveis (apenas as que aparecem no mês) ──
  const availableCategories = useMemo(() => {
    if (!categories || !transactions) return [];
    const usedIds = new Set(transactions.map((tx) => tx.categoryId));
    return categories.filter((c) => usedIds.has(c.id));
  }, [categories, transactions]);

  // ── UI helpers ──────────────────────────────────────────────
  const chipBase =
    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap select-none";

  function Chip({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        className={chipBase}
        style={{
          background: active ? "var(--accent-dim)" : "var(--bg-elevated)",
          color: active ? "var(--accent-light)" : "var(--text-secondary)",
          border: active
            ? "1px solid var(--border-accent)"
            : "1px solid var(--border-subtle)",
        }}
      >
        {children}
      </button>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 animate-fade-in b-52">
      <Title navigateMonth>Transações</Title>

      {/* ── Cards de contexto ─────────────────────────── */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 rounded-xl overflow-hidden"
        style={{
          border: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
        }}
      >
        {[
          {
            label: "Saldo atual",
            value: fmt(currentBalance ?? 0),
            icon: <RiMoneyDollarCircleLine className="h-4 w-4" />,
            color: (currentBalance ?? 0) >= 0 ? "var(--green)" : "var(--red)",
            hidden: false,
          },
          {
            label: "Receitas do mês",
            value: fmt(metrics?.revenues ?? 0),
            icon: <RiArrowUpCircleLine className="h-4 w-4" />,
            color: "var(--green)",
            hidden: false,
          },
          {
            label: "Despesas do mês",
            value: fmt(metrics?.expenses ?? 0),
            icon: <RiArrowDownCircleLine className="h-4 w-4" />,
            color: "var(--red)",
            hidden: false,
          },
          {
            label: "Balanço",
            value: fmt(metrics?.futureBalance ?? 0),
            icon: <TbScale className="h-4 w-4" />,
            color:
              (metrics?.futureBalance ?? 0) >= 0
                ? "var(--green)"
                : "var(--red)",
            hidden: false,
          },
        ].map((item, i) => (
          <div
            key={item.label}
            className="p-4 flex flex-col gap-1"
            style={{
              borderRight: i < 3 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </p>
              <span style={{ color: item.color }}>{item.icon}</span>
            </div>
            <p
              className="money text-base font-medium"
              style={{ color: item.color }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Barra de busca + botão filtros ───────────── */}
      <div className="flex gap-2">
        <div
          className="flex items-center gap-2 flex-1 px-3 rounded-xl h-10"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <CiSearch
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ color: "var(--text-muted)" }}
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Botão filtros avançados */}
        <button
          onClick={() => setShowFilters((p) => !p)}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium transition-all cursor-pointer"
          style={{
            background:
              showFilters || activeFilterCount > 0
                ? "var(--accent-dim)"
                : "var(--bg-surface)",
            color:
              showFilters || activeFilterCount > 0
                ? "var(--accent-light)"
                : "var(--text-secondary)",
            border:
              showFilters || activeFilterCount > 0
                ? "1px solid var(--border-accent)"
                : "1px solid var(--border-default)",
          }}
        >
          <FiFilter className="h-3.5 w-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <span
              className="text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {activeFilterCount}
            </span>
          )}
          <FiChevronDown
            className="h-3 w-3 transition-transform"
            style={{
              transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {/* ── Painel de filtros avançados ───────────────── */}
      {showFilters && (
        <div
          className="rounded-xl p-4 flex flex-col gap-4 animate-fade-in"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {/* Status */}
          <div>
            <p
              className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "unpaid", "paid"] as StatusFilter[]).map((v) => (
                <Chip
                  key={v}
                  active={statusFilter === v}
                  onClick={() => setStatusFilter(v)}
                >
                  {v === "all"
                    ? "Todos"
                    : v === "paid"
                    ? "✓ Resolvidos"
                    : "○ Pendentes"}
                </Chip>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <p
              className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Tipo
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "deposit", "withdraw"] as TypeFilter[]).map((v) => (
                <Chip
                  key={v}
                  active={typeFilter === v}
                  onClick={() => setTypeFilter(v)}
                >
                  {v === "all"
                    ? "Todos"
                    : v === "deposit"
                    ? "↑ Receitas"
                    : "↓ Despesas"}
                </Chip>
              ))}
            </div>
          </div>

          {/* Recorrência */}
          <div>
            <p
              className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Recorrência
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "simple", "fixed", "installment"] as KindFilter[]).map(
                (v) => (
                  <Chip
                    key={v}
                    active={kindFilter === v}
                    onClick={() => setKindFilter(v)}
                  >
                    {v === "all"
                      ? "Todos"
                      : v === "simple"
                      ? "Simples"
                      : v === "fixed"
                      ? "Fixo"
                      : "Parcelado"}
                  </Chip>
                )
              )}
            </div>
          </div>

          {/* Categoria */}
          {availableCategories.length > 0 && (
            <div>
              <p
                className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Categoria
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={categoryFilter === "all"}
                  onClick={() => setCategoryFilter("all")}
                >
                  Todas
                </Chip>
                {availableCategories.map((cat) => (
                  <Chip
                    key={cat.id}
                    active={categoryFilter === cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Limpar filtros */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="self-start text-xs underline underline-offset-2 transition-colors cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      )}

      {/* ── Chips rápidos de status (visíveis sempre) ─── */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", "unpaid", "paid"] as StatusFilter[]).map((v) => (
          <Chip
            key={v}
            active={statusFilter === v}
            onClick={() => setStatusFilter(v)}
          >
            {v === "all"
              ? `Todas (${transactions?.length ?? 0})`
              : v === "unpaid"
              ? `Pendentes (${
                  transactions?.filter((tx) => !isTxPaid(tx, year, month))
                    .length ?? 0
                })`
              : `Resolvidas (${
                  transactions?.filter((tx) => isTxPaid(tx, year, month))
                    .length ?? 0
                })`}
          </Chip>
        ))}
        <Chip
          active={typeFilter === "deposit"}
          onClick={() =>
            setTypeFilter(typeFilter === "deposit" ? "all" : "deposit")
          }
        >
          ↑ Receitas
        </Chip>
        <Chip
          active={typeFilter === "withdraw"}
          onClick={() =>
            setTypeFilter(typeFilter === "withdraw" ? "all" : "withdraw")
          }
        >
          ↓ Despesas
        </Chip>
      </div>

      {/* ── Resumo do filtro atual ────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Header com contagem e métricas do resultado */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {filtered.length === 0
                ? "Nenhuma transação"
                : `${filtered.length} transaç${
                    filtered.length !== 1 ? "ões" : "ão"
                  }`}
            </p>
            {(activeFilterCount > 0 || search) && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                filtrada{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Mini métricas do resultado filtrado */}
          {filtered.length > 0 && (
            <div className="hidden md:flex items-center gap-4">
              <span className="money text-xs" style={{ color: "var(--green)" }}>
                +{fmt(filteredMetrics.revenues)}
              </span>
              <span className="money text-xs" style={{ color: "var(--red)" }}>
                -{fmt(filteredMetrics.expenses)}
              </span>
              <span
                className="money text-xs font-semibold"
                style={{
                  color:
                    filteredMetrics.balance >= 0
                      ? "var(--green)"
                      : "var(--red)",
                }}
              >
                = {fmt(filteredMetrics.balance)}
              </span>
              <span
                className="text-[0.65rem] px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--yellow-dim)",
                  color: "var(--yellow)",
                }}
              >
                {filteredMetrics.pendingCount} pendente
                {filteredMetrics.pendingCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="p-4">
          {filtered.length > 0 ? (
            <TransactionList transactions={filtered} hideSort={false} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--bg-overlay)" }}
              >
                <CiSearch
                  className="h-6 w-6"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Nenhuma transação encontrada
              </p>
              <p
                className="text-xs text-center max-w-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {activeFilterCount > 0 || search
                  ? "Tente ajustar os filtros ou limpar a busca"
                  : "Adicione transações pelo botão + na barra lateral"}
              </p>
              {(activeFilterCount > 0 || search) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs underline underline-offset-2 mt-1 cursor-pointer"
                  style={{ color: "var(--accent-light)" }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
