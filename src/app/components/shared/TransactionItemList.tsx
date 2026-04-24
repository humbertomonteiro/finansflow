"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionDetails } from "./TransactionDetails";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { FiCheck, FiX, FiTrash, FiClock } from "react-icons/fi";
import { MdRepeat } from "react-icons/md";

interface TransactionItemListProps {
  transaction: (ITransaction & { installmentsNumber?: number }) | null;
  index: number;
  /** Modo seleção ativo na lista pai */
  isSelecting?: boolean;
  /** Este item está selecionado */
  isSelected?: boolean;
  /** Callback ao clicar no checkbox/card durante seleção */
  onSelect?: (id: string) => void;
}

export const TransactionItemList = ({
  transaction,
  index = -1,
  isSelecting = false,
  isSelected = false,
  onSelect,
}: TransactionItemListProps) => {
  const { categories, accounts, payTransaction, removeTransaction } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [pickerAccountId, setPickerAccountId] = useState<string>("");

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState<"pay" | "delete" | null>(null);

  if (!transaction) return null;

  const payment =
    transaction.paymentHistory[index] ?? transaction.paymentHistory[0];
  const isDeposit = transaction.type === TransactionTypes.DEPOSIT;
  const isFixed = transaction.kind === TransactionKind.FIXED;
  const isInstallment = transaction.kind === TransactionKind.INSTALLMENT;
  const displayAmount = payment?.amount ?? transaction.amount;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(transaction.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const isOverdue = !payment?.isPaid && dueDate < today;
  const isNearby =
    !payment?.isPaid &&
    !isOverdue &&
    dueDate >= today &&
    dueDate.getTime() - today.getTime() <= 10 * 24 * 60 * 60 * 1000;

  const getCategoryName = (id: string) =>
    categories?.find((c) => c.id === id)?.name ?? "Sem categoria";
  const getAccountName = (id: string) =>
    accounts?.find((a) => a.id === id)?.name ?? "Sem conta";
  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // ── Handlers ──────────────────────────────────────────────
  const handleCardClick = () => {
    if (isSelecting) {
      onSelect?.(transaction.id);
    } else {
      setIsExpanded((p) => !p);
    }
  };

  const handlePay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelecting) return;
    if (index === -1 && !isFixed) return;
    // Se já está pago, desfaz diretamente (sem seletor)
    if (payment?.isPaid) {
      setIsPaying(true);
      payTransaction(transaction.id).finally(() => setIsPaying(false));
      return;
    }
    // Se há mais de uma conta, abre o seletor
    if (accounts && accounts.length > 1) {
      setPickerAccountId(transaction.accountId);
      setShowAccountPicker(true);
    } else {
      setIsPaying(true);
      payTransaction(transaction.id).finally(() => setIsPaying(false));
    }
  };

  const handleConfirmPay = async () => {
    setShowAccountPicker(false);
    setIsPaying(true);
    try {
      await payTransaction(
        transaction.id,
        pickerAccountId || transaction.accountId
      );
    } finally {
      setIsPaying(false);
    }
  };

  // ── Swipe (desativado em modo seleção) ────────────────────
  const SWIPE_THRESHOLD = 72;

  const onTouchStart = (e: React.TouchEvent) => {
    if (isSelecting) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeAction(null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (
      isSelecting ||
      touchStartX.current === null ||
      touchStartY.current === null
    )
      return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx)) return;
    const clamped = Math.max(-120, Math.min(120, dx));
    setSwipeOffset(clamped);
    if (clamped > SWIPE_THRESHOLD) setSwipeAction("pay");
    else if (clamped < -SWIPE_THRESHOLD) setSwipeAction("delete");
    else setSwipeAction(null);
  };

  const onTouchEnd = async () => {
    if (isSelecting) return;
    if (swipeAction === "pay" && (index !== -1 || isFixed)) {
      setIsPaying(true);
      try {
        await payTransaction(transaction.id);
      } finally {
        setIsPaying(false);
      }
    } else if (swipeAction === "delete") {
      if (confirm(`Remover "${transaction.description}"?`)) {
        await removeTransaction(
          transaction.id,
          isFixed || isInstallment
            ? (
                await import(
                  "@/domain/enums/transaction/TransactionRemovalScope"
                )
              ).TransactionRemovalScope.CURRENT_MONTH
            : (
                await import(
                  "@/domain/enums/transaction/TransactionRemovalScope"
                )
              ).TransactionRemovalScope.ALL
        );
      }
    }
    setSwipeOffset(0);
    setSwipeAction(null);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // ── Estilos dinâmicos ─────────────────────────────────────
  const borderColor = isSelected
    ? "border-violet-500"
    : isOverdue
    ? "border-red-800"
    : payment?.isPaid
    ? "border-green-900/40"
    : isNearby
    ? "border-yellow-800/60"
    : "border-gray-800";

  const bgColor = isSelected ? "bg-violet-950/40" : "bg-gray-900";

  return (
    <>
      <li className="relative overflow-hidden rounded-xl select-none">
        {/* Fundo swipe */}
        {!isSelecting && (
          <div className="absolute inset-0 flex items-stretch pointer-events-none">
            <div
              className={`flex-1 flex items-center justify-start px-5 transition-opacity
              ${
                swipeAction === "pay"
                  ? "bg-green-800 opacity-100"
                  : "bg-green-900/30 opacity-0"
              }`}
            >
              <FiCheck className="h-6 w-6 text-green-300" />
              <span className="ml-2 text-green-300 text-sm font-semibold">
                {payment?.isPaid ? "Desfazer" : "Pagar"}
              </span>
            </div>
            <div
              className={`flex-1 flex items-center justify-end px-5 transition-opacity
              ${
                swipeAction === "delete"
                  ? "bg-red-800 opacity-100"
                  : "bg-red-900/30 opacity-0"
              }`}
            >
              <span className="mr-2 text-red-300 text-sm font-semibold">
                Remover
              </span>
              <FiTrash className="h-5 w-5 text-red-300" />
            </div>
          </div>
        )}

        {/* Card principal */}
        <div
          className={`relative flex flex-col border ${borderColor} ${bgColor} rounded-xl
            transition-all duration-150 ease-out`}
          style={
            !isSelecting
              ? { transform: `translateX(${swipeOffset}px)` }
              : undefined
          }
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Linha principal */}
          <div
            className="flex items-center gap-3 p-3 cursor-pointer"
            onClick={handleCardClick}
          >
            {/* Checkbox de seleção OU ícone de tipo */}
            {isSelecting ? (
              <div
                className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center
                  transition-all duration-150
                  ${
                    isSelected
                      ? "bg-violet-600 border-violet-500"
                      : "bg-transparent border-gray-600"
                  }`}
              >
                {isSelected && <FiCheck className="h-3 w-3 text-white" />}
              </div>
            ) : (
              <div
                className={`shrink-0 rounded-full p-2
                  ${isDeposit ? "bg-green-700/60" : "bg-red-700/60"}`}
              >
                {isDeposit ? (
                  <IoMdArrowUp className="h-4 w-4 text-green-300" />
                ) : (
                  <IoMdArrowDown className="h-4 w-4 text-red-300" />
                )}
              </div>
            )}

            {/* Descrição + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-gray-200 text-sm font-medium truncate">
                  {transaction.description || "Sem descrição"}
                </p>
                {isOverdue && (
                  <span className="shrink-0 text-[0.65rem] px-2 py-0.5 rounded-full bg-red-900/70 text-red-400 font-semibold flex items-center gap-1">
                    <FiClock className="h-2.5 w-2.5" /> Atrasado
                  </span>
                )}
                {isNearby && (
                  <span className="shrink-0 text-[0.65rem] px-2 py-0.5 rounded-full bg-yellow-900/60 text-yellow-400 font-semibold">
                    Vence em breve
                  </span>
                )}
                {payment?.isPaid && (
                  <span className="shrink-0 text-[0.65rem] px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 font-semibold">
                    Pago
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[0.7rem] bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                  {getCategoryName(transaction.categoryId)}
                </span>
                {isFixed && (
                  <span className="text-[0.7rem] bg-violet-900/50 px-2 py-0.5 rounded-full text-violet-400 flex items-center gap-1">
                    <MdRepeat className="h-2.5 w-2.5" /> Fixo
                  </span>
                )}
                {isInstallment && (
                  <span className="text-[0.7rem] bg-blue-900/50 px-2 py-0.5 rounded-full text-blue-400">
                    {transaction.installmentsNumber}/
                    {transaction.recurrence.installmentsCount}x
                  </span>
                )}
              </div>
            </div>

            {/* Valor */}
            <div className="shrink-0 text-right">
              <p
                className={`text-sm font-semibold ${
                  isDeposit ? "text-green-400" : "text-red-400"
                }`}
              >
                {isDeposit ? "+" : "-"}
                {formatCurrency(displayAmount)}
              </p>
              {isInstallment && transaction.recurrence.installmentsCount && (
                <p className="text-[0.65rem] text-gray-600">
                  total{" "}
                  {formatCurrency(
                    displayAmount *
                      (transaction.recurrence.installmentsCount ?? 1)
                  )}
                </p>
              )}
            </div>

            {/* Botão pagar — oculto em modo seleção */}
            {!isSelecting && (
              <button
                onClick={handlePay}
                disabled={(index === -1 && !isFixed) || isPaying}
                title={
                  payment?.isPaid ? "Desfazer pagamento" : "Marcar como pago"
                }
                className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                  transition-all duration-200 cursor-pointer
                  disabled:opacity-30 disabled:cursor-not-allowed
                  ${
                    payment?.isPaid
                      ? "bg-violet-700 hover:bg-violet-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-400"
                  }
                  ${isPaying ? "animate-pulse" : ""}`}
              >
                {payment?.isPaid ? (
                  <FiCheck className="h-4 w-4" />
                ) : (
                  <FiX className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Expand inline — desativado em modo seleção */}
          {isExpanded && !isSelecting && (
            <div className="border-t border-gray-800 px-4 py-3 flex flex-col gap-2 animate-[fadeIn_0.15s_ease-out]">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div>
                  <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">
                    Vencimento
                  </p>
                  <p className="text-gray-300">
                    {format(transaction.dueDate, "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {payment?.paidAt && (
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">
                      Pago em
                    </p>
                    <p className="text-gray-300">
                      {format(new Date(payment.paidAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">
                    Conta
                  </p>
                  <p className="text-gray-300">
                    {getAccountName(transaction.accountId)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">
                    Tipo
                  </p>
                  <p className="text-gray-300">
                    {isFixed
                      ? "Recorrente"
                      : isInstallment
                      ? "Parcelado"
                      : "Simples"}
                  </p>
                </div>
                {isInstallment && transaction.recurrence.installmentsCount && (
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">
                      Parcela
                    </p>
                    <p className="text-gray-300">
                      {transaction.installmentsNumber} de{" "}
                      {transaction.recurrence.installmentsCount} (
                      {formatCurrency(displayAmount)} / parcela)
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="mt-1 text-[0.7rem] text-violet-400 hover:text-violet-300 underline underline-offset-2 text-left transition-colors cursor-pointer w-fit"
              >
                Ver detalhes completos / Editar
              </button>
            </div>
          )}
        </div>
      </li>

      {isModalOpen && (
        <TransactionDetails
          transaction={transaction}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {showAccountPicker &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
              background: "rgba(7,11,20,0.85)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setShowAccountPicker(false)}
          >
            <div
              className="w-full max-w-sm flex flex-col rounded-2xl animate-fade-in-scale overflow-hidden"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 0 60px rgba(0,0,0,0.6)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {isDeposit
                    ? "Em qual conta foi recebido?"
                    : "Em qual conta foi pago?"}
                </p>
              </div>
              <div className="px-5 py-4 flex flex-col gap-2">
                {accounts?.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setPickerAccountId(acc.id)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 transition-all cursor-pointer"
                    style={{
                      background:
                        pickerAccountId === acc.id
                          ? "var(--accent-dim)"
                          : "var(--bg-overlay)",
                      border: `1px solid ${
                        pickerAccountId === acc.id
                          ? "var(--border-accent)"
                          : "var(--border-subtle)"
                      }`,
                      color:
                        pickerAccountId === acc.id
                          ? "var(--accent-light)"
                          : "var(--text-secondary)",
                    }}
                  >
                    <span className="text-sm font-medium">{acc.name}</span>
                    <div className="flex items-center gap-2">
                      {acc.id === transaction.accountId && (
                        <span
                          className="text-[0.65rem] px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-muted)",
                          }}
                        >
                          cadastrada
                        </span>
                      )}
                      {pickerAccountId === acc.id && (
                        <FiCheck
                          className="h-4 w-4"
                          style={{ color: "var(--accent-light)" }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={handleConfirmPay}
                  className="button button-primary w-full"
                >
                  <FiCheck className="h-4 w-4" />
                  Confirmar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
