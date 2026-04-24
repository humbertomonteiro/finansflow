"use client";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useUser } from "@/app/hooks/useUser";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTHS_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export function AnnualProjectionSection() {
  const { allTransactions, transactions, currentBalance, year, month } = useUser();
  const [investPct, setInvestPct]   = useState(100);
  const [annualRate, setAnnualRate] = useState(12);

  // ── Líquido mensal de TODAS as transações agendadas ──────────
  const monthlyNets = useMemo(() => {
    if (!allTransactions) return new Array(12).fill(0) as number[];
    const nets = new Array(12).fill(0) as number[];
    for (const t of allTransactions) {
      const sign = t.type === TransactionTypes.DEPOSIT ? 1 : -1;
      if (t.kind === TransactionKind.SIMPLE) {
        const d = new Date(t.dueDate);
        if (d.getFullYear() === year) nets[d.getMonth()] += sign * t.amount;
      } else if (t.kind === TransactionKind.INSTALLMENT) {
        const excl = t.recurrence?.excludedInstallments ?? [];
        const end  = t.recurrence?.endDate ? new Date(t.recurrence.endDate) : null;
        t.paymentHistory.forEach((p, idx) => {
          if (excl.includes(idx + 1)) return;
          const d = new Date(p.dueDate);
          if (d.getFullYear() !== year) return;
          if (end && d > end) return;
          nets[d.getMonth()] += sign * p.amount;
        });
      } else if (t.kind === TransactionKind.FIXED) {
        const start = new Date(t.dueDate);
        const end   = t.recurrence?.endDate ? new Date(t.recurrence.endDate) : null;
        const excl  = (t.recurrence?.excludedFixeds ?? []) as Array<{ year: number; month: number }>;
        for (let m = 1; m <= 12; m++) {
          const occ = new Date(year, m - 1, start.getDate());
          if (occ < start) continue;
          if (end && occ > end) continue;
          if (excl.some((ef) => ef.year === year && ef.month === m)) continue;
          const pay = t.paymentHistory.find((p) => {
            const d = new Date(p.dueDate);
            return d.getFullYear() === year && d.getMonth() + 1 === m;
          });
          nets[m - 1] += sign * (pay?.amount ?? t.amount);
        }
      }
    }
    return nets;
  }, [allTransactions, year]);

  // ── Âncora: saldo no início do mês atual ─────────────────────
  const anchor = useMemo(() => {
    const paid = (transactions ?? []).reduce((sum, t) => {
      if (!(t.paymentHistory[0]?.isPaid ?? false)) return sum;
      return sum + (t.type === TransactionTypes.DEPOSIT ? t.amount : -t.amount);
    }, 0);
    return currentBalance - paid;
  }, [transactions, currentBalance]);

  // ── Projeção sem investimento ─────────────────────────────────
  const projectedBalances = useMemo(() => {
    const r = new Array(12).fill(0) as number[];
    r[month - 1] = anchor + monthlyNets[month - 1];
    for (let i = month; i < 12; i++) r[i] = r[i - 1] + monthlyNets[i];
    for (let i = month - 2; i >= 0; i--) r[i] = r[i + 1] - monthlyNets[i + 1];
    return r;
  }, [anchor, monthlyNets, month]);

  // ── Projeção com juros compostos ─────────────────────────────
  const investedBalances = useMemo(() => {
    if (investPct <= 0 || annualRate <= 0) return projectedBalances;
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const r = [...projectedBalances];
    let free = anchor, invested = 0;
    for (let i = month - 1; i < 12; i++) {
      invested *= 1 + monthlyRate;
      const delta = monthlyNets[i];
      if (delta > 0) {
        const toInvest = delta * (investPct / 100);
        free += delta - toInvest;
        invested += toInvest;
      } else {
        free += delta;
        if (free < 0) { invested += free; free = 0; if (invested < 0) invested = 0; }
      }
      r[i] = free + invested;
    }
    return r;
  }, [anchor, monthlyNets, month, projectedBalances, investPct, annualRate]);

  const hasInvestment = investPct > 0 && annualRate > 0;

  // ── Métricas resumo ───────────────────────────────────────────
  const decBal      = projectedBalances[11];
  const decInvested = investedBalances[11];
  const totalGain   = decInvested - decBal;
  const posMonths   = monthlyNets.filter((n) => n > 0).length;
  const maxIdx      = projectedBalances.indexOf(Math.max(...projectedBalances));
  const minIdx      = projectedBalances.indexOf(Math.min(...projectedBalances));

  // ── Chart.js ─────────────────────────────────────────────────
  const chartData = {
    labels: MONTHS_SHORT,
    datasets: [
      {
        label: "Sem investir",
        data: projectedBalances,
        borderColor: "#38bdf8",
        backgroundColor: "transparent",
        borderWidth: hasInvestment ? 1.5 : 2,
        borderDash: hasInvestment ? [6, 3] : [],
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#38bdf8",
        tension: 0.3,
      } as any,
      {
        label: `Investindo ${investPct || 100}% · ${annualRate || 12}% a.a.`,
        data: investedBalances,
        borderColor: "rgb(34,197,94)",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "rgb(34,197,94)",
        tension: 0.3,
        hidden: !hasInvestment,
      } as any,
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#9ca3af",
          boxWidth: 12,
          padding: 16,
          font: { size: 11 },
          filter: (item: any) => hasInvestment || item.datasetIndex === 0,
        },
      },
      tooltip: {
        backgroundColor: "rgba(13,18,32,0.95)",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#d1d5db",
        bodyColor: "#9ca3af",
        padding: 10,
        callbacks: {
          label: (ctx: any) => `  ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280", font: { size: 11 } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: {
          color: "#6b7280",
          font: { size: 11 },
          callback: (v: any) => {
            const abs = Math.abs(v as number), s = v < 0 ? "-" : "";
            if (abs >= 1_000_000) return `${s}R$${(abs / 1_000_000).toFixed(1)}M`;
            if (abs >= 1_000)     return `${s}R$${(abs / 1_000).toFixed(1)}k`;
            return `R$${v}`;
          },
        },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
    },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Inputs + gráfico */}
      <div
        className="p-5 rounded-xl flex flex-col gap-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Projeção anual & simulador de rendimento
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-disabled)" }}>
            Todas as transações agendadas de {year} · simulação de juros compostos a partir do mês atual
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              % do saldo mensal positivo a investir
            </p>
            <div className="relative">
              <input
                type="number" min="0" max="100" value={investPct}
                onChange={(e) => setInvestPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="input text-sm w-full pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                style={{ color: "var(--text-muted)" }}>%</span>
            </div>
          </div>
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              Taxa de rendimento anual
            </p>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.1" value={annualRate}
                onChange={(e) => setAnnualRate(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="input text-sm w-full pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                style={{ color: "var(--text-muted)" }}>% a.a.</span>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div style={{ height: "240px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="p-3 rounded-xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Projeção dezembro</p>
          <p className="money text-base font-semibold mt-0.5"
            style={{ color: decBal >= 0 ? "var(--green)" : "var(--red)" }}>
            {fmt(decBal)}
          </p>
        </div>

        {hasInvestment ? (
          <>
            <div
              className="p-3 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Investindo {investPct}%
              </p>
              <p className="money text-base font-semibold mt-0.5" style={{ color: "var(--green)" }}>
                {fmt(decInvested)}
              </p>
            </div>

            <div
              className="p-3 rounded-xl"
              style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.18)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rendimento total</p>
              <p className="money text-base font-semibold mt-0.5" style={{ color: "var(--green)" }}>
                +{fmt(totalGain)}
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className="p-3 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Melhor mês</p>
              <p className="text-base font-semibold mt-0.5" style={{ color: "var(--green)" }}>
                {MONTHS_SHORT[maxIdx]}
              </p>
            </div>

            <div
              className="p-3 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pior mês</p>
              <p className="text-base font-semibold mt-0.5" style={{ color: "var(--red)" }}>
                {MONTHS_SHORT[minIdx]}
              </p>
            </div>
          </>
        )}

        <div
          className="p-3 rounded-xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Meses positivos</p>
          <p className="text-base font-semibold mt-0.5"
            style={{ color: posMonths >= 6 ? "var(--green)" : "var(--yellow)" }}>
            {posMonths}/12
          </p>
        </div>
      </div>

      {/* Tabela detalhada */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}>
            Detalhamento mensal
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap"
                  style={{ color: "var(--text-muted)" }}>Mês</th>
                <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap"
                  style={{ color: "var(--text-muted)" }}>Líquido do mês</th>
                <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap"
                  style={{ color: "var(--text-muted)" }}>Saldo projetado</th>
                {hasInvestment && (
                  <>
                    <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap"
                      style={{ color: "rgba(34,197,94,0.8)" }}>Saldo investindo</th>
                    <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap"
                      style={{ color: "rgba(34,197,94,0.8)" }}>Rendimento acum.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {MONTHS_FULL.map((mName, i) => {
                const net   = monthlyNets[i];
                const bal   = projectedBalances[i];
                const inv   = investedBalances[i];
                const gain  = inv - bal;
                const isPast    = i < month - 1;
                const isCurrent = i === month - 1;

                return (
                  <tr
                    key={mName}
                    style={{
                      borderBottom: i < 11 ? "1px solid var(--border-subtle)" : "none",
                      background: isCurrent ? "rgba(99,102,241,0.05)" : "transparent",
                      opacity: isPast ? 0.5 : 1,
                    }}
                  >
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap"
                      style={{ color: isCurrent ? "#c7d2fe" : "var(--text-secondary)" }}>
                      {mName}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(99,102,241,0.2)", color: "#c7d2fe" }}>
                          atual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right money whitespace-nowrap"
                      style={{ color: net >= 0 ? "var(--green)" : "var(--red)" }}>
                      {net >= 0 ? "+" : ""}{fmt(net)}
                    </td>
                    <td className="px-4 py-2.5 text-right money whitespace-nowrap"
                      style={{ color: bal >= 0 ? "var(--text-primary)" : "var(--red)" }}>
                      {fmt(bal)}
                    </td>
                    {hasInvestment && (
                      <>
                        <td className="px-4 py-2.5 text-right money whitespace-nowrap"
                          style={{ color: inv >= 0 ? "var(--green)" : "var(--red)" }}>
                          {fmt(inv)}
                        </td>
                        <td className="px-4 py-2.5 text-right money whitespace-nowrap"
                          style={{ color: gain > 0.01 ? "var(--green)" : "var(--text-muted)" }}>
                          {gain > 0.01 ? "+" : ""}{fmt(gain)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
            Meses passados exibidos com 50% de opacidade. Valores futuros consideram todas as transações agendadas.
            {hasInvestment && " Rendimento calculado com juros compostos mensais. Meses negativos resgatam do investimento antes de apresentar déficit."}
          </p>
        </div>
      </div>
    </div>
  );
}
