"use client";

import { useMemo } from "react";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString("pt-BR");

const sign = (t: ITransaction) =>
  t.type === TransactionTypes.DEPOSIT ? 1 : -1;

// Expande todas as ocorrências de uma transação até o mês alvo
function expandOccurrences(
  t: ITransaction,
  targetYear: number,
  targetMonth: number
) {
  const result: {
    year: number;
    month: number;
    amount: number;
    isPaid: boolean;
    dueDate: Date;
    label: string;
  }[] = [];

  if (t.kind === TransactionKind.SIMPLE) {
    const d = new Date(t.dueDate);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (y < targetYear || (y === targetYear && m <= targetMonth)) {
      const p = t.paymentHistory[0];
      result.push({
        year: y, month: m,
        amount: p?.amount ?? t.amount,
        isPaid: p?.isPaid ?? false,
        dueDate: d,
        label: "simples",
      });
    }
  } else if (t.kind === TransactionKind.INSTALLMENT) {
    const excl = t.recurrence?.excludedInstallments ?? [];
    t.paymentHistory.forEach((p, idx) => {
      if (excl.includes(idx + 1)) return;
      const d = new Date(p.dueDate);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      if (y < targetYear || (y === targetYear && m <= targetMonth)) {
        result.push({
          year: y, month: m,
          amount: p.amount,
          isPaid: p.isPaid,
          dueDate: d,
          label: `parcela ${idx + 1}`,
        });
      }
    });
  } else if (t.kind === TransactionKind.FIXED) {
    const startDate = new Date(t.dueDate);
    const endDate = t.recurrence?.endDate ? new Date(t.recurrence.endDate) : null;
    const excl = (t.recurrence?.excludedFixeds ?? []) as Array<{ year: number; month: number }>;

    let y = startDate.getFullYear();
    let m = startDate.getMonth() + 1;

    while (y < targetYear || (y === targetYear && m <= targetMonth)) {
      const occ = new Date(y, m - 1, startDate.getDate());
      if (endDate && occ > endDate) break;

      const isExcluded = excl.some((ef) => ef.year === y && ef.month === m);
      if (!isExcluded) {
        const payRecord = t.paymentHistory.find((p) => {
          const d = new Date(p.dueDate);
          return d.getFullYear() === y && d.getMonth() + 1 === m;
        });
        result.push({
          year: y, month: m,
          amount: payRecord?.amount ?? t.amount,
          isPaid: payRecord?.isPaid ?? false,
          dueDate: occ,
          label: `fixo ${m}/${y}`,
        });
      }

      m++;
      if (m > 12) { m = 1; y++; }
    }
  }

  return result;
}

export default function DiagnosticoPage() {
  const {
    allTransactions,
    accounts,
    currentBalance,
    projectedBalance,
    year,
    month,
  } = useUser();

  const report = useMemo(() => {
    if (!allTransactions || !accounts) return null;

    // ─── 1. Todas as ocorrências expandidas até o mês navegado ────────────
    type Occ = {
      txId: string;
      description: string;
      type: TransactionTypes;
      kind: TransactionKind;
      year: number;
      month: number;
      amount: number;
      isPaid: boolean;
      dueDate: Date;
      label: string;
      signedAmount: number;
      accountId: string;
      targetAccountId?: string;
    };

    const allOccs: Occ[] = [];

    for (const t of allTransactions) {
      if (t.type === TransactionTypes.TRANSFER) {
        // Transferência: registra como ocorrência especial (não afeta receita/despesa)
        const d = new Date(t.dueDate);
        const p = t.paymentHistory[0];
        allOccs.push({
          txId: t.id,
          description: t.description || "Transferência",
          type: t.type,
          kind: t.kind,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          amount: p?.amount ?? t.amount,
          isPaid: p?.isPaid ?? false,
          dueDate: d,
          label: "transfer",
          signedAmount: 0,
          accountId: t.accountId ?? "",
          targetAccountId: t.targetAccountId,
        });
        continue;
      }
      const occs = expandOccurrences(t, year, month);
      for (const o of occs) {
        allOccs.push({
          txId: t.id,
          description: t.description || "Sem descrição",
          type: t.type,
          kind: t.kind,
          year: o.year,
          month: o.month,
          amount: o.amount,
          isPaid: o.isPaid,
          dueDate: o.dueDate,
          label: o.label,
          signedAmount: sign(t) * o.amount,
          accountId: t.accountId ?? "",
        });
      }
    }

    // ─── 2. Agrupa por mês ─────────────────────────────────────────────────
    const monthMap = new Map<string, Occ[]>();
    for (const o of allOccs) {
      const key = `${o.year}-${String(o.month).padStart(2, "0")}`;
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(o);
    }

    const months = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, occs]) => {
        const [y, m] = key.split("-").map(Number);
        const revenues = occs
          .filter((o) => o.type === TransactionTypes.DEPOSIT)
          .reduce((s, o) => s + o.amount, 0);
        const expenses = occs
          .filter((o) => o.type === TransactionTypes.WITHDRAW)
          .reduce((s, o) => s + o.amount, 0);
        const balance = revenues - expenses;

        const paidRevenues = occs
          .filter((o) => o.type === TransactionTypes.DEPOSIT && o.isPaid)
          .reduce((s, o) => s + o.amount, 0);
        const paidExpenses = occs
          .filter((o) => o.type === TransactionTypes.WITHDRAW && o.isPaid)
          .reduce((s, o) => s + o.amount, 0);
        const paidBalance = paidRevenues - paidExpenses;

        return { key, year: y, month: m, occs, revenues, expenses, balance, paidRevenues, paidExpenses, paidBalance };
      });

    // ─── 3. Soma dos balanços ─────────────────────────────────────────────
    const sumBalances = months.reduce((s, m) => s + m.balance, 0);
    const sumPaidBalances = months.reduce((s, m) => s + m.paidBalance, 0);

    // ─── 4. Pendentes até o mês navegado ─────────────────────────────────
    const pendingItems = allOccs.filter(
      (o) =>
        o.type !== TransactionTypes.TRANSFER &&
        !o.isPaid &&
        (o.year < year || (o.year === year && o.month <= month))
    );
    const pendingSum = pendingItems.reduce((s, o) => s + o.signedAmount, 0);

    // ─── 5. Calculado vs armazenado ──────────────────────────────────────
    const calculatedCurrentBalance = sumPaidBalances;
    const calculatedProjectedBalance = calculatedCurrentBalance + pendingSum;

    return {
      months,
      sumBalances,
      sumPaidBalances,
      pendingItems,
      pendingSum,
      calculatedCurrentBalance,
      calculatedProjectedBalance,
    };
  }, [allTransactions, accounts, year, month]);

  const accountName = (id: string) =>
    accounts?.find((a) => a.id === id)?.name ?? id;

  const monthName = (m: number) =>
    ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][m - 1];

  if (!report) {
    return (
      <div className="p-6 text-gray-400">Carregando diagnóstico...</div>
    );
  }

  const balanceDiff = currentBalance - report.calculatedCurrentBalance;
  const projDiff = projectedBalance - report.calculatedProjectedBalance;

  return (
    <div className="flex flex-col gap-6 p-2 pb-16 text-sm">
      <h1 className="text-xl font-bold text-gray-100">Diagnóstico de Orçamento</h1>
      <p className="text-gray-500 text-xs -mt-4">
        Mês de referência: {monthName(month)}/{year}
      </p>

      {/* ── Contas ── */}
      <section className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gray-800/60 px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wide">
          Contas (saldo armazenado)
        </div>
        <div className="divide-y divide-gray-800">
          {accounts?.map((a) => (
            <div key={a.id} className="flex justify-between px-4 py-2 text-gray-300">
              <span>{a.name}</span>
              <span className="font-mono">{fmt(a.balance)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-2 font-semibold text-white bg-gray-800/30">
            <span>Total (currentBalance)</span>
            <span className="font-mono">{fmt(currentBalance)}</span>
          </div>
        </div>
      </section>

      {/* ── Resumo geral ── */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { label: "Soma balanços mensais", value: report.sumBalances, note: "revenues−expenses, todos os meses" },
          { label: "Soma do que foi pago", value: report.sumPaidBalances, note: "só transações isPaid=true" },
          { label: "Pendentes até o mês", value: report.pendingSum, note: `${report.pendingItems.length} item(s)` },
          { label: "Projetado calculado", value: report.calculatedProjectedBalance, note: "pago + pendentes" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-800 p-3 bg-gray-900">
            <p className="text-gray-500 text-[0.65rem] uppercase tracking-wide">{item.label}</p>
            <p className={`text-lg font-bold font-mono mt-1 ${item.value < 0 ? "text-red-400" : "text-white"}`}>
              {fmt(item.value)}
            </p>
            <p className="text-gray-600 text-[0.65rem] mt-0.5">{item.note}</p>
          </div>
        ))}
      </section>

      {/* ── Comparativo ── */}
      <section className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gray-800/60 px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wide">
          Comparativo: App vs Calculado
        </div>
        <div className="divide-y divide-gray-800">
          {[
            {
              label: "Saldo atual (app)",
              app: currentBalance,
              calc: report.calculatedCurrentBalance,
            },
            {
              label: "Saldo projetado (app)",
              app: projectedBalance,
              calc: report.calculatedProjectedBalance,
            },
          ].map((row) => {
            const diff = row.app - row.calc;
            const ok = Math.abs(diff) < 0.01;
            return (
              <div key={row.label} className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <span className="text-gray-300">{row.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ok ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                    {ok ? "OK" : "DIVERGE"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1 text-[0.7rem]">
                  <div>
                    <p className="text-gray-600">App</p>
                    <p className="font-mono text-gray-200">{fmt(row.app)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Calculado</p>
                    <p className="font-mono text-gray-200">{fmt(row.calc)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Diferença</p>
                    <p className={`font-mono font-semibold ${ok ? "text-green-400" : "text-red-400"}`}>
                      {fmt(diff)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Pendentes ── */}
      {report.pendingItems.length > 0 && (
        <section className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-gray-800/60 px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wide flex justify-between">
            <span>Pendentes até {monthName(month)}/{year}</span>
            <span className={report.pendingSum < 0 ? "text-red-400" : "text-green-400"}>
              {fmt(report.pendingSum)}
            </span>
          </div>
          <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
            {report.pendingItems.map((o, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <span
                  className={`shrink-0 text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${
                    o.type === TransactionTypes.DEPOSIT
                      ? "bg-green-900/60 text-green-400"
                      : "bg-red-900/60 text-red-400"
                  }`}
                >
                  {o.type === TransactionTypes.DEPOSIT ? "REC" : "DES"}
                </span>
                <span className="flex-1 text-gray-300 truncate">{o.description}</span>
                <span className="text-gray-500 text-[0.65rem]">{fmtDate(o.dueDate)}</span>
                <span className={`font-mono font-semibold text-[0.75rem] ${o.type === TransactionTypes.DEPOSIT ? "text-green-400" : "text-red-400"}`}>
                  {o.type === TransactionTypes.DEPOSIT ? "+" : "-"}{fmt(o.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Por mês ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Detalhe por mês
        </h2>
        {report.months.map((mo) => (
          <div key={mo.key} className="rounded-xl border border-gray-800 overflow-hidden">
            {/* Header do mês */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/60">
              <span className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
                {monthName(mo.month)} {mo.year}
              </span>
              <div className="flex gap-3 text-[0.65rem]">
                <span className="text-green-400">Rec: {fmt(mo.revenues)}</span>
                <span className="text-red-400">Des: {fmt(mo.expenses)}</span>
                <span className={`font-semibold ${mo.balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  Balanço: {fmt(mo.balance)}
                </span>
              </div>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-gray-800/60">
              {mo.occs.map((o, i) => (
                <div key={i} className={`flex items-center gap-2 px-4 py-1.5 ${!o.isPaid && o.type !== TransactionTypes.TRANSFER ? "opacity-60" : ""}`}>
                  <span
                    className={`shrink-0 text-[0.55rem] font-bold px-1 py-0.5 rounded ${
                      o.type === TransactionTypes.TRANSFER
                        ? "bg-violet-900/60 text-violet-400"
                        : o.type === TransactionTypes.DEPOSIT
                        ? "bg-green-900/60 text-green-400"
                        : "bg-red-900/60 text-red-400"
                    }`}
                  >
                    {o.type === TransactionTypes.TRANSFER
                      ? "TRF"
                      : o.type === TransactionTypes.DEPOSIT
                      ? "REC"
                      : "DES"}
                  </span>
                  <span className="flex-1 text-gray-300 text-[0.75rem] truncate">
                    {o.description}
                    {o.type === TransactionTypes.TRANSFER && (
                      <span className="text-violet-400 ml-1 text-[0.65rem]">
                        ({accountName(o.accountId)} → {accountName(o.targetAccountId ?? "")})
                      </span>
                    )}
                  </span>
                  <span className="text-gray-600 text-[0.6rem] shrink-0">{o.label}</span>
                  <span className={`text-[0.65rem] px-1.5 py-0.5 rounded-full shrink-0 ${o.isPaid ? "bg-green-900/40 text-green-500" : "bg-gray-800 text-gray-500"}`}>
                    {o.isPaid ? "pago" : "pend"}
                  </span>
                  <span className={`font-mono text-[0.75rem] font-semibold shrink-0 ${
                    o.type === TransactionTypes.TRANSFER
                      ? "text-violet-300"
                      : o.type === TransactionTypes.DEPOSIT
                      ? "text-green-400"
                      : "text-red-400"
                  }`}>
                    {o.type === TransactionTypes.TRANSFER ? "" : o.type === TransactionTypes.DEPOSIT ? "+" : "-"}
                    {fmt(o.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Rodapé do mês */}
            <div className="flex justify-between px-4 py-2 bg-gray-800/30 text-[0.65rem] text-gray-500">
              <span>Pago: {fmt(mo.paidRevenues)} receita / {fmt(mo.paidExpenses)} despesa</span>
              <span className={`font-semibold ${mo.paidBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                Pago líquido: {fmt(mo.paidBalance)}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Análise da diferença ── */}
      <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <p className="text-amber-400 font-semibold text-sm mb-2">Análise da diferença</p>
        <div className="flex flex-col gap-1 text-[0.75rem] text-gray-300">
          <p>Soma de tudo pago (receitas − despesas): <span className="font-mono font-bold text-white">{fmt(report.sumPaidBalances)}</span></p>
          <p>Saldo atual nas contas: <span className="font-mono font-bold text-white">{fmt(currentBalance)}</span></p>
          <p>
            Diferença:{" "}
            <span className={`font-mono font-bold ${Math.abs(balanceDiff) < 0.01 ? "text-green-400" : "text-red-400"}`}>
              {fmt(balanceDiff)}
            </span>
          </p>
          {Math.abs(balanceDiff) >= 0.01 && (
            <p className="mt-2 text-amber-300/80">
              ⚠ O saldo armazenado nas contas difere do que foi calculado somando as transações pagas.
              Isso indica que há ajuste manual de saldo, transação com tipo errado, ou transação cadastrada
              mas sem impacto no saldo.
            </p>
          )}
          {Math.abs(balanceDiff) < 0.01 && (
            <p className="mt-2 text-green-400/80">
              ✓ O saldo das contas bate exatamente com a soma das transações pagas — sem inconsistência.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
