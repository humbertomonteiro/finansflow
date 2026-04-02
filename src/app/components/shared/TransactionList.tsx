"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/app/hooks/useUser";
import { format, isSameDay, isToday, isYesterday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionItemList } from "./TransactionItemList";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import {
  FiArrowUp,
  FiArrowDown,
  FiCheckSquare,
  FiSquare,
  FiX,
  FiCheck,
  FiLoader,
} from "react-icons/fi";
import { MdOutlineSelectAll } from "react-icons/md";

type SortField = "date" | "amount" | "status";
type SortDir = "asc" | "desc";

interface TransactionsListProps {
  transactions: ITransaction[];
  hideSort?: boolean;
  onRendered?: () => void; // ← novo: chamado após o primeiro render dos grupos
}

export const TransactionList = ({
  transactions,
  hideSort = false,
  onRendered, // ← novo
}: TransactionsListProps) => {
  const { year, month, payTransaction } = useUser();

  // ── Ordenação ────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ── Seleção múltipla ─────────────────────────────────────────
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [isResolvingAll, setIsResolvingAll] = useState(false);
  const [resolveResult, setResolveResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  // ── Helpers ──────────────────────────────────────────────────
  const getPaymentIndex = (transaction: ITransaction): number => {
    return 0;
  };

  const getDisplayDate = (transaction: ITransaction): Date => {
    const idx = getPaymentIndex(transaction);
    if (idx >= 0 && transaction.paymentHistory[idx]) {
      return new Date(transaction.paymentHistory[idx].dueDate);
    }
    return new Date(transaction.dueDate);
  };

  const getDisplayAmount = (transaction: ITransaction): number => {
    const idx = getPaymentIndex(transaction);
    return transaction.paymentHistory[idx]?.amount ?? transaction.amount;
  };

  const isPaid = (transaction: ITransaction): boolean => {
    const idx = getPaymentIndex(transaction);
    return transaction.paymentHistory[idx]?.isPaid ?? false;
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // ── Ordenação e agrupamento ──────────────────────────────────
  const sorted = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = getDisplayDate(a).getTime() - getDisplayDate(b).getTime();
      } else if (sortField === "amount") {
        cmp = getDisplayAmount(a) - getDisplayAmount(b);
      } else if (sortField === "status") {
        cmp = (isPaid(a) ? 1 : 0) - (isPaid(b) ? 1 : 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [transactions, sortField, sortDir, year, month]);

  const grouped = useMemo(() => {
    const groups: { date: Date; transactions: ITransaction[] }[] = [];
    for (const tx of sorted) {
      const date = getDisplayDate(tx);
      const last = groups[groups.length - 1];
      if (!last || !isSameDay(last.date, date)) {
        groups.push({ date, transactions: [tx] });
      } else {
        last.transactions.push(tx);
      }
    }
    return groups;
  }, [sorted]);

  // ── Notifica a página quando os grupos estão renderizados ────
  // Dispara sempre que `grouped` muda (nova lista ou novo mês).
  // A página usa isso como sinal para executar o scrollIntoView.
  useEffect(() => {
    if (grouped.length > 0) onRendered?.();
  }, [grouped]); // eslint-disable-line react-hooks/exhaustive-deps
  // onRendered é intencionalmente omitido das deps: é um callback
  // estável criado com useMemo na página — incluí-lo causaria loop.

  const dateLabel = (date: Date): string => {
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  // ── Métricas da seleção atual ────────────────────────────────
  const selectionMetrics = useMemo(() => {
    const selected = sorted.filter((tx) => selectedIds.has(tx.id));
    let totalReceitas = 0;
    let totalDespesas = 0;
    let pendentes = 0;
    let jaResolvidos = 0;

    for (const tx of selected) {
      const amt = getDisplayAmount(tx);
      const paid = isPaid(tx);
      if (tx.type === TransactionTypes.DEPOSIT) totalReceitas += amt;
      else totalDespesas += amt;
      if (paid) jaResolvidos++;
      else pendentes++;
    }

    return {
      count: selected.length,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      pendentes,
      jaResolvidos,
    };
  }, [selectedIds, sorted, year, month]);

  // ── Handlers de seleção ──────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResolveResult(null);
  };

  const selectAll = () => {
    const allIds = sorted
      .filter((tx) => {
        const idx = getPaymentIndex(tx);
        return !(idx === -1 && tx.kind !== TransactionKind.FIXED);
      })
      .map((tx) => tx.id);
    setSelectedIds(new Set(allIds));
    setResolveResult(null);
  };

  const selectUnpaid = () => {
    const unpaidIds = sorted
      .filter((tx) => !isPaid(tx))
      .filter((tx) => {
        const idx = getPaymentIndex(tx);
        return !(idx === -1 && tx.kind !== TransactionKind.FIXED);
      })
      .map((tx) => tx.id);
    setSelectedIds(new Set(unpaidIds));
    setResolveResult(null);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setResolveResult(null);
  };

  const exitSelectionMode = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
    setResolveResult(null);
  };

  // ── Resolver todos selecionados ──────────────────────────────
  const handleResolveAll = async () => {
    if (selectedIds.size === 0) return;

    const toResolve = sorted.filter((tx) => {
      if (!selectedIds.has(tx.id)) return false;
      if (isPaid(tx)) return false;
      const idx = getPaymentIndex(tx);
      if (idx === -1 && tx.kind !== TransactionKind.FIXED) return false;
      return true;
    });

    if (toResolve.length === 0) {
      setResolveResult({ success: 0, failed: 0 });
      return;
    }

    setIsResolvingAll(true);
    setResolveResult(null);

    const results = await Promise.allSettled(
      toResolve.map((tx) => payTransaction(tx.id))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    setIsResolvingAll(false);
    setResolveResult({ success, failed });
    setSelectedIds(new Set());
  };

  // ── Ordenação UI ─────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer
        ${
          sortField === field
            ? "bg-violet-800 text-violet-200"
            : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
        }`}
    >
      {label}
      {sortField === field &&
        (sortDir === "asc" ? (
          <FiArrowUp className="h-3 w-3" />
        ) : (
          <FiArrowDown className="h-3 w-3" />
        ))}
    </button>
  );

  // ── Empty state ──────────────────────────────────────────────
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">Nenhuma transação encontrada</p>
        <p className="text-gray-700 text-xs mt-1">
          Adicione uma transação pelo botão&nbsp;+
        </p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar superior ─────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {!hideSort && !isSelecting && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 text-xs mr-1">Ordenar:</span>
            <SortButton field="date" label="Data" />
            <SortButton field="amount" label="Valor" />
            <SortButton field="status" label="Status" />
          </div>
        )}

        {isSelecting && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-violet-400 text-xs font-medium">
              {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2 cursor-pointer transition-colors"
            >
              Todos
            </button>
            <button
              onClick={selectUnpaid}
              className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2 cursor-pointer transition-colors"
            >
              Só pendentes
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-gray-600 hover:text-gray-400 underline underline-offset-2 cursor-pointer transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        )}

        <button
          onClick={() =>
            isSelecting ? exitSelectionMode() : setIsSelecting(true)
          }
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
            transition-all cursor-pointer ml-auto
            ${
              isSelecting
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }`}
        >
          {isSelecting ? (
            <>
              <FiX className="h-3 w-3" /> Cancelar
            </>
          ) : (
            <>
              <MdOutlineSelectAll className="h-4 w-4" /> Selecionar
            </>
          )}
        </button>
      </div>

      {/* ── Grupos por dia ───────────────────────────── */}
      <div className="flex flex-col gap-6">
        {grouped.map((group) => {
          const key = format(group.date, "yyyy-MM-dd");
          const totalGroup = group.transactions.reduce((acc, tx) => {
            const amt = getDisplayAmount(tx);
            return acc + (tx.type === TransactionTypes.DEPOSIT ? amt : -amt);
          }, 0);

          const groupIds = group.transactions.map((tx) => tx.id);
          const allGroupSelected =
            groupIds.length > 0 && groupIds.every((id) => selectedIds.has(id));
          const someGroupSelected = groupIds.some((id) => selectedIds.has(id));

          const toggleGroupSelect = () => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (allGroupSelected) {
                groupIds.forEach((id) => next.delete(id));
              } else {
                groupIds.forEach((id) => next.add(id));
              }
              return next;
            });
            setResolveResult(null);
          };

          return (
            // ↓ data-date-group adicionado aqui — é o que a página
            //   usa para localizar o grupo e fazer scrollIntoView
            <div key={key} data-date-group={key}>
              {/* Cabeçalho do grupo */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  {isSelecting && (
                    <button
                      onClick={toggleGroupSelect}
                      className="text-gray-500 hover:text-violet-400 transition-colors cursor-pointer"
                    >
                      {allGroupSelected ? (
                        <FiCheckSquare className="h-4 w-4 text-violet-400" />
                      ) : someGroupSelected ? (
                        <FiCheckSquare className="h-4 w-4 text-violet-600/60" />
                      ) : (
                        <FiSquare className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <h3 className="text-gray-400 text-sm capitalize">
                    {dateLabel(group.date)}
                  </h3>
                </div>
                <span
                  className={`text-xs font-medium ${
                    totalGroup >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {totalGroup >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(totalGroup))}
                </span>
              </div>

              {/* Itens */}
              <ul className="flex flex-col gap-2">
                {group.transactions.map((transaction) => (
                  <TransactionItemList
                    key={`${transaction.id}-${key}`}
                    transaction={
                      transaction as ITransaction & {
                        installmentsNumber?: number;
                      }
                    }
                    index={getPaymentIndex(transaction)}
                    isSelecting={isSelecting}
                    isSelected={selectedIds.has(transaction.id)}
                    onSelect={toggleSelect}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ── Painel flutuante de seleção ───────────────── */}
      {isSelecting &&
        selectedIds.size > 0 &&
        mounted &&
        createPortal(
          <div
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50
            w-[calc(100%-2rem)] max-w-md
            bg-gray-900 border border-violet-800/60 rounded-2xl shadow-2xl
            shadow-violet-900/30 animate-[fadeIn_0.2s_ease-out]"
          >
            <div className="px-4 pt-4 pb-3 border-b border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {selectionMetrics.count} transaç
                  {selectionMetrics.count !== 1 ? "ões" : "ão"} selecionada
                  {selectionMetrics.count !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={exitSelectionMode}
                  className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[0.65rem] text-gray-600 uppercase tracking-wide mb-0.5">
                    Receitas
                  </p>
                  <p className="text-sm font-semibold text-green-400">
                    +{formatCurrency(selectionMetrics.totalReceitas)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] text-gray-600 uppercase tracking-wide mb-0.5">
                    Despesas
                  </p>
                  <p className="text-sm font-semibold text-red-400">
                    -{formatCurrency(selectionMetrics.totalDespesas)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] text-gray-600 uppercase tracking-wide mb-0.5">
                    Resultado
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      selectionMetrics.saldo >= 0
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {selectionMetrics.saldo >= 0 ? "+" : ""}
                    {formatCurrency(selectionMetrics.saldo)}
                  </p>
                </div>
              </div>

              {selectionMetrics.pendentes > 0 && (
                <p className="text-center text-[0.65rem] text-gray-600 mt-2">
                  {selectionMetrics.pendentes} pendente
                  {selectionMetrics.pendentes !== 1 ? "s" : ""}
                  {selectionMetrics.jaResolvidos > 0
                    ? ` · ${selectionMetrics.jaResolvidos} já resolvida${
                        selectionMetrics.jaResolvidos !== 1 ? "s" : ""
                      }`
                    : ""}
                </p>
              )}
              {selectionMetrics.pendentes === 0 &&
                selectionMetrics.jaResolvidos > 0 && (
                  <p className="text-center text-[0.65rem] text-green-700 mt-2">
                    Todas já resolvidas ✓
                  </p>
                )}
            </div>

            {resolveResult && (
              <div
                className={`px-4 py-2 text-xs text-center ${
                  resolveResult.failed > 0
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {resolveResult.success > 0 &&
                  `✓ ${resolveResult.success} resolvida${
                    resolveResult.success !== 1 ? "s" : ""
                  }`}
                {resolveResult.failed > 0 &&
                  ` · ${resolveResult.failed} falharam`}
              </div>
            )}

            <div className="px-4 py-3">
              <button
                onClick={handleResolveAll}
                disabled={isResolvingAll || selectionMetrics.pendentes === 0}
                className={`w-full h-10 rounded-xl flex items-center justify-center gap-2
                font-semibold text-sm transition-all cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  selectionMetrics.pendentes > 0
                    ? "bg-violet-700 hover:bg-violet-600 text-white"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {isResolvingAll ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" /> Resolvendo{" "}
                    {selectionMetrics.pendentes}...
                  </>
                ) : (
                  <>
                    <FiCheck className="h-4 w-4" /> Resolver{" "}
                    {selectionMetrics.pendentes > 0
                      ? `${selectionMetrics.pendentes} pendente${
                          selectionMetrics.pendentes !== 1 ? "s" : ""
                        }`
                      : "selecionadas"}
                  </>
                )}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
