import { useState, useEffect } from "react";
import { useUser } from "@/app/hooks/useUser";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { FiEdit, FiTrash } from "react-icons/fi";
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
  const [editedTransaction, setEditedTransaction] = useState({
    description: transaction?.description || "",
    amount: transaction?.amount || 0,
    categoryId: transaction?.categoryId || "",
  });

  useEffect(() => {
    if (transaction) {
      setEditedTransaction({
        description: transaction.description || "",
        amount: transaction.amount || 0,
        categoryId: transaction.categoryId || "",
      });
    }
  }, [transaction]);

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((category) => category.id === categoryId);
    return category?.name || "Sem categoria";
  };

  // const handlePay = async () => {
  //   if (!transaction) return;
  //   try {
  //     await payTransaction(transaction.id);
  //     console.log(`Payment toggled for transaction ${transaction.id}`);
  //   } catch (error) {
  //     console.error("Error toggling payment:", error);
  //   }
  // };

  const handleEdit = async () => {
    if (!transaction) return;
    try {
      await editTransaction(transaction.id, {
        ...transaction,
        ...editedTransaction,
      });
      console.log(`Transaction ${transaction.id} updated`);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
  };

  const handleDeleteConfirmed = async (scope: TransactionRemovalScope) => {
    if (!transaction) return;
    try {
      const currentMonth = new Date().getMonth() + 1; // Mês atual (1-12)
      const currentYear = new Date().getFullYear();

      // Chama a função removeTransaction do hook com o escopo e data, se necessário
      const message = await removeTransaction(
        transaction.id,
        scope,
        currentYear,
        currentMonth
      );

      console.log(message);
      setIsConfirmingDelete(false); // Fecha o modal de confirmação
      onClose(); // Fecha o modal de detalhes
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setIsConfirmingDelete(false); // Garante que o modal feche mesmo com erro
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-[#0a0a0aa2] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 text-gray-100 w-[500px] max-w-[95%]">
        <h2 className="text-xl font-semibold mb-4">Detalhes da Transação</h2>
        <div className="space-y-3">
          <p className="">
            <strong>Descrição:</strong>{" "}
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
                className="input bg-gray-700 text-gray-100 rounded p-1 w-full"
              />
            ) : (
              transaction.description || "Sem descrição"
            )}
          </p>
          <p className="">
            <strong>Valor:</strong>{" "}
            {isEditing ? (
              <input
                type="number"
                value={editedTransaction.amount}
                onChange={(e) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    amount: Number(e.target.value),
                  })
                }
                className="input bg-gray-700 text-gray-100 rounded p-1 w-full"
              />
            ) : (
              transaction.amount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            )}
          </p>
          <p className="">
            <strong>Categoria:</strong>{" "}
            {isEditing ? (
              <select
                value={editedTransaction.categoryId}
                onChange={(e) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    categoryId: e.target.value,
                  })
                }
                className="input bg-gray-700 text-gray-100 rounded p-1 w-full"
              >
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              getCategoryName(transaction.categoryId)
            )}
          </p>
          <p className="">
            <strong>Tipo:</strong>{" "}
            {transaction.type === TransactionTypes.DEPOSIT
              ? "Depósito"
              : "Saque"}
          </p>
          <p className="">
            <strong>Tipo de Transação:</strong>{" "}
            {transaction.kind === TransactionKind.SIMPLE
              ? "Simples"
              : transaction.kind === TransactionKind.INSTALLMENT
              ? `Parcelada (${transaction.paymentHistory.length} de ${transaction.recurrence.installmentsCount})`
              : "Fixa"}
          </p>
          <p className="">
            <strong>Data de Vencimento:</strong>{" "}
            {format(transaction.dueDate, "dd/MM/yyyy", { locale: ptBR })}
          </p>
          {/* <p>
            <strong>Status de Pagamento:</strong>{" "}
            {payment?.isPaid ? (
              <span className="text-green-500">Pago em {format(payment.paidAt!, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            ) : (
              <span className="text-red-500">Não pago</span>
            )}
          </p> */}
          {/* {transaction.paymentHistory && (
            <div>
              <strong>Histórico de Pagamentos:</strong>
              <ul className="list-disc list-inside">
                {transaction.paymentHistory.map((payment, index) => (
                  <li key={index}>
                    {format(payment.dueDate, "MM/yyyy", { locale: ptBR })} -{" "}
                    {payment.isPaid
                      ? `Pago em ${format(payment.paidAt!, "dd/MM/yyyy HH:mm", { locale: ptBR })}`
                      : "Não pago"} -{" "}
                    {payment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </li>
                ))}
              </ul>
            </div>
          )} */}
        </div>
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            {/* <button
              onClick={handlePay}
              className={`p-2 rounded-full ${payment?.isPaid ? "bg-red-500" : "bg-green-500"} text-white disabled:opacity-50`}
              disabled={paymentIndex === -1 && transaction.kind !== TransactionKind.FIXED}
            >
              {payment?.isPaid ? <FiX size={20} /> : <FiCheck size={20} />}
            </button> */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors duration-200 text-white flex items-center justify-center cursor-pointer"
            >
              <FiEdit />
            </button>
            <button
              onClick={handleDeleteClick} // <--- AQUI!
              className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 transition-colors duration-200 text-white flex items-center justify-center cursor-pointer"
            >
              <FiTrash />
            </button>
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Salvar
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 transition-colors duration-200 text-white rounded-lg cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {isConfirmingDelete && (
          <div className="fixed inset-0 bg-[#0a0a0a] bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 text-gray-100 w-full max-w-md border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {/* <FiX size={24} /> */}X
                </button>
              </div>

              <p className="mb-6 text-gray-300">
                {transaction.kind === TransactionKind.SIMPLE
                  ? `Tem certeza que deseja apagar esta transação?`
                  : `Esta é uma transação recorrente. Escolha o escopo da exclusão:`}
              </p>

              <div className="flex flex-col gap-4">
                {transaction.kind !== TransactionKind.SIMPLE && (
                  <>
                    <button
                      onClick={() =>
                        handleDeleteConfirmed(
                          TransactionRemovalScope.CURRENT_MONTH
                        )
                      }
                      className="w-full bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg font-bold transition-colors duration-200"
                    >
                      Apagar apenas esta ocorrência
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteConfirmed(
                          TransactionRemovalScope.FROM_MONTH_ONWARD
                        )
                      }
                      className="w-full bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg font-bold transition-colors duration-200"
                    >
                      Apagar desta ocorrência em diante
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteConfirmed(TransactionRemovalScope.ALL)
                      }
                      className="w-full bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg font-bold transition-colors duration-200"
                    >
                      Apagar todas as ocorrências
                    </button>
                  </>
                )}

                {/* Opção para transações simples */}
                {transaction.kind === TransactionKind.SIMPLE && (
                  <button
                    onClick={() =>
                      handleDeleteConfirmed(TransactionRemovalScope.ALL)
                    }
                    className="w-full bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg font-bold transition-colors duration-200"
                  >
                    Confirmar Exclusão
                  </button>
                )}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="text-gray-400 hover:text-gray-200 underline font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
