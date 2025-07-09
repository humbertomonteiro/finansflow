"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/app/hooks/useUser";
import { Title } from "@/app/components/shared/Title";
import { CategoryExpensesSummary } from "@/app/components/shared/CategoryExpensesSummary";
import { CategoryExpensesChart } from "@/app/components/shared/CategoryExpensesChart";
import { ExpensesOverview } from "@/app/components/shared/ExpensesOverview";
import { LineChart } from "@/app/components/shared/LineChart";

export default function Performance() {
  const { loading, dataCategoryExpenses, monthlyMetrics, metrics, user } =
    useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const calculateExpensePercentage = () => {
    if (!metrics || metrics.revenues === 0) {
      return { value: null, display: "Nenhuma receita registrada" };
    }
    if (metrics.expenses === 0) {
      return { value: 0, display: "0%" };
    }
    const percentage = (metrics.expenses / metrics.revenues) * 100;
    return { value: percentage, display: `${percentage.toFixed(1)}%` };
  };

  const getExpenseStatus = () => {
    const percentage = calculateExpensePercentage();
    if (!percentage.value) {
      return {
        message:
          "Você ainda não registrou receitas este mês. Adicione suas receitas para acompanhar seu orçamento!",
        color: "text-yellow-500",
        action: (
          <Link
            href="/transactions"
            className="underline hover:text-blue-500"
            aria-label="Adicionar nova receita"
          >
            Adicionar Receita
          </Link>
        ),
      };
    }
    if (percentage.value === 0) {
      return {
        message:
          "Você não registrou despesas este mês. Isso pode indicar que seus gastos ainda não foram cadastrados.",
        color: "text-yellow-500",
        action: (
          <Link
            href="/transactions/add"
            className="underline hover:text-blue-500"
            aria-label="Adicionar nova despesa"
          >
            Adicionar Despesa
          </Link>
        ),
      };
    }
    if (percentage.value < 50) {
      return {
        message:
          "Suas despesas estão bem controladas, representando menos de 50% das suas receitas. Continue assim para manter uma boa sobra financeira!",
        color: "text-green-500",
        action: (
          <Link
            href="/performance"
            className="underline hover:text-blue-500"
            aria-label="Ver detalhes do orçamento"
          >
            Ver Detalhes
          </Link>
        ),
      };
    }
    if (percentage.value <= 80) {
      return {
        message:
          "Suas despesas estão em um nível moderado, entre 50% e 80% das suas receitas. Considere revisar categorias de gastos para aumentar sua sobra.",
        color: "text-yellow-500",
        action: (
          <Link
            href="/performance"
            className="underline hover:text-blue-500"
            aria-label="Analisar categorias de gastos"
          >
            Analisar Gastos
          </Link>
        ),
      };
    }
    return {
      message:
        "Atenção: Suas despesas estão altas, consumindo mais de 80% das suas receitas. Reveja seus gastos para evitar problemas financeiros.",
      color: "text-red-500",
      action: (
        <Link
          href="/transactions"
          className="underline hover:text-blue-500"
          aria-label="Revisar despesas"
        >
          Revisar Despesas
        </Link>
      ),
    };
  };

  const getBalanceStatus = () => {
    if (!metrics) {
      return {
        message:
          "Nenhum dado de balanço disponível. Registre suas transações para começar!",
        color: "text-yellow-500",
      };
    }
    if (metrics.futureBalance > 0) {
      return {
        message:
          "Seu balanço está positivo! Isso significa que você tem uma sobra financeira para poupar ou investir.",
        color: "text-green-500",
      };
    }
    if (metrics.futureBalance === 0) {
      return {
        message:
          "Seu balanço está zerado. Você gastou exatamente o que recebeu. Tente reduzir despesas para criar uma sobra.",
        color: "text-yellow-500",
      };
    }
    return {
      message:
        "Seu balanço está negativo, indicando que você gastou mais do que recebeu. Considere cortar gastos ou aumentar suas receitas.",
      color: "text-red-500",
    };
  };

  // Identificar a categoria com maior gasto (se disponível)
  const highestCategory = dataCategoryExpenses?.expenses.reduce(
    (max, expense) => (expense.percentage > max.percentage ? expense : max),
    { categoryName: "", amount: 0, percentage: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={true}>Performance</Title>
      <h3 className="text-gray-200 text-xl px-2">
        Entenda seus gastos mensais e organize seu orçamento!
      </h3>
      <div
        className="px-2 max-w-[800px]p-6 rounded-2xl"
        aria-label="Resumo das métricas financeiras do mês"
      >
        <div className="space-y-4">
          {/* Receitas */}
          <p className="text-sm text-gray-400 leading-6">
            <strong className="text-green-500 text-base">
              Receitas: {metrics ? formatCurrency(metrics.revenues) : "R$ 0,00"}
            </strong>
            <br />
            Este é o total de dinheiro que você recebeu este mês, como salário,
            rendimentos ou outras fontes de renda. Quanto maior suas receitas,
            mais espaço você tem para planejar seus gastos e investimentos.
          </p>

          {/* Despesas */}
          <p className="text-sm text-gray-400 leading-6">
            <strong className="text-red-500 text-base">
              Despesas: {metrics ? formatCurrency(metrics.expenses) : "R$ 0,00"}
            </strong>
            <br />
            Este valor representa tudo o que você gastou no mês, incluindo
            contas, compras e outros gastos. Controlar suas despesas é essencial
            para manter seu orçamento saudável.
            {highestCategory && highestCategory.percentage > 0 && (
              <span>
                {" "}
                Sua maior categoria de gastos foi{" "}
                <strong>{highestCategory.categoryName}</strong>, representando{" "}
                {highestCategory.percentage.toFixed(1)}% das suas despesas.
              </span>
            )}
          </p>

          {/* Balanço */}
          <p className="text-sm text-gray-400 leading-6">
            <strong
              className={`text-base ${
                metrics && metrics?.futureBalance > 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              Balanço:{" "}
              {metrics ? formatCurrency(metrics.futureBalance) : "R$ 0,00"}
            </strong>
            <br />O balanço é a diferença entre suas receitas e despesas (
            {metrics
              ? `${formatCurrency(metrics.revenues)} - ${formatCurrency(
                  metrics.expenses
                )}`
              : "R$ 0,00"}
            ).
            <span className={getBalanceStatus().color}>
              {" "}
              {getBalanceStatus().message}
            </span>
          </p>

          {/* Porcentagem de Despesas */}
          <p className="text-sm text-gray-400 leading-6">
            <strong className={`text-base ${getExpenseStatus().color}`}>
              Despesas em relação às receitas:{" "}
              {calculateExpensePercentage().display}
            </strong>
            <br />
            Este número mostra a proporção das suas despesas em relação às suas
            receitas. Por exemplo, 50% significa que você gastou metade do que
            recebeu.
            <span className={getExpenseStatus().color}>
              {" "}
              {getExpenseStatus().message}
            </span>{" "}
            {getExpenseStatus().action}
          </p>
        </div>
      </div>
      {loading && <p className="text-gray-400">Carregando...</p>}
      {dataCategoryExpenses && dataCategoryExpenses.expenses.length > 0 ? (
        <div className="space-y-2">
          <div className="px-2">
            <div>
              <h4 className="text-lg text-gray-300 mb-2">
                Resumo de Gastos por Categoria
              </h4>
              <p className="text-sm text-gray-400 leading-6">
                Este resumo mostra como seu dinheiro está distribuído em
                categorias como Alimentação, Moradia e Lazer.
              </p>
            </div>
          </div>
          <CategoryExpensesSummary
            dataCategoryExpenses={dataCategoryExpenses}
          />
        </div>
      ) : (
        <div className="bg-gray-900 p-4 rounded-2xl text-center">
          <p className="text-gray-400 text-sm mb-4">
            Nenhuma despesa registrada para este mês.
          </p>
        </div>
      )}
      <div className="flex gap-6 flex-col md:flex-row items-center ">
        <div
          className={`w-full ${
            dataCategoryExpenses && dataCategoryExpenses.expenses.length > 0
              ? "md:w-[50%]"
              : "w-full"
          }`}
        >
          <ExpensesOverview />
        </div>
        {dataCategoryExpenses && dataCategoryExpenses.expenses.length > 0 && (
          <div className="w-full md:w-[50%] max-h-[400px] h-[350px]">
            <CategoryExpensesChart
              dataCategoryExpenses={dataCategoryExpenses}
            />
          </div>
        )}
      </div>
      {monthlyMetrics && monthlyMetrics.labels.length > 0 && (
        <div className="bg-gray-900 rounded-xl py-4 border border-gray-800 p-4 h-[400px]">
          <LineChart data={monthlyMetrics} />
        </div>
      )}
    </div>
  );
}
