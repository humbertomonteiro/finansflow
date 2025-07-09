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
          transactions?.filter(
            (transaction) => transaction.type === TransactionTypes.DEPOSIT
          ) || []
        );
        break;
      case "expenses":
        setTransactionsSelected(
          transactions?.filter(
            (transaction) => transaction.type === TransactionTypes.WITHDRAW
          ) || []
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={true}>Transações</Title>

      <ul className="flex gap-2 overflow-x-auto">
        <li
          onClick={() => setFilterSelected("all")}
          className={`${styleFilter} ${
            filterSelected === "all"
              ? "bg-violet-800 text-gray-200"
              : "text-gray-400"
          }`}
        >
          Todas
        </li>
        <li
          onClick={() => setFilterSelected("revenues")}
          className={`${styleFilter} ${
            filterSelected === "revenues"
              ? "bg-violet-800 text-gray-200"
              : "text-gray-400"
          }`}
        >
          Receitas
        </li>
        <li
          onClick={() => setFilterSelected("expenses")}
          className={`${styleFilter} ${
            filterSelected === "expenses"
              ? "bg-violet-800 text-gray-200"
              : "text-gray-400"
          }`}
        >
          Despesas
        </li>
        <li
          onClick={() => setFilterSelected("paid")}
          className={`${styleFilter} ${
            filterSelected === "paid"
              ? "bg-violet-800 text-gray-200"
              : "text-gray-400"
          }`}
        >
          Resolvidas
        </li>
        <li
          onClick={() => setFilterSelected("unpaid")}
          className={`${styleFilter} ${
            filterSelected === "unpaid"
              ? "bg-violet-800 text-gray-200"
              : "text-gray-400"
          }`}
        >
          Não Resolvidas
        </li>
      </ul>

      <div className="bg-gray-900 p-4 rounded-xl flex flex-col border border-gray-800">
        <div className="flex gap-4 flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-gray-400 text-lg">Transações mensais</h3>
          <label className="flex items-center justify-between text-xs py-3 md:py-2 px-4 border border-gray-800 rounded-full gap-2 w-[99%] md:w-60">
            <input
              className=" focus:outline-none"
              type="text"
              placeholder="Pesquisar por nome..."
              onChange={(e) => setFilterName(e.target.value)}
            />
            <CiSearch className="h-5 w-5" />
          </label>
        </div>

        <div className="flex justify-between w-full rounded-xl mb-4 border border-gray-800">
          <div className="p-4 w-full border-r border-r-gray-700 hidden md:block">
            <div className="flex items-center justify-between text-gray-400">
              <h3 className="text-xs">Saldo atual</h3>
              <RiMoneyDollarCircleLine
                className={`h-6 w-6 ${
                  currentBalance > 0 ? "text-green-400" : "text-red-400"
                }`}
              />
            </div>

            <div
              className={`text-lg ${
                currentBalance > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {formatCurrency(currentBalance)}
            </div>
          </div>

          <div className="p-4 w-full border-r border-r-gray-700">
            <div className="flex items-center justify-between text-gray-400">
              <h3 className="text-xs">Balanço mensal</h3>
              <LiaBalanceScaleLeftSolid
                className={`h-6 w-6 ${
                  metrics && metrics?.futureBalance > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              />
            </div>

            <div
              className={`text-lg ${
                metrics && metrics?.futureBalance > 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {formatCurrency(metrics?.futureBalance || 0)}
            </div>
          </div>

          <div className="p-4 w-full">
            <div className="flex items-center justify-between text-gray-400">
              <h3 className="text-xs">Projeção</h3>
              <GoGraph
                className={`h-6 w-6 ${
                  accumulatedFutureBalance > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              />
            </div>

            <div
              className={`text-lg ${
                accumulatedFutureBalance > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {formatCurrency(accumulatedFutureBalance)}
            </div>
          </div>
        </div>

        {transactionsSelected && transactionsSelected.length > 0 ? (
          <TransactionList
            transactions={transactionsSelected.filter((transaction) =>
              transaction.description
                ?.toUpperCase()
                .includes(filterName.toUpperCase())
            )}
          />
        ) : (
          <p className="text-gray-400">Não há transações</p>
        )}
      </div>
    </div>
  );
}
