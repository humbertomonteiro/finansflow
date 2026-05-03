"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { ICreditCard } from "@/domain/interfaces/creditcard/ICreditCard";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { getBillingPeriod } from "@/utils/getBillingPeriod";
import { createTransactionController } from "@/controllers/transaction/CreateTransactionController";
import { payerTransactionController } from "@/controllers/transaction/PayerTransactionController";
import { BsCreditCard2Front } from "react-icons/bs";
import { FiArrowRight, FiX } from "react-icons/fi";
import Link from "next/link";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── Modal para pagar fatura ────────────────────────────────────────────────────
function PayInvoiceModal({
  card,
  invoiceAmount,
  onClose,
}: {
  card: ICreditCard;
  invoiceAmount: number;
  onClose: () => void;
}) {
  const { accounts, addTransaction, refreshAccounts } = useUser();
  const [accountId, setAccountId] = useState(accounts?.[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!accountId) {
      setError("Selecione uma conta.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const tx = await createTransactionController({
        accountId,
        type: TransactionTypes.WITHDRAW,
        kind: TransactionKind.SIMPLE,
        description: `Fatura ${card.name}`,
        amount: invoiceAmount,
        dueDate: today,
        categoryId: "",
        recurrence: {},
      });
      // mark as paid immediately
      await payerTransactionController(
        tx.id,
        today.getFullYear(),
        today.getMonth() + 1,
        accountId
      );
      addTransaction(tx);
      await refreshAccounts();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao registrar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Pagar fatura · {card.name}
          </p>
          <button onClick={onClose}>
            <FiX className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "var(--bg-overlay)" }}
        >
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            Valor da fatura
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--red)" }}>
            {fmt(invoiceAmount)}
          </p>
        </div>

        <div>
          <label
            className="text-xs mb-1 block"
            style={{ color: "var(--text-muted)" }}
          >
            Debitar da conta
          </label>
          <select
            className="input w-full"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {(accounts ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {fmt(a.balance)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-xs" style={{ color: "var(--red)" }}>
            {error}
          </p>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="button button-primary w-full"
        >
          {loading ? "Registrando..." : `Pagar ${fmt(invoiceAmount)}`}
        </button>
      </div>
    </div>
  );
}

// ── Card mini (por cartão) ─────────────────────────────────────────────────────
function CardMini({
  card,
  transactions,
  onPay,
}: {
  card: ICreditCard;
  transactions: ITransaction[];
  onPay: (amount: number) => void;
}) {
  const { start, end } = getBillingPeriod(card.closingDay);

  const { billTotal, totalCommitted } = useMemo(() => {
    let bill = 0;
    let committed = 0;

    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);

      if (t.kind === TransactionKind.INSTALLMENT) {
        t.paymentHistory.forEach((p, idx) => {
          if (excluded.has(idx + 1)) return;
          const d = new Date(p.dueDate);
          if (d >= start && d < end) bill += p.amount;
          // comprometido: todas as parcelas não pagas a partir do período atual
          if (d >= start && !p.isPaid) committed += p.amount;
        });
      } else {
        // SIMPLE/FIXED: só conta o período atual em ambos
        t.paymentHistory.forEach((p) => {
          const d = new Date(p.dueDate);
          if (d >= start && d < end) {
            bill += p.amount;
            committed += p.amount;
          }
        });
      }
    }
    return { billTotal: bill, totalCommitted: committed };
  }, [transactions, card.id, start, end]);

  const available = Math.max(0, card.creditLimit - totalCommitted);
  const usedPct =
    card.creditLimit > 0
      ? Math.min((totalCommitted / card.creditLimit) * 100, 100)
      : 0;
  const barColor =
    usedPct >= 90
      ? "var(--red)"
      : usedPct >= 70
      ? "var(--yellow)"
      : "var(--green)";

  const dueDate = new Date(end.getFullYear(), end.getMonth(), card.dueDay);

  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-3"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `3px solid ${card.color}`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BsCreditCard2Front
            className="h-4 w-4"
            style={{ color: card.color }}
          />
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {card.name}
          </p>
        </div>
        <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
          Fecha {card.closingDay} · Vence {card.dueDay}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Fatura do mês
          </p>
          <p className="text-base font-bold" style={{ color: barColor }}>
            {fmt(billTotal)}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
            Vence{" "}
            {dueDate.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Disponível
          </p>
          <p className="text-base font-bold" style={{ color: "var(--green)" }}>
            {fmt(available)}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
            de {fmt(card.creditLimit)}
          </p>
        </div>
      </div>

      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "var(--bg-overlay)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${usedPct}%`, background: barColor }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onPay(billTotal)}
          className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-all"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent-light)",
            border: "1px solid var(--border-accent)",
          }}
        >
          Pagar fatura
        </button>
        <Link
          href="/credit-cards"
          className="flex-1 text-xs py-1.5 rounded-lg font-medium text-center transition-all"
          style={{
            background: "var(--bg-overlay)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          Ver detalhes
        </Link>
      </div>
    </div>
  );
}

// ── Widget público ─────────────────────────────────────────────────────────────
export function CreditCardsWidget() {
  const { creditCards, allTransactions } = useUser();
  const [paying, setPaying] = useState<{
    card: ICreditCard;
    amount: number;
  } | null>(null);

  if (!creditCards || creditCards.length === 0) return null;

  const transactions = allTransactions ?? [];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Cartões de crédito
          </p>
          <Link
            href="/credit-cards"
            className="flex items-center gap-1 text-xs transition-all"
            style={{ color: "var(--accent-light)" }}
          >
            Gerenciar
            <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {creditCards.map((card) => (
            <CardMini
              key={card.id}
              card={card}
              transactions={transactions}
              onPay={(amount) => setPaying({ card, amount })}
            />
          ))}
        </div>
      </div>

      {paying && (
        <PayInvoiceModal
          card={paying.card}
          invoiceAmount={paying.amount}
          onClose={() => setPaying(null)}
        />
      )}
    </>
  );
}
