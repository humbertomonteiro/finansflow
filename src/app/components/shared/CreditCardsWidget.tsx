"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { ICreditCard } from "@/domain/interfaces/creditcard/ICreditCard";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { getBillingPeriods } from "@/utils/getBillingPeriod";
import { createTransactionController } from "@/controllers/transaction/CreateTransactionController";
import { payerTransactionController } from "@/controllers/transaction/PayerTransactionController";
import { BsCreditCard2Front } from "react-icons/bs";
import { FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import Link from "next/link";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "";

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
      const paidTx = await payerTransactionController(
        tx.id,
        today.getFullYear(),
        today.getMonth() + 1,
        accountId
      );
      addTransaction(paidTx ?? tx);
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
  const { closed, open } = getBillingPeriods(card.closingDay, card.dueDay);

  const { closedBillTotal, openBillTotal, totalCommitted, isPaid, paidAt } = useMemo(() => {
    // Detecta pagamento de fatura primeiro para ajustar o committed
    const paidEntry = transactions.find(
      (t) =>
        t.description === `Fatura ${card.name}` &&
        !t.creditCardId &&
        t.accountId &&
        t.paymentHistory?.[0]?.isPaid === true &&
        new Date(t.dueDate) >= closed.start
    );
    const invoicePaid = !!paidEntry;

    let closedBill = 0;
    let openBill = 0;
    let committed = 0;

    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);

      if (t.kind === TransactionKind.INSTALLMENT) {
        t.paymentHistory.forEach((p, idx) => {
          if (excluded.has(idx + 1)) return;
          const d = new Date(p.dueDate);
          if (d >= closed.start && d < closed.end) closedBill += p.amount;
          if (d >= open.start && d < open.end) openBill += p.amount;
          // Parcelas futuras não pagas ainda comprometem o limite
          if (d >= closed.start && !p.isPaid) committed += p.amount;
        });
      } else {
        t.paymentHistory.forEach((p) => {
          const d = new Date(p.dueDate);
          if (d >= closed.start && d < closed.end) {
            closedBill += p.amount;
            // Fatura fechada só compromete o limite se ainda não foi paga
            if (!invoicePaid) committed += p.amount;
          }
          if (d >= open.start && d < open.end) {
            openBill += p.amount;
            committed += p.amount;
          }
        });
      }
    }

    return {
      closedBillTotal: closedBill,
      openBillTotal: openBill,
      totalCommitted: committed,
      isPaid: invoicePaid,
      paidAt: paidEntry?.paymentHistory?.[0]?.paidAt ?? null,
    };
  }, [transactions, card.id, card.name, closed, open]);

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
      {/* Cabeçalho */}
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

      {/* Faturas: atual (esquerda) e próxima (direita) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Fatura atual (período fechado) */}
        <div
          className="rounded-lg p-3 flex flex-col gap-1"
          style={{
            background: isPaid ? "rgba(34,197,94,0.08)" : "var(--bg-overlay)",
            border: isPaid ? "1px solid rgba(34,197,94,0.2)" : "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-[10px] font-medium truncate" style={{ color: "var(--text-muted)" }}>
              Fatura atual
            </p>
            {isPaid && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)" }}
              >
                <FiCheck className="h-2.5 w-2.5" />
                Paga
              </span>
            )}
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
            vence {fmtDate(closed.dueDate)}
          </p>
          <p
            className="text-base font-bold"
            style={{ color: isPaid ? "var(--green)" : closedBillTotal > 0 ? "var(--red)" : "var(--text-secondary)" }}
          >
            {fmt(closedBillTotal)}
          </p>
          {isPaid && paidAt && (
            <p className="text-[10px]" style={{ color: "var(--green)" }}>
              Paga em {fmtDate(new Date(paidAt))}
            </p>
          )}
          {!isPaid && closedBillTotal > 0 && (
            <button
              onClick={() => onPay(closedBillTotal)}
              className="mt-auto text-[11px] py-1.5 rounded-lg font-medium transition-all w-full"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent-light)",
                border: "1px solid var(--border-accent)",
              }}
            >
              Pagar
            </button>
          )}
          {closedBillTotal === 0 && (
            <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
              Sem compras
            </p>
          )}
        </div>

        {/* Próxima fatura (período aberto) */}
        <div
          className="rounded-lg p-3 flex flex-col gap-1"
          style={{
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            Próxima fatura
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
            vence {fmtDate(new Date(open.end.getFullYear(), open.end.getMonth(), card.dueDay))}
          </p>
          <p className="text-base font-bold" style={{ color: "var(--text-secondary)" }}>
            {fmt(openBillTotal)}
          </p>
          {openBillTotal > 0 ? (
            <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
              acumulando
            </p>
          ) : (
            <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
              Sem compras
            </p>
          )}
          <div className="mt-auto">
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Disponível</p>
            <p className="text-sm font-bold" style={{ color: "var(--green)" }}>{fmt(available)}</p>
          </div>
        </div>
      </div>

      {/* Barra de uso */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "var(--bg-overlay)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${usedPct}%`, background: barColor }}
        />
      </div>

      {/* Link para detalhes */}
      <Link
        href="/credit-cards"
        className="text-xs py-1.5 rounded-lg font-medium text-center transition-all"
        style={{
          background: "var(--bg-overlay)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        Ver detalhes
      </Link>
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
