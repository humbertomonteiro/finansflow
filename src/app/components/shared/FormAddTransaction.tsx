"use client";

import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { IRecurrence } from "@/domain/interfaces/transaction/IRecurrence";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { createTransactionController } from "@/controllers/transaction/CreateTransactionController";
import { FiX, FiCheck, FiAlertCircle, FiLoader } from "react-icons/fi";

interface FormErrors {
  description?: string;
  amount?: string;
  dueDate?: string;
  categoryId?: string;
  accountId?: string;
}

export const FormAddTransaction = ({ onClose }: { onClose: () => void }) => {
  const { categories, accounts, addTransaction } = useUser();

  const [showInstallment, setShowInstallment] = useState(true);
  const [type, setType] = useState<TransactionTypes>(TransactionTypes.DEPOSIT);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleInstallmentVisibility = () => setShowInstallment((prev) => !prev);
  const handleTypeChange = (selectedType: TransactionTypes) => {
    setType(selectedType);
    setErrors({});
  };

  const validateForm = (data: {
    description: string;
    amount: number;
    dueDate: string;
    categoryId: string;
    accountId: string;
  }): FormErrors => {
    const newErrors: FormErrors = {};

    if (!data.description.trim()) {
      newErrors.description = "Descrição é obrigatória";
    } else if (data.description.trim().length < 3) {
      newErrors.description = "Descrição deve ter ao menos 3 caracteres";
    }

    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
      newErrors.amount = "Informe um valor válido maior que zero";
    }

    if (!data.dueDate) {
      newErrors.dueDate = "Data de vencimento é obrigatória";
    }

    if (!data.categoryId) {
      newErrors.categoryId = "Selecione uma categoria";
    }

    if (!data.accountId) {
      newErrors.accountId = "Selecione uma conta";
    }

    return newErrors;
  };

  const getTransactionKindAndRecurrence = (
    isFixed: boolean,
    installments: number,
  ): { kind: TransactionKind; recurrence: IRecurrence } => {
    if (isFixed) {
      return { kind: TransactionKind.FIXED, recurrence: {} };
    }
    if (!isFixed && showInstallment && installments > 1) {
      return {
        kind: TransactionKind.INSTALLMENT,
        recurrence: { installmentsCount: installments },
      };
    }
    return { kind: TransactionKind.SIMPLE, recurrence: {} };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const description = String(formData.get("description") || "").trim();
    const rawAmount = String(formData.get("amount") || "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const amount = Number(rawAmount);
    const dueDate = String(formData.get("dueDate") || "");
    const categoryId = String(formData.get("categoryId") || "");
    const accountId = String(formData.get("accountId") || "");
    const isFixed = formData.get("fixed") === "on";
    const installments = Number(formData.get("installments") || 1);

    const validationErrors = validateForm({
      description,
      amount,
      dueDate,
      categoryId,
      accountId,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const { kind, recurrence } = getTransactionKindAndRecurrence(
      isFixed,
      installments,
    );

    const dueDateString = new Date(dueDate).toISOString().split("T")[0];
    const [year, month, day] = dueDateString.split("-").map(Number);

    const newTransaction: Omit<ITransaction, "id" | "paymentHistory"> = {
      type,
      amount,
      dueDate: new Date(year, month - 1, day),
      categoryId,
      accountId,
      description,
      recurrence,
      kind,
    };

    try {
      const createdTransaction =
        await createTransactionController(newTransaction);

      if (createdTransaction) {
        addTransaction(createdTransaction);
      }

      setSuccessMessage(
        `${type === TransactionTypes.DEPOSIT ? "Receita" : "Despesa"} adicionada com sucesso!`,
      );

      // Fecha após breve delay para o usuário ver o feedback
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Ocorreu um erro ao adicionar a transação. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isDeposit = type === TransactionTypes.DEPOSIT;
  const activeColor = isDeposit ? "bg-green-400" : "bg-red-400";

  return (
    <div
      className={`flex flex-col gap-2 py-6 px-2 overflow-y-auto max-w-[500px] 
          mx-auto bg-gray-900 rounded-xl fixed top-[48px] bottom-[60px] left-0 right-0 z-30 
          md:left-auto md:top-0 md:bottom-0 md:border md:border-gray-700 md:w-[500px] 
          md:h-auto md:rounded-none md:shadow-none`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <h2 className="text-2xl font-bold text-center text-gray-100">
          Adicionar Transação
        </h2>
        <button
          className="px-2 py-1 rounded-lg cursor-pointer text-gray-400 hover:bg-violet-800 transition-all"
          onClick={onClose}
          disabled={isLoading}
        >
          <FiX className="h-7 w-7" />
        </button>
      </div>

      {/* Feedback de sucesso */}
      {successMessage && (
        <div className="mx-2 flex items-center gap-2 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-400 text-sm">
          <FiCheck className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Feedback de erro global */}
      {errorMessage && (
        <div className="mx-2 flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Seletor Receita/Despesa */}
      <div className="flex items-center justify-around gap-4 mb-2 px-2">
        {Object.values(TransactionTypes).map((transactionType) => (
          <button
            key={transactionType}
            type="button"
            disabled={isLoading}
            className={`button w-full font-semibold transition-all ${
              type === transactionType
                ? transactionType === TransactionTypes.DEPOSIT
                  ? "bg-green-400 text-gray-900"
                  : "bg-red-400 text-gray-900"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
            onClick={() => handleTypeChange(transactionType)}
          >
            {transactionType === TransactionTypes.DEPOSIT
              ? "Receita"
              : "Despesa"}
          </button>
        ))}
      </div>

      {/* Formulário */}
      <form
        className="flex flex-col gap-4 overflow-x-hidden px-2 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Descrição */}
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

        {/* Valor */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Valor <span className="text-red-400">*</span>
          </p>
          <input
            className={`input ${errors.amount ? "border-red-500 focus:border-red-400" : ""}`}
            type="text"
            placeholder="Ex: 1500,00"
            name="amount"
            disabled={isLoading}
          />
          {errors.amount && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.amount}
            </p>
          )}
        </label>

        {/* Data de vencimento */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Data de vencimento <span className="text-red-400">*</span>
          </p>
          <input
            className={`input max-w-[100%] ${errors.dueDate ? "border-red-500" : ""}`}
            type="date"
            name="dueDate"
            disabled={isLoading}
          />
          {errors.dueDate && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.dueDate}
            </p>
          )}
        </label>

        {/* Categoria */}
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
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.categoryId}
            </p>
          )}
        </label>

        {/* Conta */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Conta <span className="text-red-400">*</span>
          </p>
          <select
            className={`input ${errors.accountId ? "border-red-500" : ""}`}
            name="accountId"
            disabled={isLoading}
          >
            <option value="">Selecione uma conta</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3" /> {errors.accountId}
            </p>
          )}
        </label>

        {/* Parcelas */}
        {showInstallment && (
          <label>
            <p className="text-gray-500 text-xs ml-1 mb-1">
              Número de parcelas
            </p>
            <select className="input" name="installments" disabled={isLoading}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num === 1 ? "À vista" : `${num}x`}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Transação fixa */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Transação recorrente/fixa?
          </p>
          <div className="flex items-center gap-2 mb-2 ml-2">
            <input
              type="checkbox"
              name="fixed"
              id="fixed"
              disabled={isLoading}
              onChange={toggleInstallmentVisibility}
            />
            <label
              htmlFor="fixed"
              className="text-gray-400 text-sm cursor-pointer"
            >
              Sim, é uma transação fixa mensal
            </label>
          </div>
        </label>

        {/* Botão de submit */}
        <button
          className={`button min-h-[45px] font-semibold text-gray-900 ${activeColor} disabled:opacity-50 disabled:cursor-not-allowed`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <FiLoader className="h-4 w-4 animate-spin" />
              Salvando...
            </span>
          ) : (
            `Adicionar ${isDeposit ? "Receita" : "Despesa"}`
          )}
        </button>
      </form>
    </div>
  );
};
