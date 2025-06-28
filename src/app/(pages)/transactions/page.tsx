"use client";

import { TransactionList } from "@/app/components/shared/TransactionList";
import { Title } from "@/app/components/shared/Title";
import { useUser } from "@/app/hooks/useUser";

export default function Transactions() {
  const { transactions } = useUser();

  return (
    <div className="flex flex-col gap-6">
      <Title>Transações</Title>

      <div className="bg-gray-950 p-4 rounded-xl">
        {transactions ? (
          <TransactionList transactions={transactions} />
        ) : (
          <p>Não há transações</p>
        )}
      </div>
    </div>
  );
}
