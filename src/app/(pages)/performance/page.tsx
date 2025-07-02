"use client";

import { useUser } from "@/app/hooks/useUser";
import { Title } from "../../components/shared/Title";
import { CategoryExpensesSummary } from "@/app/components/shared/CategoryExpensesSummary";
import { CategoryExpensesChart } from "@/app/components/shared/CategoryExpensesChart";
import { ExpensesOverview } from "@/app/components/shared/ExpensesOverview";
import { LineChart } from "@/app/components/shared/LineChart";

export default function Performance() {
  const { loading, dataCategoryExpenses, monthlyMetrics } = useUser();
  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={false}>Performance</Title>
      {loading || !dataCategoryExpenses ? (
        <p className="text-gray-400">Carregando...</p>
      ) : (
        <div className="">
          <h3 className="text-gray-300 text-lg mb-2 ml-1">
            Resumo de Gastos por Categoria
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div className="col-span-1">
              <CategoryExpensesSummary
                dataCategoryExpenses={dataCategoryExpenses}
              />
            </div>
            <div className="col-span-1">
              <CategoryExpensesChart
                dataCategoryExpenses={dataCategoryExpenses}
              />
            </div>
          </div>
        </div>
      )}
      <ExpensesOverview />
      {monthlyMetrics && monthlyMetrics.labels.length > 0 && (
        <div className="bg-gray-900 rounded-xl py-4 border border-gray-800 p-4 h-[400px]">
          <LineChart data={monthlyMetrics} />
        </div>
      )}
    </div>
  );
}
