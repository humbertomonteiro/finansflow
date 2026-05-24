"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { Title } from "@/app/components/shared/Title";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { ICreditCard } from "@/domain/interfaces/creditcard/ICreditCard";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { getBillingPeriods } from "@/utils/getBillingPeriod";
import { BsCreditCard2Front } from "react-icons/bs";
import {
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { createTransactionController } from "@/controllers/transaction/CreateTransactionController";
import { payerTransactionController } from "@/controllers/transaction/PayerTransactionController";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CategoryExpensesChart } from "@/app/components/shared/CategoryExpensesChart";
import { ICategory } from "@/domain/interfaces/category/ICategory";
import type { CategoryExpensesSummary } from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

const CARD_COLORS = [
  { hex: "#7c3aed", label: "Roxo" },
  { hex: "#2563eb", label: "Azul" },
  { hex: "#16a34a", label: "Verde" },
  { hex: "#dc2626", label: "Vermelho" },
  { hex: "#d97706", label: "Âmbar" },
  { hex: "#0e7490", label: "Ciano" },
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtMonth = (d: Date) => format(d, "MMM/yy", { locale: ptBR });

interface BillEntry {
  txId: string;
  description: string;
  amount: number;
  date: Date;
  installment?: { current: number; total: number };
}

// ── Modal pagar fatura ────────────────────────────────────────────────────────
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

  const fmt2 = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
            {fmt2(invoiceAmount)}
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
                {a.name} — {fmt2(a.balance)}
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
          {loading ? "Registrando..." : `Pagar ${fmt2(invoiceAmount)}`}
        </button>
      </div>
    </div>
  );
}

// ── Fatura do cartão ──────────────────────────────────────────────────────────
function CardBillView({
  card,
  transactions,
  onDelete,
  onPay,
}: {
  card: ICreditCard;
  transactions: ITransaction[];
  onDelete: () => void;
  onPay: (amount: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    closed: { start, end, dueDate: invoiceDueDate },
    open,
  } = getBillingPeriods(card.closingDay, card.dueDay);

  const billEntries = useMemo<BillEntry[]>(() => {
    const entries: BillEntry[] = [];

    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;

      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);

      t.paymentHistory.forEach((payment, idx) => {
        if (t.kind === TransactionKind.INSTALLMENT && excluded.has(idx + 1))
          return;

        const d = new Date(payment.dueDate);
        if (d >= start && d < end) {
          const total =
            t.recurrence?.installmentsCount ?? t.paymentHistory.length;
          entries.push({
            txId: t.id,
            description: t.description || "Sem descrição",
            amount: payment.amount,
            date: d,
            installment:
              t.kind === TransactionKind.INSTALLMENT
                ? { current: idx + 1, total }
                : undefined,
          });
        }
      });
    }

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, card.id, start, end]);

  const billTotal = useMemo(
    () => billEntries.reduce((sum, e) => sum + e.amount, 0),
    [billEntries]
  );

  const openBillEntries = useMemo<BillEntry[]>(() => {
    const entries: BillEntry[] = [];
    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      t.paymentHistory.forEach((payment, idx) => {
        if (t.kind === TransactionKind.INSTALLMENT && excluded.has(idx + 1))
          return;
        const d = new Date(payment.dueDate);
        if (d >= open.start && d < open.end) {
          const total =
            t.recurrence?.installmentsCount ?? t.paymentHistory.length;
          entries.push({
            txId: t.id,
            description: t.description || "Sem descrição",
            amount: payment.amount,
            date: d,
            installment:
              t.kind === TransactionKind.INSTALLMENT
                ? { current: idx + 1, total }
                : undefined,
          });
        }
      });
    }
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, card.id, open.start, open.end]);

  const openBillTotal = useMemo(
    () => openBillEntries.reduce((sum, e) => sum + e.amount, 0),
    [openBillEntries]
  );

  // Detecta pagamento de fatura e calcula total comprometido do limite
  const { isPaid, paidAt, totalCommitted } = useMemo(() => {
    const paidEntry = transactions.find(
      (t) =>
        t.description === `Fatura ${card.name}` &&
        !t.creditCardId &&
        t.accountId &&
        t.paymentHistory?.[0]?.isPaid === true &&
        new Date(t.dueDate) >= start
    );
    const invoicePaid = !!paidEntry;

    let sum = 0;
    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      if (t.kind === TransactionKind.INSTALLMENT) {
        t.paymentHistory.forEach((p, idx) => {
          if (excluded.has(idx + 1)) return;
          const d = new Date(p.dueDate);
          // Após pagar a fatura, parcelas do período fechado estão quitadas —
          // só as futuras (open.start em diante) continuam comprometendo o limite.
          const countFrom = invoicePaid ? open.start : start;
          if (d >= countFrom && !p.isPaid) sum += p.amount;
        });
      } else {
        t.paymentHistory.forEach((p) => {
          const d = new Date(p.dueDate);
          if (d >= start && d < end && !invoicePaid) sum += p.amount;
          if (d >= open.start && d < open.end) sum += p.amount;
        });
      }
    }

    return {
      isPaid: invoicePaid,
      paidAt: paidEntry?.paymentHistory?.[0]?.paidAt ?? null,
      totalCommitted: sum,
    };
  }, [transactions, card.id, card.name, start, end, open.start, open.end]);

  const usagePercent =
    card.creditLimit > 0
      ? Math.min((totalCommitted / card.creditLimit) * 100, 100)
      : 0;
  const available = Math.max(0, card.creditLimit - totalCommitted);
  const statusColor =
    usagePercent >= 90
      ? "var(--red)"
      : usagePercent >= 70
      ? "var(--yellow)"
      : "var(--green)";

  const dueDate = invoiceDueDate;
  const nextDueDate = new Date(
    invoiceDueDate.getFullYear(),
    invoiceDueDate.getMonth() + 1,
    card.dueDay
  );

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="p-5 flex flex-col gap-3"
        style={{
          background: `linear-gradient(135deg, ${card.color}22 0%, ${card.color}08 100%)`,
          borderBottom: `1px solid ${card.color}33`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: card.color + "33",
                border: `1px solid ${card.color}66`,
              }}
            >
              <BsCreditCard2Front
                className="h-5 w-5"
                style={{ color: card.color }}
              />
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {card.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Fecha dia {card.closingDay} · Vence dia {card.dueDay}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Disponível
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: statusColor }}
              >
                {fmt(available)}
              </p>
              <p
                className="text-[10px]"
                style={{ color: "var(--text-disabled)" }}
              >
                de {fmt(card.creditLimit)}
              </p>
            </div>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-60 hover:opacity-100"
              style={{
                background: "var(--red-dim)",
                border: "1px solid transparent",
              }}
              title="Remover cartão"
            >
              <FiTrash2
                className="h-3.5 w-3.5"
                style={{ color: "var(--red)" }}
              />
            </button>
          </div>
        </div>

        {billTotal > 0 || isPaid ? (
          /* ── Duas seções: próxima (destaque) + fatura atual/paga (discreta) ── */
          <div className="flex flex-col gap-0">
            {/* PRIMARY — Próxima fatura (acumulando) */}
            <div className="mb-2">
              <div className="flex justify-between items-baseline mb-1">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Próxima fatura
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Vence{" "}
                  {nextDueDate.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p
                  className="text-2xl font-bold"
                  style={{
                    color:
                      openBillTotal > 0
                        ? "var(--text-primary)"
                        : "var(--text-disabled)",
                  }}
                >
                  {fmt(openBillTotal)}
                </p>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {openBillTotal > 0 ? "acumulando" : "sem gastos ainda"}
                </span>
              </div>
            </div>

            {/* Divisor */}
            <div
              style={{
                borderTop: `1px solid ${card.color}33`,
                paddingTop: "10px",
              }}
            >
              {!isPaid ? (
                /* Fatura fechada não paga — discreta + botão pagar */
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Fatura atual · Vence{" "}
                      {dueDate.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <p
                      className="text-base font-semibold mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {fmt(billTotal)}
                    </p>
                  </div>
                  {billTotal > 0 && (
                    <button
                      onClick={() => onPay(billTotal)}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer"
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
              ) : (
                /* Fatura paga — confirmação mínima */
                <div className="flex items-center gap-1.5">
                  <FiCheck
                    className="h-3 w-3 shrink-0"
                    style={{ color: "var(--green)" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Última fatura paga
                    {paidAt
                      ? ` em ${new Date(paidAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}`
                      : ""}{" "}
                    ·{" "}
                    <span style={{ color: "var(--green)" }}>
                      {fmt(billTotal)}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Barra de uso do limite */}
            <div className="mt-3">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-overlay)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${usagePercent}%`, background: statusColor }}
                />
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-disabled)" }}
              >
                {usagePercent.toFixed(0)}% comprometido
                {totalCommitted > 0 && (
                  <span style={{ color: "var(--text-muted)" }}>
                    {" "}
                    · {fmt(available)} disponível
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          /* ── Sem fatura fechada: só mostra o período acumulando ── */
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Fatura em aberto
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Fecha{" "}
                {open.end.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>
            <p
              className="text-2xl font-bold mb-1"
              style={{
                color: openBillTotal > 0 ? statusColor : "var(--text-disabled)",
              }}
            >
              {fmt(openBillTotal)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-disabled)" }}>
              {openBillTotal > 0 ? "acumulando" : "Sem gastos neste período"}
            </p>
            <div className="mt-2">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-overlay)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${usagePercent}%`, background: statusColor }}
                />
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-disabled)" }}
              >
                {usagePercent.toFixed(0)}% comprometido
                {available > 0 && (
                  <span style={{ color: "var(--text-muted)" }}>
                    {" "}
                    · {fmt(available)} disponível
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm transition-all"
        style={{ color: "var(--text-secondary)" }}
      >
        <span>
          {isPaid
            ? `${openBillEntries.length} lançamento${
                openBillEntries.length !== 1 ? "s" : ""
              } acumulando`
            : `${billEntries.length} lançamento${
                billEntries.length !== 1 ? "s" : ""
              } nesta fatura`}
        </span>
        {expanded ? (
          <FiChevronUp className="h-4 w-4" />
        ) : (
          <FiChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div
          className="border-t px-5 pb-4 flex flex-col gap-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {(isPaid ? openBillEntries : billEntries).length === 0 ? (
            <p
              className="text-center text-sm py-4"
              style={{ color: "var(--text-disabled)" }}
            >
              {isPaid
                ? "Nenhum lançamento ainda"
                : "Nenhum lançamento neste período"}
            </p>
          ) : (
            (isPaid ? openBillEntries : billEntries).map((entry, i) => (
              <div
                key={`${entry.txId}-${i}`}
                className="flex items-center justify-between py-2.5 border-b last:border-b-0"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {entry.description}
                    </p>
                    {entry.installment && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--bg-overlay)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {entry.installment.current}/{entry.installment.total}x
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {entry.date.toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--red)" }}
                >
                  -{fmt(entry.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Tracker de parcelas ───────────────────────────────────────────────────────
interface MonthlyRow {
  month: Date;
  items: Array<{
    description: string;
    amount: number;
    installment: { current: number; total: number };
  }>;
  total: number;
}

function InstallmentsTracker({
  card,
  transactions,
}: {
  card: ICreditCard;
  transactions: ITransaction[];
}) {
  const {
    closed: { start: periodStart, end: periodEnd },
    open,
  } = getBillingPeriods(card.closingDay, card.dueDay);

  const installmentTxs = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.creditCardId === card.id &&
          t.kind === TransactionKind.INSTALLMENT &&
          t.type === TransactionTypes.WITHDRAW
      ),
    [transactions, card.id]
  );

  // Summary items: one per installment transaction
  const summaryItems = useMemo(() => {
    // Detecta se a fatura do período atual foi paga
    const invoicePaid = transactions.some(
      (t) =>
        t.description === `Fatura ${card.name}` &&
        !t.creditCardId &&
        t.accountId &&
        t.paymentHistory?.[0]?.isPaid === true &&
        new Date(t.dueDate) >= periodStart
    );

    return installmentTxs.map((t) => {
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      const total = t.recurrence?.installmentsCount ?? t.paymentHistory.length;

      // Current installment = the one in the current billing period
      const currentEntry = t.paymentHistory.find((p) => {
        const d = new Date(p.dueDate);
        return d >= periodStart && d < periodEnd;
      });
      const currentIdx = currentEntry
        ? t.paymentHistory.indexOf(currentEntry) + 1
        : t.paymentHistory.filter((p) => new Date(p.dueDate) < periodStart)
            .length + 1;

      const validPayments = t.paymentHistory.filter(
        (_, idx) => !excluded.has(idx + 1)
      );

      // Conta como paga: explicitamente paga OU no período fechado com fatura paga
      const paidCount = validPayments.filter((p) => {
        if (p.isPaid) return true;
        if (invoicePaid) {
          const d = new Date(p.dueDate);
          return d >= periodStart && d < periodEnd;
        }
        return false;
      }).length;

      const lastPayment = validPayments[validPayments.length - 1];
      const endDate = lastPayment ? new Date(lastPayment.dueDate) : null;
      const amountPerInstallment =
        t.paymentHistory[0]?.amount ?? t.amount / total;
      const remaining = total - Math.max(paidCount, currentIdx - 1);

      return {
        id: t.id,
        description: t.description || "Sem descrição",
        amountPerInstallment,
        currentInstallment: Math.min(Math.max(currentIdx, 1), total),
        paidCount,
        total,
        endDate,
        remaining: Math.max(0, remaining),
      };
    });
  }, [installmentTxs, periodStart, periodEnd, transactions, card.name]);

  // Monthly breakdown: future payments grouped by month
  const monthlyRows = useMemo<MonthlyRow[]>(() => {
    const invoicePaid = transactions.some(
      (t) =>
        t.description === `Fatura ${card.name}` &&
        !t.creditCardId &&
        t.accountId &&
        t.paymentHistory?.[0]?.isPaid === true &&
        new Date(t.dueDate) >= periodStart
    );
    // Not paid: show from open.start (next billing cycle)
    // Paid: show from open.end (the cycle after next, since next is already accumulating)
    const listStart = invoicePaid ? open.end : open.start;

    const map = new Map<string, MonthlyRow>();

    for (const t of installmentTxs) {
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      const total = t.recurrence?.installmentsCount ?? t.paymentHistory.length;

      t.paymentHistory.forEach((payment, idx) => {
        if (excluded.has(idx + 1)) return;
        const d = new Date(payment.dueDate);
        if (d < listStart) return;

        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!map.has(key)) {
          map.set(key, {
            month: new Date(d.getFullYear(), d.getMonth(), 1),
            items: [],
            total: 0,
          });
        }
        const row = map.get(key)!;
        row.items.push({
          description: t.description || "Sem descrição",
          amount: payment.amount,
          installment: { current: idx + 1, total },
        });
        row.total += payment.amount;
      });
    }

    return Array.from(map.values()).sort(
      (a, b) => a.month.getTime() - b.month.getTime()
    );
  }, [
    installmentTxs,
    periodStart,
    open.start,
    open.end,
    transactions,
    card.name,
  ]);

  if (installmentTxs.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-y-auto"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        maxHeight: "700px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <FiCalendar className="h-4 w-4" style={{ color: card.color }} />
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Parcelamentos · {card.name}
        </p>
      </div>

      {/* Per-transaction progress */}
      <div
        className="px-5 py-4 flex flex-col gap-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {summaryItems.map((item) => {
          const pct = Math.min((item.paidCount / item.total) * 100, 100);
          return (
            <div key={item.id} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-sm font-medium leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.description}
                </p>
                <div className="text-right shrink-0">
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--red)" }}
                  >
                    {fmt(item.amountPerInstallment)}
                    <span
                      className="text-xs font-normal ml-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      /mês
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-overlay)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: card.color }}
                  />
                </div>
                <span
                  className="text-xs whitespace-nowrap tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.paidCount}/{item.total}x pagas
                </span>
              </div>
              {item.endDate && (
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Termina em{" "}
                  <span style={{ color: "var(--text-muted)" }}>
                    {fmtMonth(item.endDate)}
                  </span>{" "}
                  · {item.remaining} parcela
                  {item.remaining !== 1 ? "s" : ""} restante
                  {item.remaining !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly breakdown */}
      {monthlyRows.length > 0 && (
        <div className="px-5 py-4 flex flex-col gap-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-disabled)" }}
          >
            Previsão de parcelas por mês
          </p>
          {monthlyRows.map((row) => (
            <div key={row.month.toISOString()}>
              <div className="flex items-center justify-between mb-1">
                <p
                  className="text-sm font-semibold capitalize"
                  style={{ color: "var(--text-primary)" }}
                >
                  {fmtMonth(row.month)}
                </p>
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--red)" }}
                >
                  -{fmt(row.total)}
                </p>
              </div>
              <div className="flex flex-col gap-0.5 pl-3">
                {row.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {item.description}{" "}
                      <span style={{ color: "var(--text-disabled)" }}>
                        {item.installment.current}/{item.installment.total}x
                      </span>
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      -{fmt(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gráfico de categorias por cartão ─────────────────────────────────────────
function CardCategoryChart({
  card,
  transactions,
  categories,
}: {
  card: ICreditCard;
  transactions: ITransaction[];
  categories: ICategory[];
}) {
  const {
    closed: { start, end },
  } = getBillingPeriods(card.closingDay, card.dueDay);

  const cardExpenses = useMemo<CategoryExpensesSummary>(() => {
    const byCategory: Record<string, { name: string; amount: number }> = {};

    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);

      t.paymentHistory.forEach((p, idx) => {
        if (t.kind === TransactionKind.INSTALLMENT && excluded.has(idx + 1))
          return;
        const d = new Date(p.dueDate);
        if (d < start || d >= end) return;
        const catId = t.categoryId || "uncategorized";
        const cat = categories.find((c) => c.id === catId);
        const catName = cat?.name ?? "Sem categoria";
        if (!byCategory[catId])
          byCategory[catId] = { name: catName, amount: 0 };
        byCategory[catId].amount += p.amount;
      });
    }

    const totalExpenses = Object.values(byCategory).reduce(
      (s, c) => s + c.amount,
      0
    );
    const expenses = Object.entries(byCategory)
      .map(([categoryId, { name, amount }]) => ({
        categoryId,
        categoryName: name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { expenses, totalExpenses };
  }, [transactions, card.id, categories, start, end]);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        Gastos por categoria · {fmtMonth(start)}{" "}
        {fmtMonth(start) !== fmtMonth(new Date(end.getTime() - 1))
          ? `→ ${fmtMonth(new Date(end.getTime() - 1))}`
          : ""}
      </p>
      {cardExpenses.expenses.length === 0 ? (
        <p
          className="text-sm text-center py-6"
          style={{ color: "var(--text-disabled)" }}
        >
          Nenhum gasto nesta fatura
        </p>
      ) : (
        <CategoryExpensesChart dataCategoryExpenses={cardExpenses} />
      )}
    </div>
  );
}

// ── Helper para navegar entre períodos ───────────────────────────────────────
function shiftPeriod(
  closed: { start: Date; end: Date; dueDate: Date },
  offset: number
) {
  const add = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
  return {
    start: add(closed.start, offset),
    end: add(closed.end, offset),
    dueDate: add(closed.dueDate, offset),
  };
}

// ── Histórico de faturas ──────────────────────────────────────────────────────
function InvoiceHistory({
  card,
  transactions,
}: {
  card: ICreditCard;
  transactions: ITransaction[];
}) {
  const [offset, setOffset] = useState(0);
  const { closed } = getBillingPeriods(card.closingDay, card.dueDay);
  const closedStartMs = closed.start.getTime();

  const period = useMemo(
    () => shiftPeriod(closed, offset),
    // closed is recreated each render; closedStartMs is a stable primitive
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [closedStartMs, offset]
  );

  const entries = useMemo<BillEntry[]>(() => {
    const list: BillEntry[] = [];
    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      t.paymentHistory.forEach((payment, idx) => {
        if (t.kind === TransactionKind.INSTALLMENT && excluded.has(idx + 1))
          return;
        const d = new Date(payment.dueDate);
        if (d >= period.start && d < period.end) {
          const total =
            t.recurrence?.installmentsCount ?? t.paymentHistory.length;
          list.push({
            txId: t.id,
            description: t.description || "Sem descrição",
            amount: payment.amount,
            date: d,
            installment:
              t.kind === TransactionKind.INSTALLMENT
                ? { current: idx + 1, total }
                : undefined,
          });
        }
      });
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, card.id, period]);

  const total = useMemo(
    () => entries.reduce((s, e) => s + e.amount, 0),
    [entries]
  );

  const { isPaid, paidAt } = useMemo(() => {
    const tolerance = new Date(period.end.getTime() + 45 * 24 * 60 * 60 * 1000);
    const paidEntry = transactions.find(
      (t) =>
        t.description === `Fatura ${card.name}` &&
        !t.creditCardId &&
        t.accountId &&
        t.paymentHistory?.[0]?.isPaid === true &&
        new Date(t.dueDate) >= period.start &&
        new Date(t.dueDate) < tolerance
    );
    return {
      isPaid: !!paidEntry,
      paidAt: paidEntry?.paymentHistory?.[0]?.paidAt ?? null,
    };
  }, [transactions, card.name, period]);

  const periodLabel =
    offset === 0 ? `${fmtMonth(period.start)} (atual)` : fmtMonth(period.start);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header with navigation */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Histórico de faturas
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: "var(--bg-overlay)",
              color: "var(--text-secondary)",
            }}
            title="Mês anterior"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <span
            className="text-sm font-medium min-w-[96px] text-center capitalize"
            style={{ color: "var(--text-primary)" }}
          >
            {periodLabel}
          </span>
          <button
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: offset >= 0 ? "transparent" : "var(--bg-overlay)",
              color:
                offset >= 0 ? "var(--text-disabled)" : "var(--text-secondary)",
              cursor: offset >= 0 ? "not-allowed" : "pointer",
            }}
            title="Próximo mês"
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Total da fatura
          </p>
          <p
            className="text-xl font-bold mt-0.5"
            style={{ color: "var(--text-primary)" }}
          >
            {fmt(total)}
          </p>
        </div>
        {isPaid ? (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(34,197,94,0.15)",
              color: "var(--green)",
            }}
          >
            <FiCheck className="h-3 w-3" />
            Paga
            {paidAt
              ? ` em ${new Date(paidAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}`
              : ""}
          </span>
        ) : offset === 0 ? (
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: "var(--red-dim)", color: "var(--red)" }}
          >
            Pendente
          </span>
        ) : (
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: "var(--bg-overlay)",
              color: "var(--text-disabled)",
            }}
          >
            Não paga
          </span>
        )}
      </div>

      {/* Entries */}
      <div className="px-5 pb-2 flex flex-col gap-0 max-h-56 overflow-y-auto">
        {entries.length === 0 ? (
          <p
            className="text-center text-sm py-6"
            style={{ color: "var(--text-disabled)" }}
          >
            Nenhum lançamento neste período
          </p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={`${entry.txId}-${i}`}
              className="flex items-center justify-between py-2.5 border-b last:border-b-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {entry.description}
                  </p>
                  {entry.installment && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "var(--bg-overlay)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {entry.installment.current}/{entry.installment.total}x
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {entry.date.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--red)" }}
              >
                -{fmt(entry.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Formulário de criação de cartão ──────────────────────────────────────────
function CreateCardForm({ onCreated }: { onCreated: () => void }) {
  const { addCreditCard } = useUser();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [color, setColor] = useState(CARD_COLORS[0].hex);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || name.trim().length < 3) {
      setError("Nome deve ter ao menos 3 caracteres.");
      return;
    }
    const lim = Number(limit.replace(",", ".").replace(/[^\d.]/g, ""));
    if (isNaN(lim) || lim <= 0) {
      setError("Informe um limite válido maior que zero.");
      return;
    }
    const cd = Number(closingDay);
    if (!cd || cd < 1 || cd > 28) {
      setError("Dia de fechamento deve ser entre 1 e 28.");
      return;
    }
    const dd = Number(dueDay);
    if (!dd || dd < 1 || dd > 28) {
      setError("Dia de vencimento deve ser entre 1 e 28.");
      return;
    }
    setLoading(true);
    try {
      await addCreditCard({
        name: name.trim(),
        creditLimit: lim,
        closingDay: cd,
        dueDay: dd,
        color,
      });
      onCreated();
      setName("");
      setLimit("");
      setClosingDay("");
      setDueDay("");
      setColor(CARD_COLORS[0].hex);
    } catch (e: any) {
      setError(
        e?.message?.includes("2 cartões")
          ? "Limite de 2 cartões atingido."
          : e?.message ?? "Erro ao criar cartão."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Novo cartão
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label
            className="text-xs mb-1 block"
            style={{ color: "var(--text-muted)" }}
          >
            Nome
          </label>
          <input
            className="input w-full"
            placeholder="Ex: Nubank, Itaú..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label
            className="text-xs mb-1 block"
            style={{ color: "var(--text-muted)" }}
          >
            Limite (R$)
          </label>
          <input
            className="input w-full"
            placeholder="5000"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
        <div>
          <label
            className="text-xs mb-1 block"
            style={{ color: "var(--text-muted)" }}
          >
            Cor
          </label>
          <div className="flex gap-2 flex-wrap">
            {CARD_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{
                  background: c.hex,
                  borderColor: color === c.hex ? "white" : "transparent",
                }}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <div>
          <label
            className="text-xs mb-1 block"
            style={{ color: "var(--text-muted)" }}
          >
            Dia fechamento
          </label>
          <input
            className="input w-full"
            placeholder="1–28"
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
          />
        </div>
        <div>
          <label
            className="text-xs mb-1 block"
            style={{ color: "var(--text-muted)" }}
          >
            Dia vencimento
          </label>
          <input
            className="input w-full"
            placeholder="1–28"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="button button-primary w-full"
      >
        <FiPlus className="h-4 w-4" />
        {loading ? "Criando..." : "Criar cartão"}
      </button>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function CreditCardsPage() {
  const { creditCards, allTransactions, deleteCreditCard, categories } =
    useUser();
  const transactions = allTransactions ?? [];
  const [showForm, setShowForm] = useState(false);
  const [paying, setPaying] = useState<{
    card: ICreditCard;
    amount: number;
  } | null>(null);

  const handleDelete = async (cardId: string, cardName: string) => {
    if (
      !confirm(
        `Remover o cartão "${cardName}"? Esta ação não pode ser desfeita.`
      )
    )
      return;
    await deleteCreditCard(cardId);
  };

  const canAdd = (creditCards?.length ?? 0) < 2;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Title navigateMonth={false}>Cartões</Title>
        {canAdd && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all button button-primary"
          >
            <FiPlus className="h-3.5 w-3.5" />
            Novo cartão
          </button>
        )}
      </div>

      {showForm && <CreateCardForm onCreated={() => setShowForm(false)} />}

      {!creditCards || creditCards.length === 0 ? (
        !showForm && (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--border-accent)",
              }}
            >
              <BsCreditCard2Front
                className="h-7 w-7"
                style={{ color: "var(--accent-light)" }}
              />
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Nenhum cartão cadastrado
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Adicione até 2 cartões de crédito
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="button button-primary text-sm"
            >
              <FiPlus className="h-4 w-4" />
              Adicionar cartão
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-8">
          {creditCards.map((card) => {
            const hasInstallments = transactions.some(
              (t) =>
                t.creditCardId === card.id &&
                t.kind === TransactionKind.INSTALLMENT &&
                t.type === TransactionTypes.WITHDRAW
            );
            return (
              <div
                key={card.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-3"
              >
                {/* Col 1: Fatura + Histórico + Categoria (empilhados) */}
                <div className="flex flex-col gap-3">
                  <CardBillView
                    card={card}
                    transactions={transactions}
                    onDelete={() => handleDelete(card.id, card.name)}
                    onPay={(amount) => setPaying({ card, amount })}
                  />
                  <InvoiceHistory card={card} transactions={transactions} />
                  {hasInstallments && (
                    <CardCategoryChart
                      card={card}
                      transactions={transactions}
                      categories={categories ?? []}
                    />
                  )}
                </div>

                {/* Col 2: Parcelamentos ou Categoria */}
                {hasInstallments ? (
                  <InstallmentsTracker
                    card={card}
                    transactions={transactions}
                  />
                ) : (
                  <CardCategoryChart
                    card={card}
                    transactions={transactions}
                    categories={categories ?? []}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {paying && (
        <PayInvoiceModal
          card={paying.card}
          invoiceAmount={paying.amount}
          onClose={() => setPaying(null)}
        />
      )}
    </div>
  );
}
