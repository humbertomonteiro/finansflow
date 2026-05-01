"use client";

import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { useAmountInput } from "@/app/hooks/useAmountInput";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { IRecurrence } from "@/domain/interfaces/transaction/IRecurrence";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { createTransactionController } from "@/controllers/transaction/CreateTransactionController";
import { createTransferController } from "@/controllers/transaction/CreateTransferController";
import { payerTransactionController } from "@/controllers/transaction/PayerTransactionController";
import { FiX, FiCheck, FiAlertCircle, FiLoader, FiArrowRight } from "react-icons/fi";

interface FormErrors {
  description?: string;
  amount?: string;
  dueDate?: string;
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
}

export const FormAddTransaction = ({ onClose }: { onClose: () => void }) => {
  const { categories, accounts, creditCards, addTransaction, updateTransaction, refreshAccounts } = useUser();

  const [showInstallment, setShowInstallment] = useState(true);
  const [type, setType] = useState<TransactionTypes>(TransactionTypes.DEPOSIT);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [selectedSource, setSelectedSource] = useState(""); // "acc_<id>" | "cc_<id>"

  const amountInput = useAmountInput();

  const isDeposit = type === TransactionTypes.DEPOSIT;
  const isTransfer = type === TransactionTypes.TRANSFER;
  const isCreditCardSelected = selectedSource.startsWith("cc_");

  const handleTypeChange = (selected: TransactionTypes) => {
    setType(selected);
    setErrors({});
    setMarkAsPaid(false);
    setSelectedSource("");
  };

  const getKindAndRecurrence = (
    isFixed: boolean,
    installments: number
  ): { kind: TransactionKind; recurrence: IRecurrence } => {
    if (isFixed) return { kind: TransactionKind.FIXED, recurrence: {} };
    if (showInstallment && installments > 1)
      return { kind: TransactionKind.INSTALLMENT, recurrence: { installmentsCount: installments } };
    return { kind: TransactionKind.SIMPLE, recurrence: {} };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const amount = amountInput.parseAmount();
    const dueDate = String(formData.get("dueDate") || "");

    // ── Transferência ────────────────────────────────────────────────
    if (isTransfer) {
      const fromAccountId = String(formData.get("fromAccountId") || "");
      const toAccountId = String(formData.get("toAccountId") || "");
      const description = String(formData.get("description") || "").trim();

      const newErrors: FormErrors = {};
      if (!amount || isNaN(amount) || amount <= 0)
        newErrors.amount = "Informe um valor válido maior que zero";
      if (!fromAccountId) newErrors.fromAccountId = "Selecione a conta de origem";
      if (!toAccountId) newErrors.toAccountId = "Selecione a conta de destino";
      if (fromAccountId && toAccountId && fromAccountId === toAccountId)
        newErrors.toAccountId = "Conta de destino deve ser diferente da origem";
      if (!dueDate) newErrors.dueDate = "Data é obrigatória";

      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
      setErrors({});
      setIsLoading(true);

      const dueDateString = new Date(dueDate).toISOString().split("T")[0];
      const [y, m, d] = dueDateString.split("-").map(Number);
      const dueDateObj = new Date(y, m - 1, d);

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
              const paidTx = await payerTransactionController(transfer.id, y, m, fromAccountId);
              if (paidTx) { updateTransaction(paidTx); await refreshAccounts(); }
            } catch (err) {
              console.warn("Não foi possível confirmar a transferência:", err);
            }
          }
        }

        setSuccessMessage(markAsPaid ? "Transferência registrada e confirmada!" : "Transferência registrada!");
        setTimeout(() => onClose(), 1000);
      } catch (err) {
        console.error(err);
        setErrorMessage("Ocorreu um erro ao registrar a transferência.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Receita / Despesa ────────────────────────────────────────────
    const description = String(formData.get("description") || "").trim();
    const categoryId = String(formData.get("categoryId") || "");
    const isFixed = formData.get("fixed") === "on";
    const installments = Number(formData.get("installments") || 1);

    let accountId: string | undefined;
    let creditCardId: string | undefined;
    if (selectedSource.startsWith("acc_")) {
      accountId = selectedSource.slice(4);
    } else if (selectedSource.startsWith("cc_")) {
      creditCardId = selectedSource.slice(3);
    }

    const newErrors: FormErrors = {};
    if (!description.trim()) newErrors.description = "Descrição é obrigatória";
    else if (description.trim().length < 3) newErrors.description = "Descrição deve ter ao menos 3 caracteres";
    if (!amount || isNaN(amount) || amount <= 0) newErrors.amount = "Informe um valor válido maior que zero";
    if (!dueDate) newErrors.dueDate = "Data de vencimento é obrigatória";
    if (!categoryId) newErrors.categoryId = "Selecione uma categoria";
    if (!selectedSource) newErrors.accountId = "Selecione uma conta ou cartão";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);

    const { kind, recurrence } = getKindAndRecurrence(isFixed, installments);
    const dueDateString = new Date(dueDate).toISOString().split("T")[0];
    const [year, month, day] = dueDateString.split("-").map(Number);

    const newTransaction: Omit<ITransaction, "id" | "paymentHistory"> = {
      type,
      amount,
      dueDate: new Date(year, month - 1, day),
      categoryId,
      ...(accountId && { accountId }),
      ...(creditCardId && { creditCardId }),
      description,
      recurrence,
      kind,
    };

    try {
      const created = await createTransactionController(newTransaction);

      if (created) {
        addTransaction(created);
        if (markAsPaid && !creditCardId) {
          try {
            const paidTx = await payerTransactionController(created.id, year, month, accountId);
            if (paidTx) updateTransaction(paidTx);
          } catch (err) {
            console.warn("Não foi possível marcar como pago:", err);
          }
        }
      }

      const label = isDeposit ? "Receita" : "Despesa";
      setSuccessMessage(
        markAsPaid
          ? `${label} adicionada e marcada como ${isDeposit ? "recebida" : "paga"}!`
          : `${label} adicionada com sucesso!`
      );
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error(error);
      setErrorMessage("Ocorreu um erro ao adicionar a transação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeColor = isDeposit
    ? "bg-green-400 text-gray-900"
    : isTransfer
    ? "bg-violet-500 text-white"
    : "bg-red-400 text-gray-900";

  return (
    <div
      className={`flex flex-col gap-2 py-6 px-2 overflow-y-auto max-w-[500px]
        mx-auto bg-gray-900 rounded-xl fixed top-[48px] bottom-[60px] left-0 right-0 z-30
        md:left-auto md:top-0 md:bottom-0 md:border md:border-gray-700 md:w-[500px]
        md:h-auto md:rounded-none md:shadow-none`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-100">Adicionar Transação</h2>
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

      {/* Seletor de tipo — 3 botões */}
      <div className="flex items-center gap-2 mb-2 px-2">
        {[
          { t: TransactionTypes.DEPOSIT, label: "Receita", active: "bg-green-400 text-gray-900" },
          { t: TransactionTypes.WITHDRAW, label: "Despesa", active: "bg-red-400 text-gray-900" },
          { t: TransactionTypes.TRANSFER, label: "Transferência", active: "bg-violet-500 text-white" },
        ].map(({ t, label, active }) => (
          <button
            key={t}
            type="button"
            disabled={isLoading}
            className={`button flex-1 font-semibold transition-all text-sm ${
              type === t ? active : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
            onClick={() => handleTypeChange(t)}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-4 overflow-x-hidden px-2 w-full" onSubmit={handleSubmit} noValidate>

        {/* ── Campos comuns: Valor e Data ── */}
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

        {/* ── Campos exclusivos: Receita/Despesa ── */}
        {!isTransfer && (
          <>
            <label>
              <p className="text-gray-500 text-xs ml-1 mb-1">
                Descrição <span className="text-red-400">*</span>
              </p>
              <input
                className={`input ${errors.description ? "border-red-500 focus:border-red-400" : ""}`}
                type="text"
                placeholder="Ex: Salário, Mercado, Netflix..."
                name="description"
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                  <FiAlertCircle className="h-3 w-3" /> {errors.description}
                </p>
              )}
            </label>

            <label>
              <p className="text-gray-500 text-xs ml-1 mb-1">
                Data de vencimento <span className="text-red-400">*</span>
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

            <label>
              <p className="text-gray-500 text-xs ml-1 mb-1">
                Categoria <span className="text-red-400">*</span>
              </p>
              <select
                className={`input ${errors.categoryId ? "border-red-500" : ""}`}
                name="categoryId"
                disabled={isLoading}
              >
                <option value="">Selecione uma categoria</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                  <FiAlertCircle className="h-3 w-3" /> {errors.categoryId}
                </p>
              )}
            </label>

            <label>
              <p className="text-gray-500 text-xs ml-1 mb-1">
                {isDeposit ? "Conta" : "Conta / Cartão"} <span className="text-red-400">*</span>
              </p>
              <select
                className={`input ${errors.accountId ? "border-red-500" : ""}`}
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Selecione uma conta</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={`acc_${a.id}`}>{a.name}</option>
                ))}
                {!isDeposit && creditCards && creditCards.length > 0 && (
                  <optgroup label="Cartões de Crédito">
                    {creditCards.map((c) => (
                      <option key={c.id} value={`cc_${c.id}`}>💳 {c.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {errors.accountId && (
                <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                  <FiAlertCircle className="h-3 w-3" /> {errors.accountId}
                </p>
              )}
            </label>

            {showInstallment && (
              <label>
                <p className="text-gray-500 text-xs ml-1 mb-1">Número de parcelas</p>
                <select className="input" name="installments" disabled={isLoading}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n === 1 ? "À vista" : `${n}x`}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              <p className="text-gray-500 text-xs ml-1 mb-1">Transação recorrente/fixa?</p>
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="checkbox"
                  name="fixed"
                  id="fixed"
                  disabled={isLoading}
                  onChange={() => setShowInstallment((p) => !p)}
                />
                <label htmlFor="fixed" className="text-gray-400 text-sm cursor-pointer">
                  Sim, é uma transação fixa mensal
                </label>
              </div>
            </label>
          </>
        )}

        {/* ── Campos exclusivos: Transferência ── */}
        {isTransfer && (
          <>
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
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.fromAccountId && (
                <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                  <FiAlertCircle className="h-3 w-3" /> {errors.fromAccountId}
                </p>
              )}
            </label>

            {/* Seta visual */}
            <div className="flex items-center gap-2 -my-1">
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
                style={{ background: "var(--accent-dim)", border: "1px solid var(--border-accent)" }}
              >
                <FiArrowRight className="h-3.5 w-3.5" style={{ color: "var(--accent-light)" }} />
              </div>
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            </div>

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
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.toAccountId && (
                <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                  <FiAlertCircle className="h-3 w-3" /> {errors.toAccountId}
                </p>
              )}
            </label>

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
          </>
        )}

        {/* Toggle já pago/recebido/transferido — hidden for credit card purchases */}
        {isCreditCardSelected && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}>
            Compras no cartão são registradas na fatura. Pague a fatura em Cartões.
          </p>
        )}
        <div
          className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${isCreditCardSelected ? "hidden" : ""}`}
          style={{
            background: markAsPaid
              ? isDeposit
                ? "rgba(34,197,94,0.1)"
                : isTransfer
                ? "rgba(139,92,246,0.1)"
                : "rgba(239,68,68,0.1)"
              : "rgba(255,255,255,0.04)",
            border: markAsPaid
              ? isDeposit
                ? "1px solid rgba(34,197,94,0.3)"
                : isTransfer
                ? "1px solid rgba(139,92,246,0.3)"
                : "1px solid rgba(239,68,68,0.3)"
              : "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          }}
          onClick={() => !isLoading && setMarkAsPaid((p) => !p)}
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary, #f0f4ff)" }}>
              {isDeposit ? "Já recebi este valor" : isTransfer ? "Já foi transferido" : "Já paguei esta conta"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted, #475569)" }}>
              {markAsPaid
                ? isTransfer
                  ? "Saldos das contas serão atualizados agora"
                  : isDeposit
                  ? "Será marcada como recebida ao salvar"
                  : "Será marcada como paga ao salvar"
                : "Marcar como pendente por ora"}
            </p>
          </div>
          <div
            className="w-10 h-5 rounded-full relative transition-all duration-200 shrink-0"
            style={{
              background: markAsPaid
                ? isDeposit
                  ? "var(--green, #22c55e)"
                  : isTransfer
                  ? "var(--accent, #7c3aed)"
                  : "var(--red, #ef4444)"
                : "rgba(255,255,255,0.12)",
            }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
              style={{ left: markAsPaid ? "calc(100% - 18px)" : "2px" }}
            />
          </div>
        </div>

        <button
          className={`button min-h-[45px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${activeColor}`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <FiLoader className="h-4 w-4 animate-spin" />
              {markAsPaid
                ? isTransfer ? "Registrando e confirmando..." : "Salvando e marcando..."
                : "Salvando..."}
            </span>
          ) : isDeposit ? "Adicionar Receita"
            : isTransfer ? "Registrar Transferência"
            : "Adicionar Despesa"}
        </button>
      </form>
    </div>
  );
};
