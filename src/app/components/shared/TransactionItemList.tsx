import { useState } from "react";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { useUser } from "@/app/hooks/useUser";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { FiCheck, FiX } from "react-icons/fi";
import { CiMenuKebab } from "react-icons/ci";
import { TransactionDetails } from "./TransactionDetails";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";

interface TransactionItemListProps {
  transaction: (ITransaction & { installmentsNumber: number }) | null;
  index: number;
}

export const TransactionItemList = ({
  transaction,
  index = -1,
}: TransactionItemListProps) => {
  const { categories, payTransaction } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((category) => category.id === categoryId);
    return category?.name || "Sem categoria";
  };

  if (!transaction) return null;

  const payment = transaction.paymentHistory[index];

  return (
    <>
      <li
        key={transaction.id}
        className={`flex items-center gap-2 p-3 bg-gray-900 rounded-xl ${
          transaction.type === TransactionTypes.DEPOSIT
            ? "border-l-4 border-green-500"
            : "border-l-4 border-red-500"
        }`}
      >
        <div className="w-full text-nowrap overflow-hidden text-ellipsis">
          <div>
            {transaction && <p>{transaction.description}</p>}
            <div className="flex gap-1">
              <p className="text-xs block text-gray-400">
                {getCategoryName(transaction.categoryId)}
              </p>
              <p className="text-xs block text-gray-500">
                {transaction.kind === TransactionKind.FIXED && (
                  <span>(Fixo)</span>
                )}
                {transaction.kind === TransactionKind.INSTALLMENT && (
                  <span>
                    Parcela {transaction.installmentsNumber} de{" "}
                    {transaction.recurrence.installmentsCount}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="w-[250px] text-right mr-2">
          {transaction.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </div>
        <button
          onClick={() => {
            if (index === -1 && transaction.kind !== TransactionKind.FIXED) {
              return;
            }
            payTransaction(transaction.id);
          }}
          className={`cursor-pointer p-1 opacity-90 hover:opacity-100 transition-opacity duration-200 z-10 rounded-full ${
            payment?.isPaid ? "bg-green-500" : "bg-red-500"
          }`}
          disabled={index === -1 && transaction.kind !== TransactionKind.FIXED}
        >
          {payment?.isPaid ? <FiCheck /> : <FiX />}
        </button>
        <button
          onClick={() => setIsOpen(true)}
          className="cursor-pointer p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity duration-200 z-10 bg-gray-500"
        >
          <CiMenuKebab />
        </button>
      </li>
      {isOpen && (
        <TransactionDetails
          transaction={transaction}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
    </>
  );
};
