"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { Title } from "@/app/components/shared/Title";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { ICreditCard } from "@/domain/interfaces/creditcard/ICreditCard";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { getBillingPeriod } from "@/utils/getBillingPeriod";
import { BsCreditCard2Front } from "react-icons/bs";
import { FiChevronDown, FiChevronUp, FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const fmtMonth = (d: Date) =>
  format(d, "MMM/yy", { locale: ptBR });

interface BillEntry {
  txId: string;
  description: string;
  amount: number;
  date: Date;
  installment?: { current: number; total: number };
}

// ── Fatura do cartão ──────────────────────────────────────────────────────────
function CardBillView({
  card,
  transactions,
  onDelete,
}: {
  card: ICreditCard;
  transactions: ITransaction[];
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { start, end } = getBillingPeriod(card.closingDay);

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

  // Total comprometido do limite: parcelas futuras + lançamentos à vista da fatura atual
  const totalCommitted = useMemo(() => {
    let sum = 0;
    for (const t of transactions) {
      if (t.creditCardId !== card.id) continue;
      if (t.type !== TransactionTypes.WITHDRAW) continue;
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      if (t.kind === TransactionKind.INSTALLMENT) {
        t.paymentHistory.forEach((p, idx) => {
          if (excluded.has(idx + 1)) return;
          const d = new Date(p.dueDate);
          if (d >= start && !p.isPaid) sum += p.amount;
        });
      } else {
        t.paymentHistory.forEach((p) => {
          const d = new Date(p.dueDate);
          if (d >= start && d < end) sum += p.amount;
        });
      }
    }
    return sum;
  }, [transactions, card.id, start, end]);

  const usagePercent =
    card.creditLimit > 0
      ? Math.min((totalCommitted / card.creditLimit) * 100, 100)
      : 0;
  const statusColor =
    usagePercent >= 90
      ? "var(--red)"
      : usagePercent >= 70
      ? "var(--yellow)"
      : "var(--green)";

  const dueDate = new Date(end.getFullYear(), end.getMonth(), card.dueDay);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
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
                Limite
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {fmt(card.creditLimit)}
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
              <FiTrash2 className="h-3.5 w-3.5" style={{ color: "var(--red)" }} />
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Fatura atual
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Vence{" "}
              {dueDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
          <p className="text-2xl font-bold mb-2" style={{ color: statusColor }}>
            {fmt(billTotal)}
          </p>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-overlay)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${usagePercent}%`, background: statusColor }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-disabled)" }}>
            {usagePercent.toFixed(0)}% do limite utilizado
            {totalCommitted > billTotal && (
              <span style={{ color: "var(--text-muted)" }}>
                {" "}· {fmt(totalCommitted)} comprometidos
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm transition-all"
        style={{ color: "var(--text-secondary)" }}
      >
        <span>
          {billEntries.length} lançamento
          {billEntries.length !== 1 ? "s" : ""} nesta fatura
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
          {billEntries.length === 0 ? (
            <p
              className="text-center text-sm py-4"
              style={{ color: "var(--text-disabled)" }}
            >
              Nenhum lançamento neste período
            </p>
          ) : (
            billEntries.map((entry, i) => (
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
  const { start: periodStart, end: periodEnd } = getBillingPeriod(
    card.closingDay
  );

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
    return installmentTxs.map((t) => {
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      const total =
        t.recurrence?.installmentsCount ?? t.paymentHistory.length;

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
      const paidCount = validPayments.filter((p) => p.isPaid).length;

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
        total,
        endDate,
        remaining: Math.max(0, remaining),
      };
    });
  }, [installmentTxs, periodStart, periodEnd]);

  // Monthly breakdown: future payments grouped by month
  const monthlyRows = useMemo<MonthlyRow[]>(() => {
    const map = new Map<string, MonthlyRow>();

    for (const t of installmentTxs) {
      const excluded = new Set(t.recurrence?.excludedInstallments ?? []);
      const total =
        t.recurrence?.installmentsCount ?? t.paymentHistory.length;

      t.paymentHistory.forEach((payment, idx) => {
        if (excluded.has(idx + 1)) return;
        const d = new Date(payment.dueDate);
        if (d < periodStart) return;

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
  }, [installmentTxs, periodStart]);

  if (installmentTxs.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
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
          const pct = Math.min(
            ((item.currentInstallment - 1) / item.total) * 100,
            100
          );
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
                  {item.currentInstallment - 1}/{item.total}x pagas
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
                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >
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
      await addCreditCard({ name: name.trim(), creditLimit: lim, closingDay: cd, dueDay: dd, color });
      onCreated();
      setName(""); setLimit(""); setClosingDay(""); setDueDay(""); setColor(CARD_COLORS[0].hex);
    } catch (e: any) {
      setError(e?.message?.includes("2 cartões") ? "Limite de 2 cartões atingido." : e?.message ?? "Erro ao criar cartão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Novo cartão
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Nome</label>
          <input
            className="input w-full"
            placeholder="Ex: Nubank, Itaú..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Limite (R$)</label>
          <input className="input w-full" placeholder="5000" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Cor</label>
          <div className="flex gap-2 flex-wrap">
            {CARD_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{ background: c.hex, borderColor: color === c.hex ? "white" : "transparent" }}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Dia fechamento</label>
          <input className="input w-full" placeholder="1–28" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Dia vencimento</label>
          <input className="input w-full" placeholder="1–28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>
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
  const { creditCards, allTransactions, deleteCreditCard } = useUser();
  const transactions = allTransactions ?? [];
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (cardId: string, cardName: string) => {
    if (!confirm(`Remover o cartão "${cardName}"? Esta ação não pode ser desfeita.`)) return;
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

      {showForm && (
        <CreateCardForm onCreated={() => setShowForm(false)} />
      )}

      {!creditCards || creditCards.length === 0 ? (
        !showForm && (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--border-accent)" }}
            >
              <BsCreditCard2Front className="h-7 w-7" style={{ color: "var(--accent-light)" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Nenhum cartão cadastrado
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Adicione até 2 cartões de crédito
              </p>
            </div>
            <button onClick={() => setShowForm(true)} className="button button-primary text-sm">
              <FiPlus className="h-4 w-4" />
              Adicionar cartão
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-6">
          {creditCards.map((card) => (
            <div key={card.id} className="flex flex-col gap-3">
              <CardBillView
                card={card}
                transactions={transactions}
                onDelete={() => handleDelete(card.id, card.name)}
              />
              <InstallmentsTracker card={card} transactions={transactions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
