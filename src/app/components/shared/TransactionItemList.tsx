"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { FiArrowRight } from "react-icons/fi";
import { BsCreditCard2Front } from "react-icons/bs";
import { useUser } from "@/app/hooks/useUser";
import Link from "next/link";
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
  const isTransfer = transaction.type === TransactionTypes.TRANSFER;
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
      setPickerAccountId(transaction.accountId ?? "");
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
    if (
      swipeAction === "pay" &&
      (index !== -1 || isFixed) &&
      !transaction.creditCardId
    ) {
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
  const cardBorderColor = isSelected
    ? "var(--accent)"
    : isOverdue
    ? "rgba(239,68,68,0.45)"
    : payment?.isPaid
    ? "rgba(34,197,94,0.2)"
    : isNearby
    ? "rgba(245,158,11,0.3)"
    : "var(--border-default)";

  const cardBg = isSelected ? "rgba(99,102,241,0.08)" : "var(--bg-surface)";

  return (
    <>
      <li
        className="relative overflow-hidden rounded-sm select-none"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
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
          className="relative flex flex-col border rounded-sm transition-all duration-150 ease-out"
          style={{
            borderColor: cardBorderColor,
            background: cardBg,
            ...(!isSelecting
              ? { transform: `translateX(${swipeOffset}px)` }
              : {}),
          }}
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
                className="shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-150"
                style={{
                  background: isSelected ? "var(--accent)" : "transparent",
                  borderColor: isSelected
                    ? "var(--accent-light)"
                    : "var(--border-strong)",
                }}
              >
                {isSelected && <FiCheck className="h-3 w-3 text-white" />}
              </div>
            ) : (
              <div
                className="shrink-0 rounded-full p-2"
                style={{
                  background: isTransfer
                    ? "var(--accent-dim)"
                    : isDeposit
                    ? "var(--green-dim)"
                    : "var(--red-dim)",
                }}
              >
                {isTransfer ? (
                  <FiArrowRight
                    className="h-4 w-4"
                    style={{ color: "var(--accent-light)" }}
                  />
                ) : isDeposit ? (
                  <IoMdArrowUp
                    className="h-4 w-4"
                    style={{ color: "var(--green)" }}
                  />
                ) : (
                  <IoMdArrowDown
                    className="h-4 w-4"
                    style={{ color: "var(--red)" }}
                  />
                )}
              </div>
            )}

            {/* Descrição + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {transaction.description || "Sem descrição"}
                </p>
                {isOverdue && !transaction.creditCardId && (
                  <span
                    className="shrink-0 text-[0.65rem] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                    style={{
                      background: "var(--red-dim)",
                      color: "var(--red)",
                    }}
                  >
                    <FiClock className="h-2.5 w-2.5" /> Atrasado
                  </span>
                )}
                {isNearby && !transaction.creditCardId && (
                  <span
                    className="shrink-0 text-[0.65rem] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "var(--yellow-dim)",
                      color: "var(--yellow)",
                    }}
                  >
                    Vence em breve
                  </span>
                )}
                {transaction.creditCardId && (
                  <span
                    className="shrink-0 text-[0.65rem] px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <BsCreditCard2Front className="h-2.5 w-2.5" /> Cartão
                  </span>
                )}
                {payment?.isPaid && (
                  <span
                    className="shrink-0 text-[0.65rem] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "var(--green-dim)",
                      color: "var(--green)",
                    }}
                  >
                    Pago
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {isTransfer ? (
                  <span
                    className="text-[0.7rem] px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent-light)",
                    }}
                  >
                    <FiArrowRight className="h-2.5 w-2.5" />
                    {getAccountName(transaction.accountId ?? "")} →{" "}
                    {getAccountName(transaction.targetAccountId ?? "")}
                  </span>
                ) : (
                  <span
                    className="text-[0.7rem] px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {getCategoryName(transaction.categoryId)}
                  </span>
                )}
                {isFixed && (
                  <span
                    className="text-[0.7rem] px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent-light)",
                    }}
                  >
                    <MdRepeat className="h-2.5 w-2.5" /> Fixo
                  </span>
                )}
                {isInstallment && (
                  <span
                    className="text-[0.7rem] px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent-light)",
                    }}
                  >
                    {transaction.installmentsNumber}/
                    {transaction.recurrence.installmentsCount}x
                  </span>
                )}
              </div>
            </div>

            {/* Valor */}
            <div className="shrink-0 text-right">
              <p
                className="text-sm font-semibold"
                style={{
                  color: isTransfer
                    ? "var(--accent-light)"
                    : isDeposit
                    ? "var(--green)"
                    : "var(--red)",
                }}
              >
                {isTransfer ? "" : isDeposit ? "+" : "-"}
                {formatCurrency(displayAmount)}
              </p>
              {isInstallment && transaction.recurrence.installmentsCount && (
                <p
                  className="text-[0.65rem]"
                  style={{ color: "var(--text-muted)" }}
                >
                  total{" "}
                  {formatCurrency(
                    displayAmount *
                      (transaction.recurrence.installmentsCount ?? 1)
                  )}
                </p>
              )}
            </div>

            {/* Botão pagar / link cartão — oculto em modo seleção */}
            {!isSelecting &&
              (transaction.creditCardId ? (
                <Link
                  href="/credit-cards"
                  onClick={(e) => e.stopPropagation()}
                  title="Ver cartão de crédito"
                  className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 btn-neutral"
                >
                  <BsCreditCard2Front className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={(index === -1 && !isFixed) || isPaying}
                  title={
                    payment?.isPaid ? "Desfazer pagamento" : "Marcar como pago"
                  }
                  className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                    transition-all duration-200 cursor-pointer
                    disabled:opacity-30 disabled:cursor-not-allowed
                    ${payment?.isPaid ? "btn-paid" : "btn-neutral"}
                    ${isPaying ? "animate-pulse" : ""}`}
                >
                  {payment?.isPaid ? (
                    <FiCheck className="h-4 w-4" />
                  ) : (
                    <FiX className="h-4 w-4" />
                  )}
                </button>
              ))}
          </div>

          {/* Expand inline — desativado em modo seleção */}
          {isExpanded && !isSelecting && (
            <div
              className="px-4 py-3 flex flex-col gap-2 animate-[fadeIn_0.15s_ease-out]"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div>
                  <p
                    className="uppercase tracking-wide text-[0.65rem]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Vencimento
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    {format(transaction.dueDate, "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {payment?.paidAt && (
                  <div>
                    <p
                      className="uppercase tracking-wide text-[0.65rem]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Pago em
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {format(new Date(payment.paidAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}
                {isTransfer ? (
                  <div className="col-span-2">
                    <p
                      className="uppercase tracking-wide text-[0.65rem]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Transferência
                    </p>
                    <p
                      className="flex items-center gap-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {getAccountName(transaction.accountId ?? "")}
                      <FiArrowRight
                        className="h-3 w-3 shrink-0"
                        style={{ color: "var(--accent-light)" }}
                      />
                      {getAccountName(transaction.targetAccountId ?? "")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p
                        className="uppercase tracking-wide text-[0.65rem]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Conta
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>
                        {transaction.creditCardId
                          ? "💳 Cartão"
                          : getAccountName(transaction.accountId ?? "")}
                      </p>
                    </div>
                    <div>
                      <p
                        className="uppercase tracking-wide text-[0.65rem]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Tipo
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>
                        {isFixed
                          ? "Recorrente"
                          : isInstallment
                          ? "Parcelado"
                          : "Simples"}
                      </p>
                    </div>
                  </>
                )}
                {isInstallment && transaction.recurrence.installmentsCount && (
                  <div>
                    <p
                      className="uppercase tracking-wide text-[0.65rem]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Parcela
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
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
