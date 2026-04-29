"use client";

import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { useAmountInput } from "@/app/hooks/useAmountInput";
import { createTransferController } from "@/controllers/transaction/CreateTransferController";
import { payerTransactionController } from "@/controllers/transaction/PayerTransactionController";
import {
  FiX,
  FiCheck,
  FiAlertCircle,
  FiLoader,
  FiArrowRight,
} from "react-icons/fi";

interface FormErrors {
  amount?: string;
  fromAccountId?: string;
  toAccountId?: string;
  dueDate?: string;
}

export const FormAddTransfer = ({ onClose }: { onClose: () => void }) => {
  const { accounts, addTransaction, updateTransaction, refreshAccounts } =
    useUser();
  const amountInput = useAmountInput();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [markAsPaid, setMarkAsPaid] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const fromAccountId = String(formData.get("fromAccountId") || "");
    const toAccountId = String(formData.get("toAccountId") || "");
    const dueDate = String(formData.get("dueDate") || "");
    const description = String(formData.get("description") || "").trim();
    const amount = amountInput.parseAmount();

    const newErrors: FormErrors = {};
    if (!amount || isNaN(amount) || amount <= 0)
      newErrors.amount = "Informe um valor válido maior que zero";
    if (!fromAccountId)
      newErrors.fromAccountId = "Selecione a conta de origem";
    if (!toAccountId)
      newErrors.toAccountId = "Selecione a conta de destino";
    if (fromAccountId && toAccountId && fromAccountId === toAccountId)
      newErrors.toAccountId = "Conta de destino deve ser diferente da origem";
    if (!dueDate) newErrors.dueDate = "Data é obrigatória";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const dueDateString = new Date(dueDate).toISOString().split("T")[0];
    const [year, month, day] = dueDateString.split("-").map(Number);
    const dueDateObj = new Date(year, month - 1, day);

    try {
      const transfer = await createTransferController({
        amount,
        fromAccountId,
        toAccountId,
        dueDate: dueDateObj,
        description: description || "Transferência",
      });

      if (transfer) {
        addTransaction(transfer);

        if (markAsPaid) {
          try {
            const paidTx = await payerTransactionController(
              transfer.id,
              year,
              month,
              fromAccountId
            );
            if (paidTx) {
              updateTransaction(paidTx);
              await refreshAccounts();
            }
          } catch (err) {
            console.warn("Não foi possível confirmar a transferência:", err);
          }
        }
      }

      setSuccessMessage(
        markAsPaid
          ? "Transferência registrada e confirmada!"
          : "Transferência registrada!"
      );
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Ocorreu um erro ao registrar a transferência.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 py-6 px-2 overflow-y-auto max-w-[500px]
        mx-auto bg-gray-900 rounded-xl fixed top-[48px] bottom-[60px] left-0 right-0 z-30
        md:left-auto md:top-0 md:bottom-0 md:border md:border-gray-700 md:w-[500px]
        md:h-auto md:rounded-none md:shadow-none`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--border-accent)" }}
          >
            <FiArrowRight className="h-3.5 w-3.5" style={{ color: "var(--accent-light)" }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">
            Nova Transferência
          </h2>
        </div>
        <button
          className="px-2 py-1 rounded-lg cursor-pointer text-gray-400 hover:bg-violet-800 transition-all"
          onClick={onClose}
          disabled={isLoading}
        >
          <FiX className="h-7 w-7" />
        </button>
      </div>

      {/* Feedback */}
      {successMessage && (
        <div className="mx-2 flex items-center gap-2 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-400 text-sm">
          <FiCheck className="h-4 w-4 shrink-0" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mx-2 flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
          <FiAlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
        </div>
      )}

      <form
        className="flex flex-col gap-4 overflow-x-hidden px-2 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Valor */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Valor <span className="text-red-400">*</span>
          </p>
          <input
            className={`input money ${errors.amount ? "border-red-500 focus:border-red-400" : ""}`}
            type="text"
            inputMode="decimal"
            placeholder="Ex: 1.500,00"
            value={amountInput.raw}
            onChange={amountInput.handleChange}
            disabled={isLoading}
          />
          {errors.amount && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.amount}
            </p>
          )}
        </label>

        {/* Conta de origem */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            De (conta de origem) <span className="text-red-400">*</span>
          </p>
          <select
            className={`input ${errors.fromAccountId ? "border-red-500" : ""}`}
            name="fromAccountId"
            disabled={isLoading}
          >
            <option value="">Selecione a conta de origem</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.fromAccountId && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.fromAccountId}
            </p>
          )}
        </label>

        {/* Seta visual */}
        <div className="flex items-center justify-center gap-2 -my-1">
          <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--border-accent)" }}
          >
            <FiArrowRight className="h-3.5 w-3.5" style={{ color: "var(--accent-light)" }} />
          </div>
          <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
        </div>

        {/* Conta de destino */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Para (conta de destino) <span className="text-red-400">*</span>
          </p>
          <select
            className={`input ${errors.toAccountId ? "border-red-500" : ""}`}
            name="toAccountId"
            disabled={isLoading}
          >
            <option value="">Selecione a conta de destino</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.toAccountId && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.toAccountId}
            </p>
          )}
        </label>

        {/* Data */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Data <span className="text-red-400">*</span>
          </p>
          <input
            className={`input max-w-[100%] ${errors.dueDate ? "border-red-500" : ""}`}
            type="date"
            name="dueDate"
            disabled={isLoading}
            style={{ colorScheme: "dark" }}
          />
          {errors.dueDate && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.dueDate}
            </p>
          )}
        </label>

        {/* Descrição (opcional) */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">Descrição (opcional)</p>
          <input
            className="input"
            type="text"
            placeholder="Ex: Reserva de emergência, Poupança..."
            name="description"
            disabled={isLoading}
          />
        </label>

        {/* Toggle "já foi transferido" */}
        <div
          className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all"
          style={{
            background: markAsPaid
              ? "rgba(139,92,246,0.1)"
              : "rgba(255,255,255,0.04)",
            border: markAsPaid
              ? "1px solid rgba(139,92,246,0.3)"
              : "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          }}
          onClick={() => !isLoading && setMarkAsPaid((p) => !p)}
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary, #f0f4ff)" }}>
              Já foi transferido
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted, #475569)" }}>
              {markAsPaid
                ? "Saldos das contas serão atualizados agora"
                : "Marcar como pendente por ora"}
            </p>
          </div>
          <div
            className="w-10 h-5 rounded-full relative transition-all duration-200 shrink-0"
            style={{
              background: markAsPaid ? "var(--accent, #7c3aed)" : "rgba(255,255,255,0.12)",
            }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
              style={{ left: markAsPaid ? "calc(100% - 18px)" : "2px" }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          className="button min-h-[45px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)" }}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <FiLoader className="h-4 w-4 animate-spin" />
              {markAsPaid ? "Registrando e confirmando..." : "Registrando..."}
            </span>
          ) : (
            "Registrar Transferência"
          )}
        </button>
      </form>
    </div>
  );
};
