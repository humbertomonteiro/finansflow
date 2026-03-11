import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/app/hooks/useUser";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { FiEdit, FiTrash, FiX, FiAlertCircle } from "react-icons/fi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionRemovalScope } from "@/domain/enums/transaction/TransactionRemovalScope";

interface TransactionDetailsProps {
  transaction: ITransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetails = ({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsProps) => {
  const { categories, editTransaction, removeTransaction } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // FIX: resetar estado interno sempre que a transação selecionada mudar
  const [editedTransaction, setEditedTransaction] = useState({
    description: "",
    amount: 0,
    categoryId: "",
  });

  useEffect(() => {
    if (transaction) {
      setEditedTransaction({
        description: transaction.description || "",
        amount: transaction.amount || 0,
        categoryId: transaction.categoryId || "",
      });
      // Limpa estados de UI ao trocar de transação
      setIsEditing(false);
      setIsConfirmingDelete(false);
      setEditError(null);
    }
  }, [transaction?.id]); // FIX: depende do ID, não do objeto inteiro

  const getCategoryName = useCallback(
    (categoryId: string) => {
      const category = categories?.find((c) => c.id === categoryId);
      return category?.name || "Sem categoria";
    },
    [categories],
  );

  const handleEdit = async () => {
    if (!transaction) return;
    if (editedTransaction.amount <= 0) {
      setEditError("O valor deve ser maior que zero.");
      return;
    }
    if (!editedTransaction.description.trim()) {
      setEditError("A descrição não pode ser vazia.");
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await editTransaction(transaction.id, {
        ...transaction,
        ...editedTransaction,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setEditError("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirmed = async (scope: TransactionRemovalScope) => {
    if (!transaction) return;
    try {
      const message = await removeTransaction(transaction.id, scope);
      console.log(message);
      setIsConfirmingDelete(false);
      onClose();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setIsConfirmingDelete(false);
    }
  };

  if (!isOpen || !transaction) return null;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const kindLabel =
    transaction.kind === TransactionKind.SIMPLE
      ? "Simples"
      : transaction.kind === TransactionKind.INSTALLMENT
        ? `Parcelada (${transaction.paymentHistory.length}/${transaction.recurrence.installmentsCount}x)`
        : "Fixa mensal";

  return (
    <div className="fixed inset-0 bg-[#0a0a0aa2] flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-4 text-gray-100 w-[500px] max-w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Detalhes da Transação</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <FiX />
          </button>
        </div>

        {/* Badge de tipo */}
        <div className="flex gap-2 mb-4">
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold ${
              transaction.type === TransactionTypes.DEPOSIT
                ? "bg-green-900/60 text-green-400"
                : "bg-red-900/60 text-red-400"
            }`}
          >
            {transaction.type === TransactionTypes.DEPOSIT
              ? "Receita"
              : "Despesa"}
          </span>
          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-violet-900/60 text-violet-400">
            {kindLabel}
          </span>
        </div>

        {/* Campos */}
        <div className="space-y-2 bg-gray-900 rounded-xl px-4 py-2">
          {/* Descrição */}
          <div className="flex gap-2 items-center py-4 border-b border-b-gray-800 text-gray-300">
            <strong className="shrink-0">Descrição:</strong>
            {isEditing ? (
              <input
                type="text"
                value={editedTransaction.description}
                onChange={(e) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    description: e.target.value,
                  })
                }
                className="input flex-1"
              />
            ) : (
              <span>{transaction.description || "Sem descrição"}</span>
            )}
          </div>

          {/* Valor */}
          <div className="flex gap-2 items-center py-4 border-b border-b-gray-800 text-gray-300">
            <strong className="shrink-0">Valor:</strong>
            {isEditing ? (
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editedTransaction.amount}
                onChange={(e) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    amount: Number(e.target.value),
                  })
                }
                className="input flex-1"
              />
            ) : (
              <span
                className={
                  transaction.type === TransactionTypes.DEPOSIT
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {formatCurrency(transaction.amount)}
              </span>
            )}
          </div>

          {/* Categoria */}
          <div className="flex gap-2 items-center py-4 border-b border-b-gray-800 text-gray-300">
            <strong className="shrink-0">Categoria:</strong>
            {isEditing ? (
              <select
                value={editedTransaction.categoryId}
                onChange={(e) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    categoryId: e.target.value,
                  })
                }
                className="input flex-1"
              >
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getCategoryName(transaction.categoryId)}</span>
            )}
          </div>

          {/* Data de vencimento */}
          <div className="flex gap-2 items-center py-4 border-b border-b-gray-800 text-gray-300">
            <strong className="shrink-0">Vencimento:</strong>
            <span>
              {format(transaction.dueDate, "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>

          {/* Erro de edição */}
          {editError && (
            <div className="flex items-center gap-2 py-2 text-red-400 text-sm">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              {editError}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-between py-4">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditError(null);
                }}
                title="Editar"
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors text-white flex items-center justify-center cursor-pointer"
              >
                <FiEdit />
              </button>
              <button
                onClick={() => setIsConfirmingDelete(true)}
                title="Excluir"
                className="h-10 w-10 rounded-full bg-red-700 hover:bg-red-600 transition-colors text-white flex items-center justify-center cursor-pointer"
              >
                <FiTrash />
              </button>
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <button
                  onClick={handleEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 cursor-pointer transition-all disabled:opacity-50 text-sm"
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 transition-colors text-white rounded-lg cursor-pointer text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-[#0a0a0ad3] flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 text-gray-100 w-full max-w-md border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="h-8 w-8 rounded-full hover:bg-gray-700 flex items-center justify-center cursor-pointer"
              >
                <FiX />
              </button>
            </div>

            <p className="mb-6 text-gray-300">
              {transaction.kind === TransactionKind.SIMPLE
                ? "Tem certeza que deseja apagar esta transação?"
                : "Esta é uma transação recorrente. Escolha o escopo da exclusão:"}
            </p>

            <div className="flex flex-col gap-3">
              {transaction.kind !== TransactionKind.SIMPLE && (
                <>
                  <button
                    onClick={() =>
                      handleDeleteConfirmed(
                        TransactionRemovalScope.CURRENT_MONTH,
                      )
                    }
                    className="w-full bg-violet-700 hover:bg-violet-600 cursor-pointer text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Apagar apenas esta ocorrência
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteConfirmed(
                        TransactionRemovalScope.FROM_MONTH_ONWARD,
                      )
                    }
                    className="w-full bg-gray-700 hover:bg-gray-600 cursor-pointer text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Apagar desta em diante
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  handleDeleteConfirmed(TransactionRemovalScope.ALL)
                }
                className="w-full bg-red-800 hover:bg-red-700 cursor-pointer text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                {transaction.kind === TransactionKind.SIMPLE
                  ? "Confirmar Exclusão"
                  : "Apagar todas as ocorrências"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="text-gray-400 hover:text-gray-200 underline font-semibold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
