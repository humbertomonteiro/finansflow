"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { FiBell, FiX, FiAlertCircle, FiClock, FiCheck } from "react-icons/fi";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Retorna quantos dias faltam (negativo = atrasado)
function daysFromToday(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function getDueLabel(days: number): string {
  if (days < -1) return `${Math.abs(days)} dias em atraso`;
  if (days === -1) return "Venceu ontem";
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `Vence em ${days} dias`;
}

// ── Item individual de notificação ─────────────────────────────
interface NotifItemProps {
  transaction: ITransaction;
  onPay: (id: string) => Promise<void>;
  paying: string | null;
}

function NotifItem({ transaction, onPay, paying }: NotifItemProps) {
  // Para FIXED/INSTALLMENT, pega o payment não pago mais próximo
  const pendingPayment = transaction.paymentHistory.find((p) => !p.isPaid);
  const dueDate = pendingPayment?.dueDate ?? transaction.dueDate;
  const amount = pendingPayment?.amount ?? transaction.amount;

  const days = daysFromToday(dueDate);
  const isOverdue = days < 0;
  const isToday = days === 0;
  const isPaying = paying === transaction.id;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 transition-all"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* Indicador de urgência */}
      <div
        className="w-1.5 self-stretch rounded-full shrink-0 mt-0.5"
        style={{
          background: isOverdue
            ? "var(--red)"
            : isToday
            ? "var(--yellow)"
            : "var(--accent-light)",
        }}
      />

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {transaction.description ?? "Sem descrição"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="money text-xs"
            style={{
              color:
                transaction.type === "deposit" ? "var(--green)" : "var(--red)",
            }}
          >
            {fmt(amount)}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            •
          </span>
          <span
            className="text-xs"
            style={{
              color: isOverdue
                ? "var(--red)"
                : isToday
                ? "var(--yellow)"
                : "var(--text-muted)",
            }}
          >
            {getDueLabel(days)}
          </span>
        </div>
      </div>

      {/* Botão pagar */}
      <button
        onClick={() => onPay(transaction.id)}
        disabled={isPaying}
        title={
          transaction.type === "deposit"
            ? "Marcar como recebido"
            : "Marcar como pago"
        }
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-40"
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(34,197,94,0.15)";
          e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
          e.currentTarget.style.color = "var(--green)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-overlay)";
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        {isPaying ? (
          <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <FiCheck className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────
export function NotificationPanel() {
  const { overdueTransactions, nearbyTransactions, payTransaction } = useUser();
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const overdue = overdueTransactions ?? [];
  const nearby = nearbyTransactions ?? [];
  const total = overdue.length + nearby.length;

  // Badge no título da aba
  useEffect(() => {
    const base = "FinansFlow";
    if (total > 0) {
      document.title = `(${total}) ${base}`;
    } else {
      document.title = base;
    }
    return () => {
      document.title = base;
    };
  }, [total]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      await payTransaction(id);
    } finally {
      setPaying(null);
    }
  };

  // ── Botão sino (exportado para uso no Aside) ─────────────────
  const BellButton = (
    <button
      onClick={() => setOpen((p) => !p)}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
      style={{
        background: open ? "var(--accent-dim)" : "transparent",
        border: open
          ? "1px solid var(--border-accent)"
          : "1px solid transparent",
        color: open ? "var(--accent-light)" : "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        if (!open) e.currentTarget.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!open) e.currentTarget.style.background = "transparent";
      }}
      aria-label={`Notificações${total > 0 ? ` (${total})` : ""}`}
    >
      <FiBell className="h-4 w-4" />
      {total > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-0.5"
          style={{
            background: overdue.length > 0 ? "var(--red)" : "var(--yellow)",
            boxShadow: "0 0 6px rgba(239,68,68,0.5)",
          }}
        >
          {total > 9 ? "9+" : total}
        </span>
      )}
    </button>
  );

  // ── Painel dropdown ───────────────────────────────────────────
  const Panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[200] flex flex-col overflow-hidden animate-fade-in-scale"
            style={{
              top: "4rem",
              right: "1rem",
              width: "min(360px, calc(100vw - 2rem))",
              maxHeight: "70vh",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header do painel */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <FiBell
                  className="h-4 w-4"
                  style={{ color: "var(--accent-light)" }}
                />
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Notificações
                </h3>
                {total > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent-light)",
                    }}
                  >
                    {total}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lista scrollável */}
            <div className="overflow-y-auto flex-1">
              {total === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "var(--bg-overlay)" }}
                  >
                    <FiCheck
                      className="h-5 w-5"
                      style={{ color: "var(--green)" }}
                    />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Tudo em dia!
                  </p>
                </div>
              ) : (
                <>
                  {/* Em atraso */}
                  {overdue.length > 0 && (
                    <>
                      <div
                        className="flex items-center gap-2 px-4 py-2 sticky top-0"
                        style={{
                          background: "var(--bg-elevated)",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <FiAlertCircle
                          className="h-3.5 w-3.5"
                          style={{ color: "var(--red)" }}
                        />
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--red)" }}
                        >
                          Em atraso
                        </span>
                        <span
                          className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--red-dim)",
                            color: "var(--red)",
                          }}
                        >
                          {overdue.length}
                        </span>
                      </div>
                      {overdue.map((t) => (
                        <NotifItem
                          key={t.id}
                          transaction={t}
                          onPay={handlePay}
                          paying={paying}
                        />
                      ))}
                    </>
                  )}

                  {/* Vencendo em breve */}
                  {nearby.length > 0 && (
                    <>
                      <div
                        className="flex items-center gap-2 px-4 py-2 sticky top-0"
                        style={{
                          background: "var(--bg-elevated)",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <FiClock
                          className="h-3.5 w-3.5"
                          style={{ color: "var(--yellow)" }}
                        />
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--yellow)" }}
                        >
                          Vencendo em breve
                        </span>
                        <span
                          className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--yellow-dim)",
                            color: "var(--yellow)",
                          }}
                        >
                          {nearby.length}
                        </span>
                      </div>
                      {nearby.map((t) => (
                        <NotifItem
                          key={t.id}
                          transaction={t}
                          onPay={handlePay}
                          paying={paying}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {total > 0 && (
              <div
                className="px-4 py-2.5 shrink-0 text-center"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Clique em{" "}
                  <FiCheck
                    className="inline h-3 w-3"
                    style={{ color: "var(--green)" }}
                  />{" "}
                  para marcar como{" "}
                  {overdue.length > 0 ? "pago/recebido" : "recebido"}
                </p>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return { BellButton, Panel, total };
}
