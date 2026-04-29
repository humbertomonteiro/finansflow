"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { Title } from "@/app/components/shared/Title";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdCheck,
  MdClose,
  MdOutlineFlagCircle,
} from "react-icons/md";
import { FiAlertTriangle, FiX } from "react-icons/fi";

// ── Modal de adicionar meta ─────────────────────────────────────
function AddGoalModal({
  categoriesAvailable,
  onClose,
  onSave,
}: {
  categoriesAvailable: { id: string; name: string }[];
  onClose: () => void;
  onSave: (categoryId: string, limit: number) => Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limitStr, setLimitStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!categoryId) { setError("Selecione uma categoria."); return; }
    const limit = Number(limitStr.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!limit || limit <= 0) { setError("Informe um limite válido maior que zero."); return; }
    setSaving(true);
    try {
      await onSave(categoryId, limit);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar meta.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(7,11,20,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--border-accent)" }}
            >
              <MdAdd className="h-4 w-4" style={{ color: "var(--accent-light)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Nova meta de gasto
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Categoria
            </p>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              autoFocus
            >
              <option value="">Selecione uma categoria</option>
              {categoriesAvailable.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Limite mensal (R$)
            </p>
            <input
              className="input"
              type="text"
              placeholder="Ex: 500,00"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--red)" }}>
              <FiAlertTriangle className="h-3 w-3 shrink-0" /> {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="button flex-1"
              style={{
                background: "var(--bg-overlay)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button button-primary flex-1"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Definir Meta"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Página ──────────────────────────────────────────────────────
export default function Goals() {
  const {
    user,
    loading,
    categories,
    dataCategoryExpenses,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useUser();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const goalsMap = useMemo(() => {
    const map: Record<string, { id: string; limit: number }> = {};
    for (const g of goals ?? []) {
      map[g.categoryId] = { id: g.id, limit: g.monthlyLimit };
    }
    return map;
  }, [goals]);

  const categoriesWithGoal = Object.keys(goalsMap);
  const categoriesAvailable =
    categories?.filter((c) => !categoriesWithGoal.includes(c.id)) ?? [];

  const getSpent = (categoryId: string): number =>
    dataCategoryExpenses?.expenses.find((e) => e.categoryId === categoryId)?.amount ?? 0;

  const getCategoryName = (categoryId: string): string =>
    categories?.find((c) => c.id === categoryId)?.name ?? "Categoria";

  const handleSaveEdit = async (categoryId: string) => {
    const limit = Number(editValue.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!limit || limit <= 0) return;
    const goalId = goalsMap[categoryId]?.id;
    if (!goalId) return;
    setSaving(true);
    try {
      await updateGoal(goalId, limit);
      setEditingId(null);
      setEditValue("");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalLimit = Object.values(goalsMap).reduce((a, b) => a + b.limit, 0);
  const totalSpent = Object.keys(goalsMap).reduce((acc, id) => acc + getSpent(id), 0);
  const totalPercent = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
  const overBudgetCount = Object.keys(goalsMap).filter((id) => getSpent(id) > goalsMap[id].limit).length;
  const hasGoals = Object.keys(goalsMap).length > 0;

  if (loading || goals === null) return <p className="p-6" style={{ color: "var(--text-muted)" }}>Carregando...</p>;
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-48">
      {/* Header com botão */}
      <div className="flex items-center justify-between">
        <Title navigateMonth={false}>Metas</Title>
        {categoriesAvailable.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="button button-primary flex items-center gap-1.5"
          >
            <MdAdd className="h-4 w-4" />
            Nova meta
          </button>
        )}
      </div>

      <p className="text-sm -mt-2" style={{ color: "var(--text-muted)" }}>
        Defina limites mensais de gastos por categoria e acompanhe se está dentro do orçamento.
      </p>

      {/* Card resumo geral */}
      {hasGoals && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Orçamento total
              </p>
              <p className="money text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {fmt(totalLimit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Gasto até agora
              </p>
              <p
                className="money text-2xl font-bold"
                style={{ color: totalSpent > totalLimit ? "var(--red)" : "var(--green)" }}
              >
                {fmt(totalSpent)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-disabled)" }}>
              <span>Progresso</span>
              <span>{totalPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-overlay)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${totalPercent}%`,
                  background:
                    totalPercent >= 100 ? "var(--red)" : totalPercent >= 80 ? "var(--yellow)" : "var(--green)",
                }}
              />
            </div>
          </div>

          {overBudgetCount > 0 && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--red)" }}>
              <FiAlertTriangle className="h-3 w-3 shrink-0" />
              {overBudgetCount}{" "}
              {overBudgetCount === 1 ? "categoria ultrapassou" : "categorias ultrapassaram"} o limite este mês.
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasGoals && (
        <div
          className="rounded-xl p-12 text-center flex flex-col items-center gap-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-overlay)" }}
          >
            <MdOutlineFlagCircle className="h-8 w-8" style={{ color: "var(--text-disabled)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Nenhuma meta definida
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-disabled)" }}>
              Adicione metas para controlar seus gastos por categoria.
            </p>
          </div>
          {categoriesAvailable.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="button button-primary flex items-center gap-1.5 mt-1"
            >
              <MdAdd className="h-4 w-4" />
              Criar primeira meta
            </button>
          )}
        </div>
      )}

      {/* Lista de metas */}
      {hasGoals && (
        <div className="flex flex-col gap-3">
          {Object.entries(goalsMap).map(([categoryId, { id: goalId, limit }]) => {
            const spent = getSpent(categoryId);
            const percent = Math.min((spent / limit) * 100, 100);
            const isOver = spent > limit;
            const isWarning = !isOver && percent >= 80;

            return (
              <div
                key={categoryId}
                className="rounded-xl p-4 transition-colors"
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${isOver ? "var(--red-dim)" : isWarning ? "var(--yellow-dim)" : "var(--border-default)"}`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {getCategoryName(categoryId)}
                      </p>
                      {isOver && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: "var(--red-dim)", color: "var(--red)" }}
                        >
                          Excedeu
                        </span>
                      )}
                      {isWarning && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: "var(--yellow-dim)", color: "var(--yellow)" }}
                        >
                          Atenção
                        </span>
                      )}
                    </div>

                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {fmt(spent)} de{" "}
                      {editingId === categoryId ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 rounded px-2 py-0.5 text-xs"
                            style={{
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-primary)",
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(categoryId);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(categoryId)}
                            className="cursor-pointer"
                            style={{ color: "var(--green)" }}
                            disabled={saving}
                          >
                            <MdCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="cursor-pointer"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <MdClose className="h-4 w-4" />
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => { setEditingId(categoryId); setEditValue(String(limit)); }}
                          className="underline cursor-pointer"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {fmt(limit)}
                        </button>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => { setEditingId(categoryId); setEditValue(String(limit)); }}
                      className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                      style={{ color: "var(--accent-light)" }}
                    >
                      <MdEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goalId)}
                      className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                      style={{ color: "var(--red)" }}
                    >
                      <MdDelete className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-overlay)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        background: isOver ? "var(--red)" : isWarning ? "var(--yellow)" : "var(--accent)",
                      }}
                    />
                  </div>
                  <div
                    className="flex justify-between text-xs mt-1"
                    style={{ color: "var(--text-disabled)" }}
                  >
                    <span>0%</span>
                    <span style={{ color: isOver ? "var(--red)" : isWarning ? "var(--yellow)" : "var(--text-muted)" }}>
                      {percent.toFixed(1)}% usado
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botão de adicionar mais metas (ao final da lista) */}
          {categoriesAvailable.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: "transparent",
                border: "1px dashed var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <MdAdd className="h-4 w-4" />
              Adicionar outra meta
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddGoalModal
          categoriesAvailable={categoriesAvailable}
          onClose={() => setShowModal(false)}
          onSave={addGoal}
        />
      )}
    </div>
  );
}
