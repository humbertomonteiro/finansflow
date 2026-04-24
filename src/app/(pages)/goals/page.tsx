"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { Title } from "@/app/components/shared/Title";
import { ICategory } from "@/domain/interfaces/category/ICategory";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdCheck,
  MdClose,
  MdOutlineFlagCircle,
} from "react-icons/md";
import { FiAlertTriangle } from "react-icons/fi";

interface GoalEntry {
  categoryId: string;
  limit: number; // limite de gasto mensal em R$
}

type GoalsMap = Record<string, number>; // categoryId -> limit

const STORAGE_KEY = "finansflow-goals";

const loadGoals = (): GoalsMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveGoals = (goals: GoalsMap) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
};

export default function Goals() {
  const { user, loading, categories, dataCategoryExpenses, month, year } =
    useUser();
  const router = useRouter();

  const [goals, setGoals] = useState<GoalsMap>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  const categoriesWithGoal = Object.keys(goals);
  const categoriesAvailable =
    categories?.filter((c) => !categoriesWithGoal.includes(c.id)) ?? [];

  const getSpent = (categoryId: string): number => {
    if (!dataCategoryExpenses) return 0;
    const entry = dataCategoryExpenses.expenses.find(
      (e) => e.categoryId === categoryId
    );
    return entry?.amount ?? 0;
  };

  const getCategoryName = (categoryId: string): string => {
    return categories?.find((c) => c.id === categoryId)?.name ?? "Categoria";
  };

  const handleAddGoal = () => {
    setAddError(null);
    if (!newCategoryId) {
      setAddError("Selecione uma categoria.");
      return;
    }
    const limit = Number(newLimit.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!limit || limit <= 0) {
      setAddError("Informe um limite válido maior que zero.");
      return;
    }
    const updated = { ...goals, [newCategoryId]: limit };
    setGoals(updated);
    saveGoals(updated);
    setNewCategoryId("");
    setNewLimit("");
  };

  const handleDeleteGoal = (categoryId: string) => {
    const updated = { ...goals };
    delete updated[categoryId];
    setGoals(updated);
    saveGoals(updated);
  };

  const handleStartEdit = (categoryId: string) => {
    setEditingId(categoryId);
    setEditValue(String(goals[categoryId]));
  };

  const handleSaveEdit = (categoryId: string) => {
    const limit = Number(editValue.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!limit || limit <= 0) return;
    const updated = { ...goals, [categoryId]: limit };
    setGoals(updated);
    saveGoals(updated);
    setEditingId(null);
    setEditValue("");
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Resumo geral
  const totalLimit = Object.values(goals).reduce((a, b) => a + b, 0);
  const totalSpent = Object.keys(goals).reduce(
    (acc, id) => acc + getSpent(id),
    0
  );
  const totalPercent =
    totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
  const overBudgetCount = Object.keys(goals).filter(
    (id) => getSpent(id) > goals[id]
  ).length;

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>;
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={true}>Metas</Title>

      <p className="text-gray-400 text-sm px-1">
        Defina limites mensais de gastos por categoria e acompanhe se está
        dentro do orçamento.
      </p>

      {/* Card resumo geral */}
      {Object.keys(goals).length > 0 && (
        <div
          className="rounded-xl p-4 border border-gray-800 flex flex-col gap-3"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Orçamento total definido
              </p>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(totalLimit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Gasto até agora
              </p>
              <p
                className={`text-2xl font-bold ${
                  totalSpent > totalLimit ? "text-red-400" : "text-green-400"
                }`}
              >
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>

          {/* Barra de progresso geral */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progresso</span>
              <span>{totalPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalPercent >= 100
                    ? "bg-red-500"
                    : totalPercent >= 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          </div>

          {overBudgetCount > 0 && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <FiAlertTriangle className="h-3 w-3 shrink-0" />
              {overBudgetCount}{" "}
              {overBudgetCount === 1
                ? "categoria ultrapassou"
                : "categorias ultrapassaram"}{" "}
              o limite este mês.
            </div>
          )}
        </div>
      )}

      {/* Lista de metas */}
      {Object.keys(goals).length === 0 ? (
        <div
          className="rounded-xl p-8 border border-gray-800 text-center"
          style={{ background: "var(--bg-surface)" }}
        >
          <MdOutlineFlagCircle className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            Você ainda não definiu nenhuma meta.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Adicione uma meta abaixo para começar a controlar seus gastos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.entries(goals).map(([categoryId, limit]) => {
            const spent = getSpent(categoryId);
            const percent = Math.min((spent / limit) * 100, 100);
            const isOver = spent > limit;
            const isWarning = !isOver && percent >= 80;

            return (
              <div
                key={categoryId}
                style={{ background: "var(--bg-surface)" }}
                className={`rounded-xl p-4 border transition-colors ${
                  isOver
                    ? "border-red-800"
                    : isWarning
                    ? "border-yellow-800"
                    : "border-gray-800"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-200 font-medium truncate">
                        {getCategoryName(categoryId)}
                      </p>
                      {isOver && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-400 shrink-0">
                          Excedeu
                        </span>
                      )}
                      {isWarning && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/60 text-yellow-400 shrink-0">
                          Atenção
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatCurrency(spent)} de{" "}
                      {editingId === categoryId ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-gray-200 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(categoryId);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(categoryId)}
                            className="text-green-400 hover:text-green-300 cursor-pointer"
                          >
                            <MdCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 hover:text-gray-300 cursor-pointer"
                          >
                            <MdClose className="h-4 w-4" />
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(categoryId)}
                          className="underline hover:text-gray-300 cursor-pointer"
                        >
                          {formatCurrency(limit)}
                        </button>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleStartEdit(categoryId)}
                      className="h-8 w-8 rounded-full hover:bg-blue-900/50 flex items-center justify-center text-blue-400 cursor-pointer"
                    >
                      <MdEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(categoryId)}
                      className="h-8 w-8 rounded-full hover:bg-red-900/50 flex items-center justify-center text-red-400 cursor-pointer"
                    >
                      <MdDelete className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? "bg-red-500"
                          : isWarning
                          ? "bg-yellow-500"
                          : "bg-violet-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0%</span>
                    <span
                      className={
                        isOver
                          ? "text-red-400"
                          : isWarning
                          ? "text-yellow-400"
                          : "text-gray-400"
                      }
                    >
                      {percent.toFixed(1)}% usado
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adicionar nova meta */}
      <div
        className="rounded-xl p-4 border border-gray-800"
        style={{ background: "var(--bg-surface)" }}
      >
        <h3 className="text-gray-300 font-medium mb-4 flex items-center gap-2">
          <MdAdd className="h-5 w-5 text-violet-400" />
          Adicionar meta de gasto
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-gray-500 text-xs mb-1">Categoria</p>
            <select
              className="input"
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {categoriesAvailable.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-gray-500 text-xs mb-1">Limite mensal (R$)</p>
            <input
              className="input"
              type="text"
              placeholder="Ex: 500,00"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
            />
          </div>

          {addError && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <FiAlertTriangle className="h-3 w-3" /> {addError}
            </p>
          )}

          <button
            onClick={handleAddGoal}
            className="button bg-violet-700 hover:bg-violet-600 text-white font-semibold"
          >
            <span className="flex items-center gap-2">
              <MdAdd /> Definir Meta
            </span>
          </button>
        </div>

        {categoriesAvailable.length === 0 && Object.keys(goals).length > 0 && (
          <p className="text-gray-600 text-xs mt-3 text-center">
            Todas as categorias já têm uma meta definida.
          </p>
        )}
      </div>

      <p className="text-gray-700 text-xs text-center pb-4">
        As metas são salvas localmente no seu dispositivo.
      </p>
    </div>
  );
}
