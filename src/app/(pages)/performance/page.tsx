"use client";

import { useUser } from "@/app/hooks/useUser";
import { Title } from "../../components/shared/Title";
import { CategoryExpensesSummary } from "@/app/components/shared/CategoryExpensesSummary";
import { CategoryExpensesChart } from "@/app/components/shared/CategoryExpensesChart";

export default function Performance() {
  const { loading, dataCategoryExpenses } = useUser();
  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={false}>Performance</Title>
      {loading || !dataCategoryExpenses ? (
        <p className="text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
          <h3 className="text-gray-400 text-lg mb-2">Despesas por categoria</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="col-span-1 lg:col-span-2">
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
    </div>
  );
}
