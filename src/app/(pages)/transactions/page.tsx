"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { TransactionList } from "@/app/components/shared/TransactionList";
import { Title } from "@/app/components/shared/Title";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

import { CiSearch } from "react-icons/ci";
import { FiX, FiFilter, FiChevronDown, FiCalendar } from "react-icons/fi";
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

// ── Helpers de pagamento ───────────────────────────────────────
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

// ── Retorna a dueDate relevante de uma transação para o mês ────
function getTxDueDate(tx: ITransaction, year: number, month: number): Date {
  const idx = getPaymentIndex(tx, year, month);
  const raw = tx.paymentHistory[idx]?.dueDate ?? tx.dueDate;
  return new Date(raw);
}

// ── Data do grupo mais próximo de hoje numa lista de transações ─
// Estratégia: prefere "hoje" > futuro mais próximo > passado mais recente
function findNearestDate(
  transactions: ITransaction[],
  year: number,
  month: number
): string | null {
  if (!transactions.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Coleta todas as datas únicas (normalizadas para meia-noite)
  const uniqueDates = Array.from(
    new Set(
      transactions.map((tx) => {
        const d = getTxDueDate(tx, year, month);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )
  )
    .map((ts) => new Date(ts))
    .sort((a, b) => a.getTime() - b.getTime());

  const todayTs = today.getTime();

  // 1. Hoje exato
  const exact = uniqueDates.find((d) => d.getTime() === todayTs);
  if (exact) return exact.toISOString().split("T")[0];

  // 2. Futuro mais próximo (próximo dia com transação)
  const future = uniqueDates.find((d) => d.getTime() > todayTs);
  if (future) return future.toISOString().split("T")[0];

  // 3. Passado mais recente (último dia do mês que já passou)
  const past = [...uniqueDates].reverse().find((d) => d.getTime() < todayTs);
  if (past) return past.toISOString().split("T")[0];

  return null;
}

// ── Componente ─────────────────────────────────────────────────
export default function Transactions() {
  const { transactions, categories, metrics, currentBalance, year, month } =
    useUser();

  // ── Filtros ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Hoje no formato YYYY-MM-DD (local)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);
  const isToday = dateFrom === todayStr && dateTo === todayStr;

  // ── Auto-scroll ─────────────────────────────────────────────
  // targetDate guarda qual data-group deve receber scroll.
  // Só é definido na primeira carga de cada mês — muda de mês reseta.
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const scrolledRef = useRef(false); // garante que scroll ocorre só 1x por carga

  // Quando as transações carregam ou o mês muda, calcula a data-alvo
  useEffect(() => {
    scrolledRef.current = false;
    setTargetDate(null);
    if (transactions && transactions.length > 0) {
      const nearest = findNearestDate(transactions, year, month);
      setTargetDate(nearest);
    }
  }, [transactions, year, month]);

  // Callback chamado pelo TransactionList quando termina de renderizar
  // os grupos — nesse momento os data-date-group já existem no DOM
  const handleListRendered = useMemo(
    () => () => {
      if (!targetDate || scrolledRef.current) return;
      scrolledRef.current = true;

      // Pequeno delay para garantir que o DOM foi pintado
      requestAnimationFrame(() => {
        const el = document.querySelector(
          `[data-date-group="${targetDate}"]`
        ) as HTMLElement | null;

        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });

          // Compensa o header fixo (mobile ~56px, desktop ~0) e dá um respiro
          setTimeout(() => {
            window.scrollBy({ top: -80, behavior: "smooth" });
          }, 100);
        }
      });
    },
    [targetDate]
  );

  // ── Filtragem ────────────────────────────────────────────────
  const filtered = useMemo<ITransaction[]>(() => {
    if (!transactions) return [];
    return transactions.filter((tx) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!tx.description?.toLowerCase().includes(q)) return false;
      }
      if (typeFilter === "deposit" && tx.type !== TransactionTypes.DEPOSIT)
        return false;
      if (typeFilter === "withdraw" && tx.type !== TransactionTypes.WITHDRAW)
        return false;
      if (kindFilter !== "all" && tx.kind !== kindFilter) return false;
      if (categoryFilter !== "all" && tx.categoryId !== categoryFilter)
        return false;
      if (statusFilter !== "all") {
        const paid = isTxPaid(tx, year, month);
        if (statusFilter === "paid" && !paid) return false;
        if (statusFilter === "unpaid" && paid) return false;
      }
      if (dateFrom || dateTo) {
        const txDate = getTxDueDate(tx, year, month);
        const txLocal = new Date(
          txDate.getFullYear(),
          txDate.getMonth(),
          txDate.getDate()
        );
        if (dateFrom) {
          const [fy, fm, fd] = dateFrom.split("-").map(Number);
          if (txLocal < new Date(fy, fm - 1, fd)) return false;
        }
        if (dateTo) {
          const [ty, tm, td] = dateTo.split("-").map(Number);
          if (txLocal > new Date(ty, tm - 1, td)) return false;
        }
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
    dateFrom,
    dateTo,
    year,
    month,
  ]);

  // ── Métricas do resultado filtrado ───────────────────────────
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

  const activeFilterCount = [
    statusFilter !== "all",
    typeFilter !== "all",
    kindFilter !== "all",
    categoryFilter !== "all",
    !!(dateFrom || dateTo),
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setKindFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const availableCategories = useMemo(() => {
    if (!categories || !transactions) return [];
    const usedIds = new Set(transactions.map((tx) => tx.categoryId));
    return categories.filter((c) => usedIds.has(c.id));
  }, [categories, transactions]);

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

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-48">
      <Title navigateMonth>Transações</Title>

      {/* Cards de contexto */}
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
          },
          {
            label: "Receitas do mês",
            value: fmt(metrics?.revenues ?? 0),
            icon: <RiArrowUpCircleLine className="h-4 w-4" />,
            color: "var(--green)",
          },
          {
            label: "Despesas do mês",
            value: fmt(metrics?.expenses ?? 0),
            icon: <RiArrowDownCircleLine className="h-4 w-4" />,
            color: "var(--red)",
          },
          {
            label: "Balanço",
            value: fmt(metrics?.futureBalance ?? 0),
            icon: <TbScale className="h-4 w-4" />,
            color:
              (metrics?.futureBalance ?? 0) >= 0
                ? "var(--green)"
                : "var(--red)",
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

      {/* Barra de busca + filtros */}
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

      {/* Painel filtros avançados */}
      {showFilters && (
        <div
          className="rounded-xl p-4 flex flex-col gap-4 animate-fade-in"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
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
          {/* Data */}
          <div>
            <p
              className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Data
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  De
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: dateFrom ? "var(--text-primary)" : "var(--text-muted)",
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Até
                </span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: dateTo ? "var(--text-primary)" : "var(--text-muted)",
                    colorScheme: "dark",
                  }}
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="flex items-center gap-1 text-xs cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  <FiX className="h-3 w-3" /> limpar data
                </button>
              )}
            </div>
            {/* Atalho: Hoje */}
            <div className="flex gap-1.5 mt-2">
              {[
                { label: "Hoje", from: todayStr, to: todayStr },
                {
                  label: "Esta semana",
                  from: (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - d.getDay());
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })(),
                  to: todayStr,
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const active = dateFrom === preset.from && dateTo === preset.to;
                    setDateFrom(active ? "" : preset.from);
                    setDateTo(active ? "" : preset.to);
                  }}
                  className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full cursor-pointer transition-all"
                  style={{
                    background:
                      dateFrom === preset.from && dateTo === preset.to
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    color:
                      dateFrom === preset.from && dateTo === preset.to
                        ? "var(--accent-light)"
                        : "var(--text-muted)",
                    border:
                      dateFrom === preset.from && dateTo === preset.to
                        ? "1px solid var(--border-accent)"
                        : "1px solid var(--border-subtle)",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="self-start text-xs underline underline-offset-2 cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      )}

      {/* Chips rápidos */}
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
        <Chip
          active={isToday}
          onClick={() => {
            if (isToday) {
              setDateFrom("");
              setDateTo("");
            } else {
              setDateFrom(todayStr);
              setDateTo(todayStr);
            }
          }}
        >
          <FiCalendar className="h-3 w-3" />
          Hoje
        </Chip>
      </div>

      {/* Lista */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
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

        <div className="p-4">
          {filtered.length > 0 ? (
            <TransactionList
              transactions={filtered}
              hideSort={false}
              onRendered={handleListRendered}
            />
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
