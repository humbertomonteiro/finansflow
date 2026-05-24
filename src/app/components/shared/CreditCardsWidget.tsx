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

  const { closedBillTotal, openBillTotal, totalCommitted, isPaid, paidAt } =
    useMemo(() => {
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
            // Após pagar a fatura, parcelas do período fechado estão quitadas
            const countFrom = invoicePaid ? open.start : closed.start;
            if (d >= countFrom && !p.isPaid) committed += p.amount;
          });
        } else {
          t.paymentHistory.forEach((p) => {
            const d = new Date(p.dueDate);
            if (d >= closed.start && d < closed.end) {
              closedBill += p.amount;
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

  const nextDueDate = new Date(
    open.end.getFullYear(),
    open.end.getMonth(),
    card.dueDay
  );

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${card.color}22`,
        borderLeft: `3px solid ${card.color}`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* ── Cabeçalho ── */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{
          background: `linear-gradient(90deg, ${card.color}18 0%, transparent 100%)`,
          borderBottom: `1px solid ${card.color}22`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BsCreditCard2Front className="h-3.5 w-3.5 shrink-0" style={{ color: card.color }} />
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {card.name}
          </p>
          <span className="text-[10px] shrink-0" style={{ color: "var(--text-disabled)" }}>
            fecha {card.closingDay} · vence {card.dueDay}
          </span>
        </div>
        <Link
          href="/credit-cards"
          className="flex items-center gap-0.5 text-[10px] shrink-0 ml-2 transition-opacity hover:opacity-70"
          style={{ color: "var(--accent-light)" }}
        >
          Ver <FiArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-3 py-2.5 flex flex-col gap-2.5">
        {/* ── Limite disponível + barra ── */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-base font-bold"
                style={{ color: barColor }}
              >
                {fmt(available)}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                disponível
              </span>
            </div>
            <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
              de {fmt(card.creditLimit)}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-overlay)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${usedPct}%`, background: barColor }}
            />
          </div>
          {totalCommitted > 0 && (
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-disabled)" }}>
              {usedPct.toFixed(0)}% comprometido · {fmt(totalCommitted)} em aberto
            </p>
          )}
        </div>

        {/* ── Faturas ── */}
        <div
          className="flex flex-col gap-1.5 pt-2"
          style={{ borderTop: `1px solid ${card.color}1a` }}
        >
          {/* Fatura fechada */}
          {(closedBillTotal > 0 || isPaid) && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {isPaid ? (
                  <FiCheck className="h-3 w-3 shrink-0" style={{ color: "var(--green)" }} />
                ) : (
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--red)" }}
                  />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-medium" style={{ color: isPaid ? "var(--green)" : "var(--text-secondary)" }}>
                    {fmt(closedBillTotal)}
                  </span>
                  <span className="text-[10px] ml-1.5" style={{ color: "var(--text-disabled)" }}>
                    {isPaid
                      ? `paga ${paidAt ? `em ${fmtDate(new Date(paidAt))}` : ""}`
                      : `vence ${fmtDate(closed.dueDate)}`}
                  </span>
                </div>
              </div>
              {!isPaid && closedBillTotal > 0 && (
                <button
                  onClick={() => onPay(closedBillTotal)}
                  className="shrink-0 text-[10px] px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer"
                  style={{
                    background: "var(--accent-dim)",
                    color: "var(--accent-light)",
                    border: "1px solid var(--border-accent)",
                  }}
                >
                  Pagar
                </button>
              )}
            </div>
          )}

          {/* Próxima fatura */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "var(--text-disabled)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {fmt(openBillTotal)}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
                próxima · vence {fmtDate(nextDueDate)}
              </span>
            </div>
          </div>
        </div>
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

        <div className="flex flex-col gap-2">
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
