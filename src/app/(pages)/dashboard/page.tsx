"use client";

import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { useUser } from "@/app/hooks/useUser";
import Card from "@/app/components/shared/Card";
import { Title } from "@/app/components/shared/Title";
import { TransactionList } from "@/app/components/shared/TransactionList";
import { LineChart } from "@/app/components/shared/LineChart";

export default function Dashboard() {
  const {
    metrics,
    accumulatedFutureBalance,
    currentBalance,
    loading,
    nearbyTransactions,
    overdueTransactions,
    unpaidTransactions,
    monthlyMetrics,
  } = useUser();

  return (
    <div className="">
      <div className="flex flex-col gap-6">
        <Title>Dashboard</Title>

        <div className="grid grid-cols-2">
          {metrics && !loading ? (
            <>
              <div className="col-span-2 gap-2 grid grid-cols-2 lg:grid-cols-3 mb-2">
                <div className="col-span-2 lg:col-span-1">
                  <Card
                    value={
                      currentBalance?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }) || "$0.00"
                    }
                    title="Saldo"
                    icon={<RiMoneyDollarCircleLine className="h-6 w-6" />}
                    color="bg-green-600"
                    bg="bg-violet-900"
                  />
                </div>
                <div>
                  <Card
                    value={
                      metrics.revenues?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }) || "$0.00"
                    }
                    title="Receitas"
                    icon={<RiMoneyDollarCircleLine className="h-6 w-6" />}
                    color="bg-green-500"
                  />
                </div>
                <div>
                  <Card
                    value={
                      metrics.expenses?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }) || "$0.00"
                    }
                    title="Despesas"
                    icon={<RiMoneyDollarCircleLine className="h-6 w-6" />}
                    color="bg-red-500"
                  />
                </div>
              </div>
              <div className="col-span-3 grid grid-cols-2 lg:grid-cols-2 gap-2">
                <Card
                  value={
                    metrics.futureBalance?.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }) || "$0.00"
                  }
                  title="Balanço"
                  icon={<RiMoneyDollarCircleLine className="h-6 w-6" />}
                  color="bg-violet-500"
                />

                <Card
                  value={
                    accumulatedFutureBalance.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }) || "$0.00"
                  }
                  title="Projeção"
                  icon={<RiMoneyDollarCircleLine className="h-6 w-6" />}
                  color="bg-violet-500"
                />
              </div>
            </>
          ) : (
            <p>Carregando...</p>
          )}
        </div>

        {monthlyMetrics && monthlyMetrics.labels.length > 0 && (
          <div className="bg-gray-900 rounded-xl py-4 border border-gray-800 p-6 h-[400px] mb-6">
            <h2 className="text-gray-300 text-lg mb-4 px-2">Balanço Anual</h2>
            <LineChart data={monthlyMetrics} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {nearbyTransactions && nearbyTransactions.length > 0 && (
            <div className="bg-gray-950 rounded-xl py-4 border border-gray-800">
              <div className="px-4 max-w-[100%] flex-1 max-h-[400px] overflow-y-auto">
                <h2 className="text-gray-300 text-lg mb-4">
                  Próximas transações
                </h2>
                <TransactionList transactions={nearbyTransactions} />
              </div>
            </div>
          )}

          {overdueTransactions && overdueTransactions.length > 0 && (
            <div className="bg-gray-950 rounded-xl py-4 border border-gray-800">
              <div className="px-4 max-w-[100%] flex-1  max-h-[400px] overflow-y-auto">
                <h2 className="text-gray-300 text-lg mb-4">
                  Transações Atrasadas
                </h2>
                <TransactionList transactions={overdueTransactions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
