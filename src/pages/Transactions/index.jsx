import "./transactions.css";
import { useContext, useState, useEffect } from "react";
import { UserContext } from "../../contexts/user";
import Pendency from "../../components/Pendency";
import BtnMonth from "../../components/BtnMonth";
import { useParams } from "react-router-dom";
import NotificationBox from "../../components/NotificationBox";
import FormEditTransaction from "../../components/FormEditTransaction";
import ShowClient from "../../components/ShowClient";
import FilterTransactions from "../../components/FilterTransactions";
import FormAdd from "../../components/FormAdd";
import SearchTransactions from "../../components/SearchTransactions";
import Transaction from "../../components/Transaction";

const currentDate = new Date();

export default function Transactions() {
  const { type } = useParams();

  const [deleteTransaction, setDeleteTransaction] = useState(false);
  const [editTransaction, setEditTransaction] = useState(false);
  const [doneTransaction, setDoneTransaction] = useState(false);
  const [dataUser, setDataUser] = useState({});
  const [daysFilter, setDaysFilter] = useState([]);
  const [typeTransactions, setTypeTransactions] = useState([]);
  const [showClient, setShowClient] = useState(false);
  const [valueFormat, setValueFormat] = useState("");
  const [searchName, setSearchName] = useState("");

  const { transactions, monthSearch, yearSearch } = useContext(UserContext);

  useEffect(() => {
    function generationArraysByTypes() {
      const getTransactionsLs = localStorage.getItem("@transactions");
      const transactionsLs = JSON.parse(getTransactionsLs);
      const hasTransactions = transactionsLs === null ? [] : transactionsLs;

      let typeTransactions = hasTransactions.filter((t) => {
        if (type === "all") {
          return t;
        } else if (
          type === "revenues" ||
          type === "revenuesPendency" ||
          type === "clients"
        ) {
          return t.value > 0;
        } else if (type === "expenses" || type === "expensesPendency") {
          return t.value < 0;
        }
      });

      let allTransactions = typeTransactions
        .filter((search) => {
          if (searchName !== "") {
            let searchUpper = search.name.toUpperCase();
            return searchUpper.includes(searchName.toUpperCase());
          }
          return search;
        })
        .filter((e) => {
          let date = e.date.split("-");
          return (
            Number(date[0]) === yearSearch && Number(date[1]) === monthSearch
          );
        });

      let clientsTransactions = typeTransactions
        .filter((e) => e.category === "Cliente")
        .filter((e) => {
          const filterDate = new Date(e.date);
          return (
            filterDate.getMonth() + 1 === monthSearch &&
            filterDate.getFullYear() === yearSearch
          );
        });

      let pendencysTransactions = typeTransactions
        .filter((e) => e.done === false)
        .filter((e) => {
          const filterDate = new Date(e.date);
          return filterDate < currentDate;
        });

      if (type === "all" || type === "revenues" || type === "expenses") {
        generationDays(allTransactions);
      } else if (type === "clients") {
        generationDays(clientsTransactions);
      } else if (type === "revenuesPendency" || type === "expensesPendency") {
        generationDays(pendencysTransactions);
      }
    }

    generationArraysByTypes();
  }, [monthSearch, type, transactions, yearSearch, searchName]);

  function generationDays(array) {
    const days = array.map((e) => e.date.split("-")[2]);
    const daysNoRepeat = days.filter((e, a) => days.indexOf(e) === a);
    const daysDec = daysNoRepeat.sort((a, i) => {
      if (a > i) return 1;
      if (a < i) return -1;
      return 0;
    });

    setDaysFilter(daysDec);
    setTypeTransactions(array);
  }

  return (
    <main className="container-transactions">
      <div data-aos="zoom-out" className="board">
        <h1>Transações</h1>
        <p>
          Balanço mensal:
          <strong>
            R${" "}
            {Number(
              typeTransactions
                .map((e) => e.value)
                .reduce((a, i) => Number(a) + Number(i), [0])
            ).toFixed(2)}
          </strong>
        </p>
      </div>

      <Pendency />

      <FilterTransactions />

      <div data-aos="fade-down" className="transactions">
        {type !== "expensesPendency" && type !== "revenuesPendency" && (
          <BtnMonth />
        )}

        <SearchTransactions state={searchName} setState={setSearchName} />

        {daysFilter.length > 0 ? (
          daysFilter.map((d) => (
            <div className="transaction-day">
              <strong>Dia {d}</strong>

              {typeTransactions
                .filter((day) => {
                  return day.date.split("-")[2] === d;
                })
                .map((e) => (
                  <Transaction
                    data={e}
                    setState={setShowClient}
                    setData={setDataUser}
                    setDelete={setDeleteTransaction}
                    setEdit={setEditTransaction}
                    setSolve={setDoneTransaction}
                  />
                ))}
            </div>
          ))
        ) : (
          <div className="no-transactions">
            <h2>Sem transações este mês</h2>
          </div>
        )}
      </div>

      {deleteTransaction && (
        <NotificationBox
          setState={setDeleteTransaction}
          dataUser={dataUser}
          actionSelected={"delete"}
        />
      )}

      {doneTransaction && (
        <NotificationBox
          setState={setDoneTransaction}
          dataUser={dataUser}
          actionSelected={"solve"}
        />
      )}

      {editTransaction && (
        <FormEditTransaction
          setState={setEditTransaction}
          dataUser={dataUser}
          actionSelected={dataUser.category === "Cliente" ? "client" : "edit"}
        />
      )}

      {showClient && (
        <ShowClient setState={setShowClient} dataUser={dataUser} />
      )}

      <FormAdd />
    </main>
  );
}
