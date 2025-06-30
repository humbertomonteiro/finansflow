"use client";

import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { IRecurrence } from "@/domain/interfaces/transaction/IRecurrence";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { createTransactionController } from "@/controllers/transaction/CreateTransactionController";
import { FiX } from "react-icons/fi";

export const FormAddTransaction = ({ onClose }: { onClose: () => void }) => {
  // Pegue a função `addTransaction` do seu hook `useUser`
  const { categories, accounts, addTransaction } = useUser();

  const [showInstallment, setShowInstallment] = useState(true);
  const [type, setType] = useState<TransactionTypes>(TransactionTypes.DEPOSIT);

  const toggleInstallmentVisibility = () => setShowInstallment((prev) => !prev);

  const handleTypeChange = (selectedType: TransactionTypes) =>
    setType(selectedType);

  const getTransactionKindAndRecurrence = (
    isFixed: boolean,
    installments: number
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

    const formData = new FormData(e.currentTarget);
    const description = String(formData.get("description") || "");
    const amount = Number(formData.get("amount") || 0);
    const dueDate = new Date(String(formData.get("dueDate") || ""));
    const categoryId = String(formData.get("categoryId") || "");
    const accountId = String(formData.get("accountId") || "");
    const isFixed = formData.get("fixed") === "on";
    const installments = Number(formData.get("installments") || 1);

    const { kind, recurrence } = getTransactionKindAndRecurrence(
      isFixed,
      installments
    );

    const dueDateString = dueDate.toISOString().split("T")[0];
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
      // 1. Crie a transação no banco de dados e aguarde o retorno da transação completa
      const createdTransaction = await createTransactionController(
        newTransaction
      );

      // 2. Se a transação foi criada com sucesso, atualize o estado no contexto
      //    sem fazer uma nova requisição ao banco.
      if (createdTransaction) {
        addTransaction(createdTransaction);
      }

      // 3. Feche o formulário após o sucesso
      onClose();
    } catch (error) {
      console.error(error);
      // Aqui você pode adicionar uma notificação de erro para o usuário
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 py-6 px-4 overflow-y-auto max-w-[500px] 
          mx-auto bg-gray-800 rounded-xl fixed top-[48px] bottom-[60px] left-0 right-0 z-30 
          md:left-auto md:top-0 md:bottom-0 md:border md:border-gray-700 md:w-[500px] 
          md:h-auto md:rounded-none md:shadow-none`}
    >
      {/* Type Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-center text-gray-100">
          Adicionar Transação
        </h2>
        <button
          className="px-2 py-1 rounded-lg cursor-pointer text-gray-100 hover:bg-gray-400 hover:text-gray-950 transition-all"
          onClick={onClose}
        >
          <FiX className="h-7 w-7" />
        </button>
      </div>
      <div className="flex items-center justify-around gap-4 mb-2">
        {Object.values(TransactionTypes).map((transactionType) => (
          <button
            key={transactionType}
            className={`button w-full text-gray-100 ${
              type === transactionType
                ? transactionType === TransactionTypes.DEPOSIT
                  ? "bg-green-600"
                  : "bg-red-600"
                : "bg-gray-600"
            }`}
            onClick={() => handleTypeChange(transactionType)}
          >
            {transactionType === TransactionTypes.DEPOSIT
              ? "Receita"
              : "Despesa"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form className="flex flex-col gap-1" onSubmit={handleSubmit}>
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Descrição da transação
          </p>
          <input
            className="input"
            type="text"
            placeholder="Descreva sua transação"
            name="description"
          />
        </label>
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">Valor da transação</p>
          <input
            className="input"
            type="text"
            placeholder="Digite o valor"
            name="amount"
          />
        </label>

        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Data de vencimento da transação
          </p>
          <input
            className="input"
            type="date"
            placeholder="Data de vencimento"
            name="dueDate"
          />
        </label>

        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Categoria da transação
          </p>
          <select className="input" name="categoryId">
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">Escolha a conta</p>
          <select className="input" name="accountId">
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        {/* Installments Selector */}
        {showInstallment && (
          <label>
            <p className="text-gray-500 text-xs ml-1 mb-1">
              Escolha a quantidade de parcelas
            </p>

            <select className="input" name="installments">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Fixed Transaction Checkbox */}
        <label>
          <p className="text-gray-500 text-xs ml-1 mb-1">
            Selecione se for uma transação fixa
          </p>
          <div className="flex items-center gap-2 mb-2 ml-2">
            <input
              type="checkbox"
              name="fixed"
              id="fixed"
              onChange={toggleInstallmentVisibility}
            />
            <label htmlFor="fixed">Fixa</label>
          </div>
        </label>

        <button
          className={`button text-gray-100 ${
            type === TransactionTypes.DEPOSIT ? "bg-green-600" : "bg-red-600"
          }`}
          type="submit"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
};
