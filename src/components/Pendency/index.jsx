import "./pendency.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Pendency() {
  const [hasPendencyRevenues, setHasPendencyRevenues] = useState([]);
  const [hasPendencyExpenses, setHasPendencyExpenses] = useState([]);

  useEffect(() => {
    const transactionsLs = localStorage.getItem("@transactions");
    const parseTransactionsLs = JSON.parse(transactionsLs);
    const revenues = parseTransactionsLs.filter((e) => e.value > 0);
    const expenses = parseTransactionsLs.filter((e) => e.value < 0);

    function getPendency(array, stateArray) {
      const currentDate = new Date();

      const has = array
        .filter((e) => e.done === false)
        .filter((e) => {
          const dates = new Date(e.date);
          return dates < currentDate;
        });

      stateArray(has);
    }

    getPendency(revenues, setHasPendencyRevenues);
    getPendency(expenses, setHasPendencyExpenses);
  }, []);

  return (
    <div data-aos="zoom-in" className="container-pendency">
      {hasPendencyRevenues.length > 0 && (
        <Link
          to="/transactions/revenuesPendency"
          className="box-pendency bg-up"
        >
          <div>
            <strong>Receitas atrasadas</strong>
            <span>{hasPendencyRevenues.length}</span>
          </div>
          <h3>
            R${" "}
            {hasPendencyRevenues
              .map((e) => e.value)
              .reduce((a, i) => Number(a) + Number(i), [0])
              .toFixed(2)}
          </h3>
        </Link>
      )}
      {hasPendencyExpenses.length > 0 && (
        <Link
          to="/transactions/expensesPendency"
          className="box-pendency bg-down"
        >
          <div>
            <strong>Despesas atrasadas</strong>
            <span>{hasPendencyExpenses.length}</span>
          </div>
          <h3>
            R${" "}
            {hasPendencyExpenses
              .map((e) => e.value)
              .reduce((a, i) => Number(a) + Number(i), [0])
              .toFixed(2)}
          </h3>
        </Link>
      )}
    </div>
  );
}
