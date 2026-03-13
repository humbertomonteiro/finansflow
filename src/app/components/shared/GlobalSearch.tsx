"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionDetails } from "./TransactionDetails";
import {
  FiSearch,
  FiX,
  FiArrowRight,
  FiClock,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { RiArrowUpCircleLine, RiArrowDownCircleLine } from "react-icons/ri";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Destaca a parte da string que casou com a busca
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "var(--accent-dim)",
          color: "var(--accent-light)",
          borderRadius: "2px",
          padding: "0 2px",
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Item de resultado ───────────────────────────────────────────
function ResultItem({
  transaction,
  query,
  categoryName,
  onClick,
}: {
  transaction: ITransaction;
  query: string;
  categoryName: string;
  onClick: () => void;
}) {
  const isDeposit = transaction.type === "deposit";

  // Pega o payment mais relevante (não pago preferido, senão o primeiro)
  const payment =
    transaction.paymentHistory.find((p) => !p.isPaid) ??
    transaction.paymentHistory[0];

  const isPaid = payment?.isPaid ?? false;
  const dueDate = payment?.dueDate ?? transaction.dueDate;
  const amount = payment?.amount ?? transaction.amount;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const isOverdue = !isPaid && due < today;
  const isToday = !isPaid && due.getTime() === today.getTime();

  const kindLabel: Record<string, string> = {
    simple: "Simples",
    fixed: "Fixo",
    installment: "Parcelado",
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all group cursor-pointer"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-overlay)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Ícone tipo */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: isDeposit
            ? "rgba(34,197,94,0.12)"
            : "rgba(239,68,68,0.12)",
        }}
      >
        {isDeposit ? (
          <RiArrowUpCircleLine
            className="h-4 w-4"
            style={{ color: "var(--green)" }}
          />
        ) : (
          <RiArrowDownCircleLine
            className="h-4 w-4"
            style={{ color: "var(--red)" }}
          />
        )}
      </div>

      {/* Conteúdo central */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          <Highlight
            text={transaction.description ?? "Sem descrição"}
            query={query}
          />
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {categoryName}
          </span>
          <span style={{ color: "var(--border-default)" }}>·</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {formatDate(dueDate)}
          </span>
          <span style={{ color: "var(--border-default)" }}>·</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {kindLabel[transaction.kind] ?? transaction.kind}
          </span>
        </div>
      </div>

      {/* Valor + status */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="money text-sm font-semibold"
          style={{ color: isDeposit ? "var(--green)" : "var(--red)" }}
        >
          {isDeposit ? "+" : "-"}
          {fmt(amount)}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium">
          {isPaid ? (
            <>
              <FiCheck className="h-3 w-3" style={{ color: "var(--green)" }} />
              <span style={{ color: "var(--green)" }}>Pago</span>
            </>
          ) : isOverdue ? (
            <>
              <FiAlertCircle
                className="h-3 w-3"
                style={{ color: "var(--red)" }}
              />
              <span style={{ color: "var(--red)" }}>Em atraso</span>
            </>
          ) : isToday ? (
            <>
              <FiClock className="h-3 w-3" style={{ color: "var(--yellow)" }} />
              <span style={{ color: "var(--yellow)" }}>Vence hoje</span>
            </>
          ) : (
            <>
              <FiClock
                className="h-3 w-3"
                style={{ color: "var(--text-muted)" }}
              />
              <span style={{ color: "var(--text-muted)" }}>Pendente</span>
            </>
          )}
        </span>
      </div>

      {/* Seta hover */}
      <FiArrowRight
        className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: "var(--text-muted)" }}
      />
    </button>
  );
}

// ── Componente principal ────────────────────────────────────────
export function GlobalSearch() {
  const { allTransactions, categories } = useUser();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<ITransaction | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Atalho de teclado: Ctrl+K / Cmd+K abre a busca
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Foca o input ao abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  // Mapa de categorias para lookup rápido
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories?.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Filtro em tempo real sobre allTransactions
  const results = useMemo<ITransaction[]>(() => {
    if (!query.trim() || !allTransactions) return [];
    const q = query.trim().toLowerCase();
    return allTransactions
      .filter((t) => t.description?.toLowerCase().includes(q))
      .slice(0, 12); // max 12 resultados
  }, [query, allTransactions]);

  const handleSelect = (t: ITransaction) => {
    setSelected(t);
    setOpen(false);
    setQuery("");
  };

  // ── Botão de busca ────────────────────────────────────────────
  const SearchButton = (
    <button
      onClick={() => setOpen(true)}
      className="relative flex items-center gap-2 px-3 h-9 rounded-xl text-sm transition-all cursor-pointer group"
      style={{
        background: "var(--bg-overlay)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-muted)",
        minWidth: "120px",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--border-strong)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border-subtle)")
      }
      aria-label="Busca global (Ctrl+K)"
    >
      <FiSearch className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left text-xs">Buscar...</span>
      <span
        className="hidden lg:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--text-disabled)",
        }}
      >
        ⌘K
      </span>
    </button>
  );

  // ── Botão ícone compacto (mobile) ─────────────────────────────
  const SearchIconButton = (
    <button
      onClick={() => setOpen(true)}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
      style={{
        background: "transparent",
        border: "1px solid transparent",
        color: "var(--text-muted)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-hover)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      aria-label="Busca global"
    >
      <FiSearch className="h-4 w-4" />
    </button>
  );

  // ── Overlay de busca ─────────────────────────────────────────
  const Overlay =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[300] flex flex-col"
            style={{
              background: "rgba(7,11,20,0.92)",
              backdropFilter: "blur(8px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpen(false);
                setQuery("");
              }
            }}
          >
            {/* Caixa de busca */}
            <div
              className="mx-auto w-full max-w-2xl mt-[10vh] flex flex-col overflow-hidden animate-fade-in-scale"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                maxHeight: "70vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input */}
              <div
                className="flex items-center gap-3 px-4 py-3 shrink-0"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <FiSearch
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--accent-light)" }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar transações por descrição..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-base outline-none"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-all"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--bg-overlay)",
                      color: "var(--text-disabled)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    ESC
                  </kbd>
                )}
              </div>

              {/* Resultados */}
              <div className="overflow-y-auto flex-1">
                {!query.trim() ? (
                  // Estado vazio — dicas
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--bg-overlay)" }}
                    >
                      <FiSearch
                        className="h-6 w-6"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Digite para buscar em todas as transações
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-disabled)" }}
                    >
                      Busca em todos os meses, não apenas o atual
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  // Sem resultados
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhuma transação encontrada para{" "}
                      <span style={{ color: "var(--text-secondary)" }}>
                        "{query}"
                      </span>
                    </p>
                    <button
                      onClick={() => {
                        router.push("/transactions");
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex items-center gap-1.5 text-xs cursor-pointer transition-all"
                      style={{ color: "var(--accent-light)" }}
                    >
                      Ver todas as transações{" "}
                      <FiArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  // Lista de resultados
                  <>
                    <div
                      className="flex items-center justify-between px-4 py-2"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {results.length} resultado
                        {results.length !== 1 ? "s" : ""}
                        {(allTransactions?.filter((t) =>
                          t.description
                            ?.toLowerCase()
                            .includes(query.toLowerCase())
                        ).length ?? 0) > 12 && <span> (mostrando 12)</span>}
                      </p>
                      <button
                        onClick={() => {
                          router.push("/transactions");
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-1 text-xs cursor-pointer transition-all"
                        style={{ color: "var(--accent-light)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = "0.7")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        Ver todas <FiArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    {results.map((t) => (
                      <ResultItem
                        key={t.id}
                        transaction={t}
                        query={query}
                        categoryName={
                          categoryMap[t.categoryId ?? ""] ?? "Sem categoria"
                        }
                        onClick={() => handleSelect(t)}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Footer com atalhos */}
              <div
                className="flex items-center gap-4 px-4 py-2 shrink-0"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  <kbd
                    className="px-1 py-0.5 rounded mr-1"
                    style={{
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    Enter
                  </kbd>
                  para abrir
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  <kbd
                    className="px-1 py-0.5 rounded mr-1"
                    style={{
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    ESC
                  </kbd>
                  para fechar
                </span>
                <span
                  className="ml-auto text-[10px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Busca em todos os meses
                </span>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return {
    SearchButton, // barra estilo cmd+K para sidebar desktop
    SearchIconButton, // ícone compacto para mobile
    Overlay, // portal do overlay — renderizar no Aside
    selectedTransaction: selected,
    clearSelected: () => setSelected(null),
  };
}
