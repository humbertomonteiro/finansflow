"use client";

import { TransactionList } from "@/app/components/shared/TransactionList";
import { Title } from "@/app/components/shared/Title";
import { useUser } from "@/app/hooks/useUser";
import { useState, useEffect } from "react";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";

import { CiSearch } from "react-icons/ci";

type FilterProps = "all" | "revenues" | "expenses" | "paid" | "unpaid";

const styleFilter = `rounded-full bg-gray-900 text-gray-400 text-xs px-4 p-2 flex items-center text-nowrap 
  cursor-pointer hover:bg-violet-900 hover:text-gray-200 transition-all`;

export default function Transactions() {
  const { transactions, paidTransactions, unpaidTransactions, year, month } =
    useUser();
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

  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={true}>Transações</Title>

      <div className="flex justify-between flex-col md:flex-row ">
        <ul className="flex gap-2 overflow-x-auto pb-3 mb-3 md:mb-0 ml-1 md:pb-0">
          <li
            onClick={() => setFilterSelected("all")}
            className={`${styleFilter} ${
              filterSelected === "all" && "bg-violet-800"
            }`}
          >
            Todas
          </li>
          <li
            onClick={() => setFilterSelected("revenues")}
            className={`${styleFilter} ${
              filterSelected === "revenues" && "bg-violet-800"
            }`}
          >
            Receitas
          </li>
          <li
            onClick={() => setFilterSelected("expenses")}
            className={`${styleFilter} ${
              filterSelected === "expenses" && "bg-violet-800"
            }`}
          >
            Despesas
          </li>
          <li
            onClick={() => setFilterSelected("paid")}
            className={`${styleFilter} ${
              filterSelected === "paid" && "bg-violet-800"
            }`}
          >
            Pagas
          </li>
          <li
            onClick={() => setFilterSelected("unpaid")}
            className={`${styleFilter} ${
              filterSelected === "unpaid" && "bg-violet-800"
            }`}
          >
            Não pagas
          </li>
        </ul>
        <label className="flex items-center justify-between text-xs px-4 py-2 border border-gray-700 rounded-full gap-2 self-center w-[99%] md:w-60">
          <input
            className=" focus:outline-none"
            type="text"
            placeholder="Pesquisar por nome..."
            onChange={(e) => setFilterName(e.target.value)}
          />
          <CiSearch className="h-5 w-5" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
        {transactionsSelected && transactionsSelected.length > 0 ? (
          <TransactionList
            transactions={transactionsSelected.filter((transaction) =>
              transaction.description
                ?.toUpperCase()
                .includes(filterName.toUpperCase())
            )}
          />
        ) : (
          <p>Não há transações</p>
        )}
      </div>
    </div>
  );
}
