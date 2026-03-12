"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/app/hooks/useUser";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionRemovalScope } from "@/domain/enums/transaction/TransactionRemovalScope";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { ICategory } from "@/domain/interfaces/category/ICategory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiInfo,
  FiChevronRight,
} from "react-icons/fi";
import { MdRepeat } from "react-icons/md";
import {
  editTransactionController,
  EditScope,
} from "@/controllers/transaction/EditTransactionController";

// ── Tipos ───────────────────────────────────────────────────────
interface TransactionDetailsProps {
  transaction: ITransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = "view" | "edit_choose_scope" | "edit_form" | "delete_scope";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── Sub-componentes fora do pai ─────────────────────────────────
// REGRA: nunca defina componentes dentro de outros componentes.
// Toda vez que o pai re-renderiza (ex: ao digitar num input), os
// componentes filhos definidos inline são tratados como tipos novos
// pelo React, que os desmonta e remonta — perdendo foco e estado local.
// Mover para fora garante identidade estável entre renders.

interface ScopeOptionProps {
  title: string;
  description: string;
  scope: EditScope;
  selected: EditScope;
  onSelect: (s: EditScope) => void;
  warn?: boolean;
}

function ScopeOption({
  title,
  description,
  scope,
  selected,
  onSelect,
  warn = false,
}: ScopeOptionProps) {
  const active = selected === scope;
  return (
    <button
      onClick={() => onSelect(scope)}
      className="w-full text-left p-3.5 rounded-xl transition-all cursor-pointer"
      style={{
        background: active ? "var(--accent-dim)" : "var(--bg-overlay)",
        border: active
          ? "1px solid var(--border-accent)"
          : "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center"
          style={{
            borderColor: active ? "var(--accent)" : "var(--border-strong)",
            background: active ? "var(--accent)" : "transparent",
          }}
        >
          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <p
            className="text-sm font-medium"
            style={{
              color: warn && active ? "var(--yellow)" : "var(--text-primary)",
            }}
          >
            {title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

interface DeleteOptionProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant: "neutral" | "danger";
}

function DeleteOption({
  label,
  sublabel,
  onClick,
  variant,
}: DeleteOptionProps) {
  return (
    <button
      onClick={onClick}
      className="w-full h-auto min-h-[44px] rounded-xl text-sm font-medium transition-all cursor-pointer text-left px-4 py-3 flex flex-col gap-0.5"
      style={
        variant === "danger"
          ? {
              background: "var(--red-dim)",
              color: "var(--red)",
              border: "1px solid rgba(239,68,68,0.3)",
            }
          : {
              background: "var(--bg-overlay)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }
      }
      onMouseEnter={(e) => {
        if (variant === "neutral")
          e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        if (variant === "neutral")
          e.currentTarget.style.borderColor = "var(--border-default)";
      }}
    >
      {label}
      {sublabel && (
        <span
          className="text-xs font-normal"
          style={{ color: "var(--text-muted)", display: "block" }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

// Props explícitas para ScopeChoiceScreen e EditFormScreen
interface ScopeChoiceScreenProps {
  editScope: EditScope;
  setEditScope: (s: EditScope) => void;
  onContinue: () => void;
  isRecurring: boolean;
  isInstallment: boolean;
  year: number;
  month: number;
}

function ScopeChoiceScreen({
  editScope,
  setEditScope,
  onContinue,
  isRecurring,
  isInstallment,
  year,
  month,
}: ScopeChoiceScreenProps) {
  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        O que você quer alterar?
      </p>

      <ScopeOption
        title="Descrição ou categoria"
        description="Corrige nome, categoria ou conta sem mudar valores. Aplica em todos os meses."
        scope={EditScope.SINGLE}
        selected={editScope}
        onSelect={setEditScope}
      />

      {isRecurring && (
        <ScopeOption
          title={`Valor a partir de ${format(
            new Date(year, month - 1),
            "MMM/yyyy",
            { locale: ptBR }
          )}`}
          description={
            isInstallment
              ? "Atualiza esta e todas as parcelas pendentes seguintes. Parcelas já pagas ficam com o valor original."
              : "Atualiza o valor desta e de todas as ocorrências futuras. Histórico preservado."
          }
          scope={EditScope.AMOUNT_FORWARD}
          selected={editScope}
          onSelect={setEditScope}
        />
      )}

      <ScopeOption
        title={
          isRecurring
            ? "Alterar tudo (todas as ocorrências)"
            : "Editar transação"
        }
        description={
          isRecurring
            ? "Recalcula o valor de todos os pagamentos ainda pendentes. Use para corrigir erros."
            : "Altera descrição, valor e categoria desta transação."
        }
        scope={EditScope.ALL}
        selected={editScope}
        onSelect={setEditScope}
        warn={isRecurring}
      />

      <button
        onClick={onContinue}
        className="button button-primary w-full mt-2"
      >
        Continuar <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

interface EditFormScreenProps {
  editScope: EditScope;
  isInstallment: boolean;
  editedDesc: string;
  setEditedDesc: (v: string) => void;
  editedAmount: number;
  setEditedAmount: (v: number) => void;
  editedCategory: string;
  setEditedCategory: (v: string) => void;
  categories: ICategory[] | null;
  installmentsCount?: number;
  year: number;
  month: number;
}

function EditFormScreen({
  editScope,
  isInstallment,
  editedDesc,
  setEditedDesc,
  editedAmount,
  setEditedAmount,
  editedCategory,
  setEditedCategory,
  categories,
  installmentsCount,
  year,
  month,
}: EditFormScreenProps) {
  const showAmountField = editScope !== EditScope.SINGLE;

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
        style={{
          background: "var(--accent-dim)",
          color: "var(--accent-light)",
        }}
      >
        <FiInfo className="h-3.5 w-3.5 shrink-0" />
        {editScope === EditScope.SINGLE && "Alterando: descrição e categoria"}
        {editScope === EditScope.AMOUNT_FORWARD &&
          `Alterando: valor a partir de ${format(
            new Date(year, month - 1),
            "MMM/yyyy",
            { locale: ptBR }
          )}`}
        {editScope === EditScope.ALL &&
          "Alterando: tudo (todos os meses pendentes)"}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          className="text-[0.65rem] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Descrição
        </label>
        <input
          className="input"
          value={editedDesc}
          onChange={(e) => setEditedDesc(e.target.value)}
          placeholder="Ex: Aluguel, Supermercado..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          className="text-[0.65rem] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Categoria
        </label>
        <select
          className="input"
          value={editedCategory}
          onChange={(e) => setEditedCategory(e.target.value)}
        >
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {showAmountField && (
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[0.65rem] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {editScope === EditScope.AMOUNT_FORWARD && isInstallment
              ? "Novo valor por parcela"
              : editScope === EditScope.AMOUNT_FORWARD
              ? "Novo valor mensal"
              : "Valor total"}
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              R$
            </span>
            <input
              className="input money"
              style={{ paddingLeft: "2.25rem" }}
              type="number"
              step="0.01"
              min="0.01"
              value={editedAmount}
              onChange={(e) => setEditedAmount(Number(e.target.value))}
            />
          </div>
          {isInstallment &&
            editScope === EditScope.ALL &&
            installmentsCount && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Parcela:{" "}
                <span style={{ color: "var(--text-secondary)" }}>
                  {fmt(editedAmount / installmentsCount)} × {installmentsCount}x
                </span>
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────
export const TransactionDetails = ({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsProps) => {
  const { categories, removeTransaction, updateTransaction, year, month } =
    useUser();

  const [step, setStep] = useState<ModalStep>("view");
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editScope, setEditScope] = useState<EditScope>(EditScope.SINGLE);
  const [editedDesc, setEditedDesc] = useState("");
  const [editedAmount, setEditedAmount] = useState(0);
  const [editedCategory, setEditedCategory] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (transaction) {
      setStep("view");
      setEditedDesc(transaction.description ?? "");
      setEditedAmount(transaction.amount);
      setEditedCategory(transaction.categoryId);
      setEditScope(EditScope.SINGLE);
    }
  }, [transaction?.id]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step !== "view") setStep("view");
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, onClose]);

  if (!isOpen || !transaction || !mounted) return null;

  const isDeposit = transaction.type === TransactionTypes.DEPOSIT;
  const isSimple = transaction.kind === TransactionKind.SIMPLE;
  const isFixed = transaction.kind === TransactionKind.FIXED;
  const isInstallment = transaction.kind === TransactionKind.INSTALLMENT;
  const isRecurring = isFixed || isInstallment;

  const getCategoryName = (id: string) =>
    categories?.find((c) => c.id === id)?.name ?? "Sem categoria";

  const handleSave = async () => {
    if (!transaction) return;
    setIsSaving(true);
    try {
      const payload = {
        description: editedDesc,
        categoryId: editedCategory,
        ...(editScope !== EditScope.SINGLE && { amount: editedAmount }),
      };
      const updated = await editTransactionController(
        transaction.id,
        payload,
        editScope,
        editScope === EditScope.AMOUNT_FORWARD ? year : undefined,
        editScope === EditScope.AMOUNT_FORWARD ? month : undefined
      );
      updateTransaction(updated);
      setStep("view");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (scope: TransactionRemovalScope) => {
    if (!transaction) return;
    await removeTransaction(transaction.id, scope, year, month);
    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(7,11,20,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in-scale"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-elevated), 0 0 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5">
            {step !== "view" && (
              <button
                onClick={() =>
                  step === "edit_form"
                    ? setStep(isSimple ? "view" : "edit_choose_scope")
                    : setStep("view")
                }
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                style={{
                  color: "var(--text-muted)",
                  transform: "rotate(180deg)",
                }}
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            )}
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: isDeposit ? "var(--green)" : "var(--red)" }}
            />
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {step === "view" && "Detalhes"}
              {step === "edit_choose_scope" && "Editar transação"}
              {step === "edit_form" && "Editar transação"}
              {step === "delete_scope" && "Excluir transação"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
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
        </div>

        {/* Conteúdo */}
        {step === "view" && (
          <div className="px-5 py-4 flex flex-col gap-4">
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: isDeposit ? "var(--green-dim)" : "var(--red-dim)",
                border: `1px solid ${
                  isDeposit ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"
                }`,
              }}
            >
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {isDeposit ? "Receita" : "Despesa"}
                  {isInstallment &&
                    transaction.recurrence.installmentsCount && (
                      <span>
                        {" "}
                        · {transaction.paymentHistory.length}/
                        {transaction.recurrence.installmentsCount}x
                      </span>
                    )}
                  {isFixed && <span> · Fixo mensal</span>}
                </p>
                <p
                  className="money text-2xl font-semibold"
                  style={{ color: isDeposit ? "var(--green)" : "var(--red)" }}
                >
                  {isDeposit ? "+" : "-"}
                  {fmt(
                    isInstallment && transaction.paymentHistory[0]
                      ? transaction.paymentHistory[0].amount
                      : transaction.amount
                  )}
                </p>
                {isInstallment && transaction.paymentHistory[0] && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Total: {fmt(transaction.amount)}
                  </p>
                )}
              </div>
              <span
                className="badge"
                style={
                  transaction.paymentHistory[0]?.isPaid
                    ? { background: "var(--green-dim)", color: "var(--green)" }
                    : {
                        background: "var(--yellow-dim)",
                        color: "var(--yellow)",
                      }
                }
              >
                {transaction.paymentHistory[0]?.isPaid ? "✓ Pago" : "Pendente"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Descrição",
                  value: transaction.description || "—",
                  full: true,
                },
                {
                  label: "Categoria",
                  value: getCategoryName(transaction.categoryId),
                },
                {
                  label: "Vencimento",
                  value: format(new Date(transaction.dueDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  }),
                },
                {
                  label: "Recorrência",
                  value: isSimple
                    ? "Simples"
                    : isFixed
                    ? "Fixo"
                    : `${transaction.paymentHistory.length}/${transaction.recurrence.installmentsCount}x`,
                },
              ].map(({ label, value, full }) => (
                <div key={label} className={full ? "col-span-2" : ""}>
                  <p
                    className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {isRecurring && (
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "var(--accent-dim)",
                  color: "var(--accent-light)",
                }}
              >
                <MdRepeat className="h-3.5 w-3.5 shrink-0" />
                {isFixed
                  ? "Transação recorrente — aparece todo mês automaticamente"
                  : `Parcelado em ${transaction.recurrence.installmentsCount}x — cada parcela é um mês`}
              </div>
            )}
          </div>
        )}

        {step === "edit_choose_scope" && (
          <ScopeChoiceScreen
            editScope={editScope}
            setEditScope={setEditScope}
            onContinue={() => setStep("edit_form")}
            isRecurring={isRecurring}
            isInstallment={isInstallment}
            year={year}
            month={month}
          />
        )}

        {step === "edit_form" && (
          <EditFormScreen
            editScope={editScope}
            isInstallment={isInstallment}
            editedDesc={editedDesc}
            setEditedDesc={setEditedDesc}
            editedAmount={editedAmount}
            setEditedAmount={setEditedAmount}
            editedCategory={editedCategory}
            setEditedCategory={setEditedCategory}
            categories={categories}
            installmentsCount={transaction.recurrence.installmentsCount}
            year={year}
            month={month}
          />
        )}

        {step === "delete_scope" && (
          <div className="px-5 py-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--red-dim)" }}
              >
                <FiAlertTriangle
                  className="h-4 w-4"
                  style={{ color: "var(--red)" }}
                />
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Excluir transação
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {transaction.description || "Sem descrição"}
                </p>
              </div>
            </div>
            {!isSimple && (
              <>
                <DeleteOption
                  label="Apenas esta ocorrência"
                  sublabel={`Remove só ${format(
                    new Date(year, month - 1),
                    "MMMM/yyyy",
                    { locale: ptBR }
                  )}`}
                  onClick={() =>
                    handleDelete(TransactionRemovalScope.CURRENT_MONTH)
                  }
                  variant="neutral"
                />
                <DeleteOption
                  label="Esta e todas as seguintes"
                  sublabel="Remove a partir deste mês em diante"
                  onClick={() =>
                    handleDelete(TransactionRemovalScope.FROM_MONTH_ONWARD)
                  }
                  variant="neutral"
                />
              </>
            )}
            <DeleteOption
              label={isSimple ? "Confirmar exclusão" : "Todas as ocorrências"}
              sublabel={
                isSimple ? undefined : "Remove completamente do histórico"
              }
              onClick={() => handleDelete(TransactionRemovalScope.ALL)}
              variant="danger"
            />
            <button
              onClick={() => setStep("view")}
              className="w-full mt-1 text-xs underline underline-offset-2 cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-4 gap-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {step === "view" && (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isSimple) {
                      setEditScope(EditScope.ALL);
                      setStep("edit_form");
                    } else setStep("edit_choose_scope");
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    background: "var(--bg-overlay)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  title="Editar"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setStep("delete_scope")}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    background: "var(--red-dim)",
                    color: "var(--red)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                  title="Excluir"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="button button-ghost h-9 px-4 text-sm"
              >
                Fechar
              </button>
            </>
          )}

          {step === "edit_form" && (
            <>
              <button
                onClick={() => setStep(isSimple ? "view" : "edit_choose_scope")}
                className="button button-ghost h-9 px-4 text-sm"
              >
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="button button-primary h-9 px-5 text-sm"
              >
                {isSaving ? (
                  "Salvando..."
                ) : (
                  <>
                    <FiCheck className="h-3.5 w-3.5" /> Salvar
                  </>
                )}
              </button>
            </>
          )}

          {(step === "edit_choose_scope" || step === "delete_scope") && (
            <button
              onClick={() => setStep("view")}
              className="button button-ghost h-9 px-4 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
