"use client";

import { useUser } from "@/app/hooks/useUser";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionItemList } from "./TransactionItemList";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";

interface TransactionsListProps {
  transactions: ITransaction[];
}

export const TransactionList = ({ transactions }: TransactionsListProps) => {
  const { year, month } = useUser();

  // Agrupar transações por dia
  const groupTransactionsByDay = () => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const grouped: { date: Date; transactions: typeof transactions }[] = [];
    let currentGroup: { date: Date; transactions: typeof transactions } | null =
      null;

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.dueDate);

      if (!currentGroup || !isSameDay(currentGroup.date, transactionDate)) {
        currentGroup = { date: transactionDate, transactions: [] };
        grouped.push(currentGroup);
      }

      currentGroup.transactions.push(transaction);
    });

    return grouped;
  };

  const indexPaymentHistory = (transaction: ITransaction) => {
    const index = transaction.paymentHistory.findIndex(
      (payment) =>
        payment.dueDate.getFullYear() === year &&
        payment.dueDate.getMonth() + 1 === month
    );
    return index;
  };

  const groupedTransactions = groupTransactionsByDay();

  return (
    <div>
      {groupedTransactions.length === 0 && (
        <div className="text-gray-100">Não há transações</div>
      )}
      <div className="flex flex-col gap-6">
        {groupedTransactions.map((group) => (
          <div key={format(group.date, "yyyy-MM-dd")}>
            <h3 className="text-gray-400 mb-2 ml-1">
              {format(group.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <ul className="flex flex-col gap-4">
              {group.transactions.map((transaction) => (
                <TransactionItemList
                  key={transaction.id}
                  transaction={
                    transaction as ITransaction & { installmentsNumber: number }
                  }
                  index={indexPaymentHistory(transaction)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
