import { useState } from "react";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { useUser } from "@/app/hooks/useUser";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";
import { FiCheck, FiX } from "react-icons/fi";

import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
// import { CiMenuKebab } from "react-icons/ci";
import { TransactionDetails } from "./TransactionDetails";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { PiDotsThreeOutlineVerticalThin } from "react-icons/pi";

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
        className={`flex items-center gap-2 p-3 rounded-xl 
          cursor-pointer border border-gray-800`}
      >
        <div
          onClick={() => setIsOpen(true)}
          className={`w-full text-nowrap overflow-hidden text-ellipsis flex gap-2 md:gap-4 items-center`}
        >
          <div className={`flex flex-col items-center`}>
            <div
              className={`rounded-full text-gray-200 w-fit p-1 ${
                transaction.type === TransactionTypes.DEPOSIT
                  ? "bg-green-700"
                  : "bg-red-700"
              }`}
            >
              {transaction.type === TransactionTypes.DEPOSIT ? (
                <IoMdArrowUp className="h-5 w-5" />
              ) : (
                <IoMdArrowDown className="h-5 w-5" />
              )}
            </div>
            <p className={`text-[0.7rem] block text-gray-500`}>
              {transaction.type === TransactionTypes.DEPOSIT
                ? "Receita"
                : "Despesa"}
            </p>
          </div>

          <div>
            {transaction && (
              <p className={`text-base md:text-lg text-gray-300`}>
                {transaction.description}
              </p>
            )}
            <div className="flex gap-1">
              <p
                className={`text-[0.7rem] bg-gray-800 px-2 text-gray-400 rounded-full mt-[0.2rem]`}
              >
                {getCategoryName(transaction.categoryId)}
              </p>
              <p className="text-xs block text-gray-500">
                {transaction.kind === TransactionKind.FIXED && (
                  <span>(Fixo)</span>
                )}
                {transaction.kind === TransactionKind.INSTALLMENT && (
                  <span>
                    {transaction.installmentsNumber} de{" "}
                    {transaction.recurrence.installmentsCount}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setIsOpen(true)}
          className="w-[250px] text-right mr-2 text-gray-300 text-base md:text-lg"
        >
          {transaction.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </div>

        <div className="flex flex-col items-center justify-center">
          <button
            onClick={() => {
              if (index === -1 && transaction.kind !== TransactionKind.FIXED) {
                return;
              }
              payTransaction(transaction.id);
            }}
            className={`cursor-pointer p-1 opacity-90 hover:opacity-100 transition-opacity 
              duration-200 rounded-full text-gray-200 
              ${payment?.isPaid ? "bg-violet-700" : "bg-gray-500"}`}
            disabled={
              index === -1 && transaction.kind !== TransactionKind.FIXED
            }
          >
            {payment?.isPaid ? (
              <FiCheck className="h-5 w-5" />
            ) : (
              <FiX className="h-5 w-5" />
            )}
          </button>
          <span className="text-gray-500 text-[0.7rem]">
            {" "}
            {payment?.isPaid ? "Resolvido" : "Resolver"}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <button
            onClick={() => setIsOpen(true)}
            className="cursor-pointer p-1 rounded-full opacity-90 hover:bg-violet-700 transition-opacity duration-200"
          >
            <PiDotsThreeOutlineVerticalThin className="h-5 w-5" />
          </button>
          <span className="text-gray-500 text-[0.7rem]">Menu</span>
        </div>
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
