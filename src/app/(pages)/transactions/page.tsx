"use client";

import { TransactionList } from "@/app/components/shared/TransactionList";
import { Title } from "@/app/components/shared/Title";
import { useUser } from "@/app/hooks/useUser";
import { useState, useEffect } from "react";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";

import { CiSearch } from "react-icons/ci";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { LiaBalanceScaleLeftSolid } from "react-icons/lia";
import { GoGraph } from "react-icons/go";

type FilterProps = "all" | "revenues" | "expenses" | "paid" | "unpaid";

const styleFilter = `rounded-full bg-gray-900 text-xs py-3 px-4 flex items-center text-nowrap 
  cursor-pointer hover:bg-violet-900 hover:text-gray-200 transition-all`;

export default function Transactions() {
  const {
    transactions,
    paidTransactions,
    unpaidTransactions,
    year,
    month,
    metrics,
    currentBalance,
    accumulatedFutureBalance,
  } = useUser();

  const [transactionsSelected, setTransactionsSelected] = useState<
    ITransaction[] | null
  >(null);
  const [filterSelected, setFilterSelected] = useState<FilterProps>("all");
  const [filterName, setFilterName] = useState<string>("");

  useEffect(() => {
    handleFilter(filterSelected);
  }, [
    transactions,
    paidTransactions,
    unpaidTransactions,
    year,
    month,
    filterSelected,
  ]);

  const handleFilter = (filter: FilterProps) => {
    switch (filter) {
      case "all":
        setTransactionsSelected(transactions || []);
        break;
      case "revenues":
        setTransactionsSelected(
          transactions?.filter((t) => t.type === TransactionTypes.DEPOSIT) ||
            [],
        );
        break;
      case "expenses":
        setTransactionsSelected(
          transactions?.filter((t) => t.type === TransactionTypes.WITHDRAW) ||
            [],
        );
        break;
      case "paid":
        setTransactionsSelected(paidTransactions || []);
        break;
      case "unpaid":
        setTransactionsSelected(unpaidTransactions || []);
        break;
      default:
        setTransactionsSelected(transactions || []);
        break;
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredByName =
    transactionsSelected?.filter((t) =>
      t.description?.toUpperCase().includes(filterName.toUpperCase()),
    ) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={true}>Transações</Title>

      {/* Filtros de tipo */}
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { key: "all", label: "Todas" },
            { key: "revenues", label: "Receitas" },
            { key: "expenses", label: "Despesas" },
            { key: "paid", label: "Resolvidas" },
            { key: "unpaid", label: "Não Resolvidas" },
          ] as const
        ).map(({ key, label }) => (
          <li
            key={key}
            onClick={() => setFilterSelected(key)}
            className={`${styleFilter} ${
              filterSelected === key
                ? "bg-violet-800 text-gray-200"
                : "text-gray-400"
            }`}
          >
            {label}
          </li>
        ))}
      </ul>

      <div className="bg-gray-900 p-4 rounded-xl flex flex-col border border-gray-800">
        {/* Barra superior: título + busca */}
        <div className="flex gap-4 flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-gray-400 text-lg">Transações mensais</h3>
          <label
            className="flex items-center justify-between text-xs py-3 md:py-2 px-4
            border border-gray-800 rounded-full gap-2 w-full md:w-60"
          >
            <input
              className="focus:outline-none bg-transparent flex-1 text-gray-300
                placeholder:text-gray-600"
              type="text"
              placeholder="Pesquisar por nome..."
              onChange={(e) => setFilterName(e.target.value)}
            />
            <CiSearch className="h-5 w-5 text-gray-500 shrink-0" />
          </label>
        </div>

        {/* Mini cards de métricas */}
        <div className="flex justify-between w-full rounded-xl mb-5 border border-gray-700 bg-gray-800">
          <div className="p-4 w-full border-r border-r-gray-700 hidden md:block">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <h3 className="text-xs">Saldo atual</h3>
              <RiMoneyDollarCircleLine
                className={`h-5 w-5 ${
                  currentBalance > 0 ? "text-green-400" : "text-red-400"
                }`}
              />
            </div>
            <div
              className={`text-base font-semibold ${
                currentBalance > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {formatCurrency(currentBalance)}
            </div>
          </div>

          <div className="p-4 w-full border-r border-r-gray-700">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <h3 className="text-xs">Balanço mensal</h3>
              <LiaBalanceScaleLeftSolid
                className={`h-5 w-5 ${
                  metrics && metrics.futureBalance > 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              />
            </div>
            <div
              className={`text-base font-semibold ${
                metrics && metrics.futureBalance > 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {formatCurrency(metrics?.futureBalance || 0)}
            </div>
          </div>

          <div className="p-4 w-full">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <h3 className="text-xs">Projeção</h3>
              <GoGraph
                className={`h-5 w-5 ${
                  accumulatedFutureBalance > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              />
            </div>
            <div
              className={`text-base font-semibold ${
                accumulatedFutureBalance > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {formatCurrency(accumulatedFutureBalance)}
            </div>
          </div>
        </div>

        {/* Lista com sort habilitado */}
        <TransactionList transactions={filteredByName} hideSort={false} />
      </div>
    </div>
  );
}
